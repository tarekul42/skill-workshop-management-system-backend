/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it, mock, spyOn } from "bun:test";

mock.module("../../src/app/config/csrf.config", () => ({
  doubleCsrfProtection: (req: any, res: any, next: any) => next(),
  generateCsrfToken: () => "mocked-csrf-token",
}));

const capturedEmails: any[] = [];
mock.module("../../src/app/utils/sendEmailDirect", () => ({
  sendEmailDirect: async (options: any) => {
    capturedEmails.push(options);
  },
}));

import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app";
import { connectRedis, redisClient } from "../../src/app/config/redis.config";
import User from "../../src/app/modules/user/user.model";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { IsActive, UserRole } from "../../src/app/modules/user/user.interface";
import bcrypt from "bcryptjs";

describe("OTP Flow", () => {
  let mongoServer: MongoMemoryReplSet;
  let agent: any;

  beforeAll(async () => {
    agent = request.agent(app);
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const redisStore = new Map<string, string>();
    spyOn(redisClient, "connect").mockResolvedValue({} as any);
    spyOn(redisClient, "get").mockImplementation((key: any) =>
      Promise.resolve(redisStore.get(String(key)) ?? null),
    );
    spyOn(redisClient, "set").mockImplementation((key: any, value: any, opts?: any) => {
      redisStore.set(String(key), value as string);
      return Promise.resolve("OK");
    });
    spyOn(redisClient, "del").mockImplementation((keys: any) => {
      const arr = Array.isArray(keys) ? keys : [keys];
      arr.forEach((k: any) => redisStore.delete(String(k)));
      return Promise.resolve(arr.length);
    });
    spyOn(redisClient, "incr").mockImplementation((key: any) => {
      const val = parseInt(redisStore.get(String(key)) ?? "0", 10) + 1;
      redisStore.set(String(key), String(val));
      return Promise.resolve(val);
    });
    spyOn(redisClient, "expire").mockResolvedValue(true as unknown as never);
    spyOn(redisClient, "ttl").mockImplementation((_key: any) =>
      Promise.resolve(-2 as unknown as never),
    );
    await connectRedis();

    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    await User.create({
      name: "Unverified User",
      email: "unverified@otp.test",
      password: await bcrypt.hash("Password123!", 12),
      role: UserRole.STUDENT,
      isVerified: false,
      isActive: IsActive.ACTIVE,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("POST /otp/send", () => {
    it("should send OTP to unverified user", async () => {
      const res = await agent.post("/api/v1/otp/send").send({
        email: "unverified@otp.test",
        name: "Unverified User",
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("OTP sent successfully");

      expect(capturedEmails.length).toBe(1);
      expect(capturedEmails[0].templateName).toBe("otp");
      expect(capturedEmails[0].to).toBe("unverified@otp.test");
    });

    it("should silently return for non-existent email (no enumeration)", async () => {
      const res = await agent.post("/api/v1/otp/send").send({
        email: "nonexistent@otp.test",
        name: "Ghost",
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return validation error for invalid email", async () => {
      const res = await agent.post("/api/v1/otp/send").send({
        email: "not-an-email",
        name: "Bad",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /otp/verify", () => {
    it("should verify OTP successfully", async () => {
      capturedEmails.length = 0;
      await agent.post("/api/v1/otp/send").send({
        email: "unverified@otp.test",
        name: "Unverified User",
      });

      const otp = capturedEmails[0].templateData.otp;

      const res = await agent.post("/api/v1/otp/verify").send({
        email: "unverified@otp.test",
        otp,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("OTP verified successfully");

      const user = await User.findOne({ email: "unverified@otp.test" });
      expect(user?.isVerified).toBe(true);

      expect(capturedEmails.length).toBe(2);
      expect(capturedEmails[1].templateName).toBe("welcome");
    });

    it("should reject invalid OTP", async () => {
      await User.create({
        name: "Invalid OTP User",
        email: "invalid-otp@test.test",
        password: await bcrypt.hash("Password123!", 12),
        role: UserRole.STUDENT,
        isVerified: false,
        isActive: IsActive.ACTIVE,
      });
      capturedEmails.length = 0;
      await agent.post("/api/v1/otp/send").send({
        email: "invalid-otp@test.test",
        name: "Invalid OTP User",
      });
      const res = await agent.post("/api/v1/otp/verify").send({
        email: "invalid-otp@test.test",
        otp: "000000",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject OTP for non-existent user (generic error, no enumeration)", async () => {
      const res = await agent.post("/api/v1/otp/verify").send({
        email: "ghost@otp.test",
        otp: "123456",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Invalid or expired OTP");
    });
  });
});
