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

// Mock CSRF Protection BEFORE importing app
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
import Enrollment from "../../src/app/modules/enrollment/enrollment.model";
import Payment from "../../src/app/modules/payment/payment.model";
import { generateToken } from "../../src/app/utils/jwt";

import { mailQueue } from "../../src/app/jobs/mail.queue";
import * as sslServiceModule from "../../src/app/modules/sslCommerz/sslCommerz.service";
import { IsActive, UserRole } from "../../src/app/modules/user/user.interface";

const sslInitSpy = spyOn(
  sslServiceModule.default,
  "sslPaymentInit",
).mockResolvedValue({
  GatewayPageURL: "http://dummy-sslcommerz-gateway.com/pay",
} as any);

const mailQueueSpy = spyOn(mailQueue, "add").mockResolvedValue({} as any);

describe("Integration: Concurrent Enrollment Race Condition", () => {
  let workshopId: string;
  let mongoServer: MongoMemoryReplSet;

  beforeAll(async () => {
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

    // Create a category and level
    const category = await Category.create({ name: "Concurrency", slug: "concurrency" });
    const level = await Level.create({ name: "Beginner" });

    // Create a workshop with only 2 seats
    const workshop = await WorkShop.create({
      title: "Limited Seats Workshop",
      description: "Only 2 seats available",
      price: 500,
      maxSeats: 2,
      category: category._id,
      level: level._id,
      createdBy: new mongoose.Types.ObjectId(),
      location: "Online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
    });
    workshopId = workshop._id.toString();

    await WorkShop.syncIndexes();
    await Enrollment.syncIndexes();
    await Payment.syncIndexes();
    await User.syncIndexes();

    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    sslInitSpy.mockRestore();
    mailQueueSpy.mockRestore();
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it("should allow exactly 2 enrollments when 10 concurrent students try to book 2 seats", async () => {
    // Create 10 student users concurrently
    const studentPromises = Array.from({ length: 10 }, (_, i) =>
      User.create({
        name: `Student ${i + 1}`,
        email: `concurrent-student-${i + 1}@test.com`,
        password: "Password123!",
        role: UserRole.STUDENT,
        phone: `123456789${i}`,
        address: `${i + 1} Test St`,
        isVerified: true,
        isActive: IsActive.ACTIVE,
      }),
    );
    const students = await Promise.all(studentPromises);

    // Generate tokens for all students
    const tokens = students.map((student) =>
      generateToken(
        { userId: student._id.toString(), email: student.email, role: student.role as string },
        envVariables.JWT_ACCESS_SECRET,
        envVariables.JWT_ACCESS_EXPIRES,
      ),
    );

    // Fire 10 concurrent enrollment requests
    const enrollmentPromises = tokens.map((token, i) =>
      request(app)
        .post("/api/v1/enrollment")
        .set("Authorization", `Bearer ${token}`)
        .send({
          workshop: workshopId,
          studentCount: 1,
        })
        .then((res) => ({ index: i, status: res.status, body: res.body })),
    );

    const results = await Promise.all(enrollmentPromises);

    // Count successes (201) and failures
    const successes = results.filter((r) => r.status === 201);
    const failures = results.filter((r) => r.status !== 201);

    // Verify exactly 2 succeeded
    expect(successes.length).toBe(2);
    expect(failures.length).toBe(8);

    // Verify all failures are "fully booked" errors
    for (const failure of failures) {
      expect(failure.body.message).toContain("fully booked");
    }

    // Verify the workshop's currentEnrollments is exactly 2
    const updatedWorkshop = await WorkShop.findById(workshopId);
    expect(updatedWorkshop?.currentEnrollments).toBe(2);

    // Verify exactly 2 enrollments exist in the database
    const enrollmentCount = await Enrollment.countDocuments({
      workshop: workshopId,
      isDeleted: { $ne: true },
    });
    expect(enrollmentCount).toBe(2);
  });
});
