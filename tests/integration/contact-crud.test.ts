/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it, mock, spyOn } from "bun:test";

mock.module("../../src/app/config/csrf.config", () => ({
  doubleCsrfProtection: (req: any, res: any, next: any) => next(),
  generateCsrfToken: () => "mocked-csrf-token",
}));

import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { connectRedis, redisClient } from "../../src/app/config/redis.config";
import User from "../../src/app/modules/user/user.model";
import Contact from "../../src/app/modules/contact/contact.model";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { generateToken } from "../../src/app/utils/jwt";
import envVariables from "../../src/app/config/env";
import { IsActive, UserRole } from "../../src/app/modules/user/user.interface";
import bcrypt from "bcryptjs";

describe("Contact CRUD", () => {
  let mongoServer: MongoMemoryReplSet;
  let agent: any;
  let adminToken: string;
  let adminId: string;
  let contactId: string;

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

    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    const admin = await User.create({
      name: "Admin User",
      email: "admin@contact.test",
      password: await bcrypt.hash("Password123!", 12),
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });
    adminId = admin._id.toString();

    adminToken = generateToken(
      { userId: adminId, email: admin.email, role: admin.role },
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES,
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("POST /contact (public)", () => {
    it("should create a contact message", async () => {
      const res = await agent.post("/api/v1/contact").send({
        name: "John Doe",
        email: "john@example.com",
        subject: "Workshop Inquiry",
        message: "I would like to know more about the upcoming React workshop.",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data.name).toBe("John Doe");
      contactId = res.body.data._id;
    });

    it("should reject invalid contact data", async () => {
      const res = await agent.post("/api/v1/contact").send({
        name: "J",
        email: "bad",
        subject: "AB",
        message: "short",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /contact (admin)", () => {
    it("should list all contacts", async () => {
      const res = await request(app)
        .get("/api/v1/contact")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("should reject listing without auth", async () => {
      const res = await request(app).get("/api/v1/contact");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /contact/:contactId (admin)", () => {
    it("should get contact by ID", async () => {
      const res = await request(app)
        .get(`/api/v1/contact/${contactId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(contactId);
    });

    it("should return 404 for non-existent contact", async () => {
      const res = await request(app)
        .get("/api/v1/contact/000000000000000000000000")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /contact/:contactId/read (admin)", () => {
    it("should mark contact as read", async () => {
      const res = await request(app)
        .patch(`/api/v1/contact/${contactId}/read`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });
  });

  describe("DELETE /contact/:contactId (admin)", () => {
    it("should soft-delete a contact", async () => {
      const res = await request(app)
        .delete(`/api/v1/contact/${contactId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
