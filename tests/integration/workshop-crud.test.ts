/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

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
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { generateToken } from "../../src/app/utils/jwt";
import { IsActive, UserRole } from "../../src/app/modules/user/user.interface";

describe("Workshop CRUD", () => {
  let mongoServer: MongoMemoryReplSet;
  let agent: any;
  let adminToken: string;
  let instructorToken: string;
  let categoryId: string;
  let levelId: string;
  let workshopId: string;

  beforeAll(async () => {
    agent = request.agent(app);
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    spyOn(redisClient, "connect").mockResolvedValue({} as any);
    spyOn(redisClient, "get").mockResolvedValue(null);
    spyOn(redisClient, "set").mockResolvedValue("OK");
    await connectRedis();

    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    const admin = await User.create({
      name: "Admin User",
      email: "admin@workshop.test",
      password: "Password123!",
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });

    const instructor = await User.create({
      name: "Instructor User",
      email: "instructor@workshop.test",
      password: "Password123!",
      role: UserRole.INSTRUCTOR,
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });

    adminToken = generateToken(
      { userId: admin._id.toString(), email: admin.email, role: admin.role },
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES,
    );

    instructorToken = generateToken(
      {
        userId: instructor._id.toString(),
        email: instructor.email,
        role: instructor.role,
      },
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES,
    );

    const category = await Category.create({ name: "Development", slug: "development" });
    categoryId = category._id.toString();

    const level = await Level.create({ name: "Advanced" });
    levelId = level._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("POST /workshop/create", () => {
    it("should create a workshop as admin", async () => {
      const res = await request(app)
        .post("/api/v1/workshop/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Test Workshop",
          description: "A workshop for testing",
          price: 1000,
          category: categoryId,
          level: levelId,
          location: "Online",
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
          whatYouLearn: ["Node.js", "Testing"],
          prerequisites: ["Basic JS"],
          benefits: ["Skill upgrade"],
          syllabus: ["Week 1: Intro", "Week 2: Advanced"],
          maxSeats: 50,
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("_id");
      workshopId = res.body.data._id;
    });

    it("should reject workshop creation without auth", async () => {
      const res = await request(app).post("/api/v1/workshop/create").send({
        title: "Unauthorized Workshop",
      });
      expect(res.status).toBe(401);
    });

    it("should reject workshop creation with invalid data", async () => {
      const res = await request(app)
        .post("/api/v1/workshop/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /workshop", () => {
    it("should list all workshops", async () => {
      const res = await request(app).get("/api/v1/workshop");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it("should support pagination", async () => {
      const res = await request(app).get("/api/v1/workshop?page=1&limit=10");
      expect(res.status).toBe(200);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
    });
  });

  describe("GET /workshop/:slug", () => {
    it("should get workshop by slug", async () => {
      const res = await request(app).get("/api/v1/workshop/test-workshop");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 404 for non-existent slug", async () => {
      const res = await request(app).get("/api/v1/workshop/non-existent-slug");
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /workshop/:id", () => {
    it("should update workshop as admin", async () => {
      const res = await request(app)
        .patch(`/api/v1/workshop/${workshopId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ price: 1500 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("DELETE /workshop/:id", () => {
    it("should soft-delete workshop as admin", async () => {
      const res = await request(app)
        .delete(`/api/v1/workshop/${workshopId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /workshop/levels", () => {
    it("should list all levels", async () => {
      const res = await request(app).get("/api/v1/workshop/levels");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });

  describe("POST /workshop/create-level", () => {
    it("should create a level as admin", async () => {
      const res = await request(app)
        .post("/api/v1/workshop/create-level")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Intermediate" });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should reject level creation as non-admin", async () => {
      const res = await request(app)
        .post("/api/v1/workshop/create-level")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({ name: "Beginner" });
      expect(res.status).toBe(403);
    });
  });
});
