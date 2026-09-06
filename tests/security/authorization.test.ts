/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it, mock, spyOn } from "bun:test";

mock.module("../../src/app/config/csrf.config", () => ({
  doubleCsrfProtection: (req: any, res: any, next: any) => next(),
  generateCsrfToken: () => "mocked-csrf-token",
}));

mock.module("../../src/app/utils/sendEmail", () => ({
  default: async () => undefined,
}));

import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app";
import envVariables from "../../src/app/config/env";
import { connectRedis, redisClient } from "../../src/app/config/redis.config";
import { Category } from "../../src/app/modules/category/category.model";
import User from "../../src/app/modules/user/user.model";
import { Level, WorkShop } from "../../src/app/modules/workshop/workshop.model";
import Enrollment from "../../src/app/modules/enrollment/enrollment.model";
import Payment from "../../src/app/modules/payment/payment.model";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { generateToken } from "../../src/app/utils/jwt";
import { IsActive, UserRole } from "../../src/app/modules/user/user.interface";
import bcrypt from "bcryptjs";
import * as sslServiceModule from "../../src/app/modules/sslCommerz/sslCommerz.service";

describe("Authorization & Data Exposure (Phase 2)", () => {
  let mongoServer: MongoMemoryReplSet;
  let agent: any;
  let ownerToken: string;
  let otherToken: string;
  let adminToken: string;
  let ownerId: string;
  let otherId: string;
  let workshopId: string;
  let transactionId: string;

  const assertNoPasswordHash = (obj: any, depth = 0): void => {
    if (!obj || typeof obj !== "object" || depth > 6) return;
    expect(obj.password).toBeUndefined();
    expect(obj.$__).toBeUndefined();
    if (Array.isArray(obj)) {
      obj.forEach((item) => assertNoPasswordHash(item, depth + 1));
    } else {
      Object.values(obj).forEach((value) => assertNoPasswordHash(value, depth + 1));
    }
  };

  beforeAll(async () => {
    agent = request.agent(app);
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri());

    spyOn(redisClient, "connect").mockResolvedValue({} as any);
    spyOn(redisClient, "get").mockResolvedValue(null);
    spyOn(redisClient, "set").mockResolvedValue("OK");
    spyOn(redisClient, "del").mockResolvedValue(1);
    spyOn(redisClient, "incr").mockResolvedValue(1);
    spyOn(redisClient, "expire").mockResolvedValue(true as unknown as never);
    await connectRedis();

    spyOn(sslServiceModule.default, "sslPaymentInit").mockResolvedValue({
      GatewayPageURL: "http://dummy-sslcommerz-gateway.com/pay",
    } as any);

    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    const hashed = await bcrypt.hash("Password123!", 12);
    const owner = await User.create({
      name: "Owner Student",
      email: "owner@authz.test",
      password: hashed,
      role: UserRole.STUDENT,
      phone: "0123456789",
      address: "1 Test St",
      age: 25,
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });
    ownerId = owner._id.toString();

    const other = await User.create({
      name: "Other Student",
      email: "other@authz.test",
      password: hashed,
      role: UserRole.STUDENT,
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });
    otherId = other._id.toString();

    const admin = await User.create({
      name: "Authz Admin",
      email: "admin@authz.test",
      password: hashed,
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });

    const mkToken = (u: { _id: any; email: string; role: string }) =>
      generateToken(
        { userId: u._id.toString(), email: u.email, role: u.role },
        envVariables.JWT_ACCESS_SECRET,
        envVariables.JWT_ACCESS_EXPIRES,
      );
    ownerToken = mkToken(owner);
    otherToken = mkToken(other);
    adminToken = mkToken(admin);

    const category = await Category.create({ name: "Authz", slug: "authz" });
    const level = await Level.create({ name: "Authz Level" });

    const workshop = await WorkShop.create({
      title: "Authz Test Workshop",
      description: "Workshop for authorization testing",
      price: 500,
      maxSeats: 50,
      currentEnrollments: 0,
      category: category._id,
      level: level._id,
      createdBy: admin._id,
      location: "Online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      whatYouLearn: ["Testing"],
      prerequisites: ["None"],
      benefits: ["Security"],
      syllabus: ["Intro"],
    });
    workshopId = workshop._id.toString();

    // Owner enrolls and initiates a payment so a real transaction exists
    const enrollmentRes = await agent
      .post("/api/v1/enrollment")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ workshop: workshopId, studentCount: 1 });
    const enrollmentId = enrollmentRes.body.data.enrollment._id;

    await agent
      .post(`/api/v1/payment/init-payment/${enrollmentId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({});

    const payment = await Payment.findOne({ enrollment: enrollmentId });
    transactionId = payment!.transactionId;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("Payment status ownership (IDOR)", () => {
    it("owner can read their own payment status", async () => {
      const res = await agent
        .get(`/api/v1/payment/status?transactionId=${transactionId}`)
        .set("Authorization", `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.transactionId).toBe(transactionId);
    });

    it("another authenticated user gets 403 for someone else's transaction", async () => {
      const res = await agent
        .get(`/api/v1/payment/status?transactionId=${transactionId}`)
        .set("Authorization", `Bearer ${otherToken}`);
      expect(res.status).toBe(403);
      expect(res.body.data).toBeUndefined();
    });

    it("admin can read any payment status", async () => {
      const res = await agent
        .get(`/api/v1/payment/status?transactionId=${transactionId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBeDefined();
    });

    it("unknown transaction id returns 404 without leaking info", async () => {
      const res = await agent
        .get("/api/v1/payment/status?transactionId=does-not-exist")
        .set("Authorization", `Bearer ${otherToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("Password hash never leaves the server", () => {
    it("GET /user/me does not expose the password hash", async () => {
      const res = await agent
        .get("/api/v1/user/me")
        .set("Authorization", `Bearer ${ownerToken}`);
      expect(res.status).toBe(200);
      assertNoPasswordHash(res.body.data);
    });

    it("GET /user/:id does not expose the password hash", async () => {
      const res = await agent
        .get(`/api/v1/user/${otherId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      assertNoPasswordHash(res.body.data);
    });

    it("GET /user/all-users ignores ?fields=password projection bypass", async () => {
      const res = await agent
        .get("/api/v1/user/all-users?fields=name,email,password")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      assertNoPasswordHash(res.body.data);
    });

    it("GET /user/all-users ignores ?password=... filter oracle", async () => {
      const res = await agent
        .get("/api/v1/user/all-users?password=Password123!")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      // The bogus filter must be ignored entirely — all users are returned.
      expect(res.body.meta.total).toBeGreaterThanOrEqual(3);
    });

    it("GET /user/all-users still honors whitelisted filters", async () => {
      const res = await agent
        .get("/api/v1/user/all-users?role=STUDENT")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
      res.body.data.forEach((u: any) => expect(u.role).toBe("STUDENT"));
    });
  });

  describe("Registration anti-enumeration", () => {
    it("duplicate email returns a generic error message", async () => {
      const res = await agent.post("/api/v1/user/register").send({
        name: "Dup User",
        email: "owner@authz.test",
        password: "AnotherPassword123!",
      });
      expect([200, 409]).toContain(res.status);
      const msg: string = res.body.message ?? "";
      expect(msg.toLowerCase()).not.toContain("already exists");
      expect(msg.toLowerCase()).not.toContain("user exists");
    });
  });
});
