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
import User from "../../src/app/modules/user/user.model";
import { Category } from "../../src/app/modules/category/category.model";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { generateToken } from "../../src/app/utils/jwt";
import { IsActive, UserRole } from "../../src/app/modules/user/user.interface";

describe("Category CRUD", () => {
  let mongoServer: MongoMemoryReplSet;
  let agent: any;
  let adminToken: string;

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
      email: "admin@category.test",
      password: "Password123!",
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });

    adminToken = generateToken(
      { userId: admin._id.toString(), email: admin.email, role: admin.role },
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES,
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("POST /category/create", () => {
    it("should create a category as admin", async () => {
      const res = await request(app)
        .post("/api/v1/category/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Web Development" });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data.name).toBe("Web Development");
    });

    it("should reject category creation without auth", async () => {
      const res = await request(app)
        .post("/api/v1/category/create")
        .send({ name: "Unauthorized Category" });
      expect(res.status).toBe(401);
    });

    it("should reject category creation with empty name", async () => {
      const res = await request(app)
        .post("/api/v1/category/create")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /category", () => {
    it("should list all categories", async () => {
      const res = await request(app).get("/api/v1/category");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });
});
