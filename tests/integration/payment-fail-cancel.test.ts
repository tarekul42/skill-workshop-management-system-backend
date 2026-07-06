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
import { ENROLLMENT_STATUS } from "../../src/app/modules/enrollment/enrollment.interface";
import { PAYMENT_STATUS } from "../../src/app/modules/payment/payment.interface";
import { generateToken } from "../../src/app/utils/jwt";
import { IsActive, UserRole } from "../../src/app/modules/user/user.interface";
import bcrypt from "bcryptjs";
import * as sslServiceModule from "../../src/app/modules/sslCommerz/sslCommerz.service";

describe("Payment Fail / Cancel", () => {
  let mongoServer: MongoMemoryReplSet;
  let agent: any;
  let userToken: string;
  let userId: string;
  let workshopId: string;
  let enrollmentId: string;
  let transactionId: string;

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

    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    const student = await User.create({
      name: "Payment Student",
      email: "student@payment.test",
      password: await bcrypt.hash("Password123!", 12),
      role: UserRole.STUDENT,
      phone: "1234567890",
      address: "123 Test St",
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });
    userId = student._id.toString();

    userToken = generateToken(
      { userId, email: student.email, role: student.role },
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES,
    );

    const category = await Category.create({ name: "Payment", slug: "payment" });
    const level = await Level.create({ name: "Beginner" });

    const workshop = await WorkShop.create({
      title: "Payment Test Workshop",
      description: "Workshop for payment fail/cancel testing",
      price: 2000,
      maxSeats: 50,
      currentEnrollments: 1,
      category: category._id,
      level: level._id,
      createdBy: student._id,
      location: "Online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      whatYouLearn: ["Payment testing"],
      prerequisites: ["None"],
      benefits: ["Know payment flows"],
      syllabus: ["Intro to payments"],
    });
    workshopId = workshop._id.toString();

    // Create enrollment
    const enrollmentRes = await agent
      .post("/api/v1/enrollment")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ workshop: workshopId, studentCount: 1 });
    enrollmentId = enrollmentRes.body.data.enrollment._id;

    // Init payment to get transaction ID
    const paymentRes = await agent
      .post(`/api/v1/payment/init-payment/${enrollmentId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});
    const payment = await Payment.findOne({ enrollment: enrollmentId });
    transactionId = payment!.transactionId;

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

  describe("Payment Fail", () => {
    it("1. Should fail an unpaid payment", async () => {
      const res = await agent.get(
        `/api/v1/payment/fail?transactionId=${transactionId}`,
      );
      expect(res.status).toBe(302);

      const updatedPayment = await Payment.findOne({ transactionId });
      expect(updatedPayment?.status).toBe(PAYMENT_STATUS.FAILED);

      const updatedEnrollment = await Enrollment.findById(enrollmentId);
      expect(updatedEnrollment?.status).toBe(ENROLLMENT_STATUS.FAILED);
    });

    it("2. Should be idempotent on second fail attempt", async () => {
      const res = await agent.get(
        `/api/v1/payment/fail?transactionId=${transactionId}`,
      );
      expect(res.status).toBe(302);

      const payment = await Payment.findOne({ transactionId });
      expect(payment?.status).toBe(PAYMENT_STATUS.FAILED);
    });

    it("3. Should return 400 for missing transactionId", async () => {
      const res = await agent.get("/api/v1/payment/fail");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Payment Cancel", () => {
    let cancelTxnId: string;

    beforeAll(async () => {
      // Create fresh enrollment + payment for cancel test
      const workshop2 = await WorkShop.create({
        title: "Cancel Test Workshop",
        description: "Workshop for cancel testing",
        price: 3000,
        maxSeats: 50,
        currentEnrollments: 0,
        category: await Category.findOne(),
        level: await Level.findOne(),
        createdBy: new mongoose.Types.ObjectId(userId),
        location: "Online",
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        whatYouLearn: ["Cancel testing"],
        prerequisites: ["None"],
        benefits: ["Know cancel flow"],
        syllabus: ["Intro to cancel"],
      });
      const ws2Id = workshop2._id.toString();

      const enrollRes = await agent
        .post("/api/v1/enrollment")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ workshop: ws2Id, studentCount: 1 });
      const eId = enrollRes.body.data.enrollment._id;

      await agent
        .post(`/api/v1/payment/init-payment/${eId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({});

      const payment = await Payment.findOne({ enrollment: eId });
      cancelTxnId = payment!.transactionId;
    });

    it("4. Should cancel an unpaid payment", async () => {
      const res = await agent.get(
        `/api/v1/payment/cancel?transactionId=${cancelTxnId}`,
      );
      expect(res.status).toBe(302);

      const updatedPayment = await Payment.findOne({ transactionId: cancelTxnId });
      expect(updatedPayment?.status).toBe(PAYMENT_STATUS.CANCELLED);

      const updatedEnrollment = await Enrollment.findOne({
        transactionId: cancelTxnId,
      });
    });

    it("5. Should be idempotent on second cancel attempt", async () => {
      const res = await agent.get(
        `/api/v1/payment/cancel?transactionId=${cancelTxnId}`,
      );
      expect(res.status).toBe(302);

      const payment = await Payment.findOne({ transactionId: cancelTxnId });
      expect(payment?.status).toBe(PAYMENT_STATUS.CANCELLED);
    });
  });
});
