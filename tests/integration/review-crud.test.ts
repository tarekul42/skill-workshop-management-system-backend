/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it, mock, spyOn } from "bun:test";

mock.module("../../src/app/config/csrf.config", () => ({
  doubleCsrfProtection: (req: any, res: any, next: any) => next(),
  generateCsrfToken: () => "mocked-csrf-token",
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
import Review from "../../src/app/modules/review/review.model";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { ENROLLMENT_STATUS } from "../../src/app/modules/enrollment/enrollment.interface";
import { PAYMENT_STATUS } from "../../src/app/modules/payment/payment.interface";
import { generateToken } from "../../src/app/utils/jwt";
import { IsActive, UserRole } from "../../src/app/modules/user/user.interface";
import bcrypt from "bcryptjs";
import * as sslServiceModule from "../../src/app/modules/sslCommerz/sslCommerz.service";

describe("Review CRUD", () => {
  let mongoServer: MongoMemoryReplSet;
  let agent: any;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let workshopId: string;
  let enrollmentId: string;
  let reviewId: string;

  beforeAll(async () => {
    agent = request.agent(app);
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

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
    spyOn(sslServiceModule.default, "validatePayment").mockResolvedValue(true as any);

    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    const student = await User.create({
      name: "Review Student",
      email: "student@review.test",
      password: await bcrypt.hash("Password123!", 12),
      role: UserRole.STUDENT,
      phone: "1234567890",
      address: "123 Test St",
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });
    userId = student._id.toString();

    const admin = await User.create({
      name: "Review Admin",
      email: "admin@review.test",
      password: await bcrypt.hash("Password123!", 12),
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });

    userToken = generateToken(
      { userId, email: student.email, role: student.role },
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES,
    );
    adminToken = generateToken(
      { userId: admin._id.toString(), email: admin.email, role: admin.role },
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES,
    );

    const category = await Category.create({ name: "Testing", slug: "testing" });
    const level = await Level.create({ name: "All Levels" });

    const workshop = await WorkShop.create({
      title: "Review Test Workshop",
      description: "Workshop for review testing",
      price: 1000,
      maxSeats: 50,
      currentEnrollments: 1,
      category: category._id,
      level: level._id,
      createdBy: admin._id,
      location: "Online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      whatYouLearn: ["Testing reviews"],
      prerequisites: ["None"],
      benefits: ["Know how reviews work"],
      syllabus: ["Intro to reviews"],
    });
    workshopId = workshop._id.toString();

    // Create a completed enrollment so the user can review
    const enrollment = await Enrollment.create({
      user: userId,
      workshop: workshopId,
      status: ENROLLMENT_STATUS.COMPLETE,
      studentCount: 1,
      totalAmount: 1000,
    });
    enrollmentId = enrollment._id.toString();

    // Create a PAID payment so enrollment flow is realistic
    await Payment.create({
      enrollment: enrollmentId,
      transactionId: "REVIEW_TXN_" + Date.now(),
      amount: 1000,
      status: PAYMENT_STATUS.PAID,
    });

    await User.syncIndexes();
    await Category.syncIndexes();
    await Level.syncIndexes();
    await WorkShop.syncIndexes();
    await Enrollment.syncIndexes();
    await Payment.syncIndexes();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("GET /review/workshop/:workshopId", () => {
    it("should return empty reviews list initially", async () => {
      const res = await request(app).get(`/api/v1/review/workshop/${workshopId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe("POST /review", () => {
    it("should create a review", async () => {
      const res = await request(app)
        .post("/api/v1/review")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          workshop: workshopId,
          rating: 5,
          title: "Great Workshop!",
          content: "This was an amazing learning experience. Highly recommended!",
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data.rating).toBe(5);
      reviewId = res.body.data._id;
    });

    it("should reject duplicate review", async () => {
      const res = await request(app)
        .post("/api/v1/review")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          workshop: workshopId,
          rating: 4,
          title: "Also Great",
          content: "I really enjoyed this workshop too!",
        });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject review without auth", async () => {
      const res = await request(app).post("/api/v1/review").send({
        workshop: workshopId,
        rating: 3,
        title: "Unauthorized",
        content: "This should not work.",
      });
      expect(res.status).toBe(401);
    });

    it("should reject review with invalid data", async () => {
      const res = await request(app)
        .post("/api/v1/review")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ rating: 6 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /review/workshop/:workshopId/stats", () => {
    it("should return review stats", async () => {
      // Approve the review first (stats only count APPROVED reviews)
      await Review.findByIdAndUpdate(reviewId, { status: "APPROVED" });

      const res = await request(app).get(`/api/v1/review/workshop/${workshopId}/stats`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("averageRating");
      expect(res.body.data).toHaveProperty("totalReviews");
      expect(res.body.data).toHaveProperty("distribution");
      expect(res.body.data.totalReviews).toBe(1);
    });
  });

  describe("GET /review/workshop/:workshopId/my-review", () => {
    it("should return user's own review", async () => {
      const res = await request(app)
        .get(`/api/v1/review/workshop/${workshopId}/my-review`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(reviewId);
    });
  });

  describe("PATCH /review/:reviewId", () => {
    it("should update own review", async () => {
      const res = await request(app)
        .patch(`/api/v1/review/${reviewId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ rating: 4, title: "Updated: Great Workshop!" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rating).toBe(4);
    });

    it("should reject update by another user", async () => {
      const otherUser = await User.create({
        name: "Other User",
        email: "other@review.test",
        password: await bcrypt.hash("Password123!", 12),
        role: UserRole.STUDENT,
        isVerified: true,
        isActive: IsActive.ACTIVE,
      });
      const otherToken = generateToken(
        { userId: otherUser._id.toString(), email: otherUser.email, role: otherUser.role },
        envVariables.JWT_ACCESS_SECRET,
        envVariables.JWT_ACCESS_EXPIRES,
      );
      const res = await request(app)
        .patch(`/api/v1/review/${reviewId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ rating: 1 });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PATCH /review/:reviewId/status (admin)", () => {
    it("should moderate review status", async () => {
      const res = await request(app)
        .patch(`/api/v1/review/${reviewId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "APPROVED" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("DELETE /review/:reviewId", () => {
    it("should delete own review", async () => {
      const res = await request(app)
        .delete(`/api/v1/review/${reviewId}`)
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
