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

// Mock CSRF Protection BEFORE importing app or router
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
import { ENROLLMENT_STATUS } from "../../src/app/modules/enrollment/enrollment.interface";
import Enrollment from "../../src/app/modules/enrollment/enrollment.model";
import { PAYMENT_STATUS } from "../../src/app/modules/payment/payment.interface";
import Payment from "../../src/app/modules/payment/payment.model";
import { generateToken } from "../../src/app/utils/jwt";

// Using require to mock modules since Bun's import mocking can be tricky sometimes
// But since we are testing via HTTP (supertest), we need to spy on the exact instances used by the app.
// Another approach is to mock the module BEFORE importing app.
import { mailQueue } from "../../src/app/jobs/mail.queue";
import * as sslServiceModule from "../../src/app/modules/sslCommerz/sslCommerz.service";
import * as sendEmailDirectModule from "../../src/app/utils/sendEmailDirect";

// Create spies on the actual imported modules that the app uses.
const sslInitSpy = spyOn(
  sslServiceModule.default,
  "sslPaymentInit",
).mockResolvedValue({
  GatewayPageURL: "http://dummy-sslcommerz-gateway.com/pay",
} as any);

const validatePaymentSpy = spyOn(
  sslServiceModule.default,
  "validatePayment",
).mockResolvedValue(true as any);

// Spy on mailQueue to verify invoice jobs without actually pushing to BullMQ
const mailQueueSpy = spyOn(mailQueue, "add").mockResolvedValue({} as any);

// Spy on sendEmailDirect to verify invoice email is attempted (works without USE_BULLMQ)
const sendEmailDirectSpy = spyOn(
  sendEmailDirectModule,
  "sendEmailDirect",
).mockResolvedValue(undefined as any);

describe("Integration: Enrollment -> Payment Flow", () => {
  let userToken: string;
  let userId: string;
  let workshopId: string;
  let enrollmentId: string;
  let transactionId: string;
  let mongoServer: MongoMemoryReplSet;

  // Change type to any to bypass supertest types bug
  let agent: any;

  beforeAll(async () => {
    // Create an agent to persist cookies (like session and csrf)
    agent = request.agent(app);

    // Connect to test database using MongoMemoryReplSet to support transactions
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    // Connect Redis (Assuming local redis or mocked via other means. If connection fails, it might log an error but shouldn't crash if we are lucky. Wait, I should mock redis client connection).
    spyOn(redisClient, "connect").mockResolvedValue({} as any);
    spyOn(redisClient, "get").mockResolvedValue(null);
    spyOn(redisClient, "set").mockResolvedValue("OK");
    await connectRedis();

    // Clear existing data for a clean test state using dropDatabase
    // This prevents Transaction transient lock errors that happen with deleteMany
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    // 1. Create a Student User
    const student = await User.create({
      name: "Test Student",
      email: "student@integration.test",
      password: "Password123!", // assuming hashing happens in pre-save
      role: "STUDENT",
      phone: "1234567890",
      address: "123 Test St",
      isVerified: true,
      isActive: "ACTIVE",
    });
    userId = student._id.toString();

    // Generate valid access token for authorization headers
    userToken = generateToken(
      { userId: userId, email: student.email, role: student.role },
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES,
    );

    // 2. Create Category and Level
    const category = await Category.create({ name: "Tech", slug: "tech" });
    const level = await Level.create({ name: "Beginner" });

    // 3. Create a Workshop
    const workshop = await WorkShop.create({
      title: "Integration Test Workshop",
      description: "A workshop for testing the main flow",
      price: 1500,
      maxSeats: 50,
      category: category._id,
      level: level._id,
      createdBy: student._id,
      location: "Online",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      whatYouLearn: ["Testing", "Integration"],
      prerequisites: ["None"],
      benefits: ["Skill"],
      syllabus: ["Intro"],
    });
    workshopId = workshop._id.toString();

    // Ensure all background operations like index building are complete before testing
    await User.syncIndexes();
    await Category.syncIndexes();
    await Level.syncIndexes();
    await WorkShop.syncIndexes();
    await Enrollment.syncIndexes();
    await Payment.syncIndexes();

    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    // Cleanup mocks
    sslInitSpy.mockRestore();
    validatePaymentSpy.mockRestore();
    mailQueueSpy.mockRestore();
    sendEmailDirectSpy.mockRestore();

    // Close connections
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
    // We mocked redisClient.connect, no need to disconnect a blocked client. But we can restore.
  });

  it("1. Should successfully enroll the student in a workshop", async () => {
    const response = await agent
      .post("/api/v1/enrollment")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        workshop: workshopId,
        studentCount: 1,
      });

    // eslint-disable-next-line no-console
    console.log("Enrollment Response:", JSON.stringify(response.body, null, 2));

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.enrollment.status).toBe("PENDING");

    enrollmentId = response.body.data.enrollment._id;
  });

  it("2. Should initialize payment for the enrollment", async () => {
    const response = await agent
      .post(`/api/v1/payment/init-payment/${enrollmentId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.paymentUrl).toBe(
      "http://dummy-sslcommerz-gateway.com/pay",
    );
    expect(sslInitSpy).toHaveBeenCalled();

    // Fetch payment to get the transaction ID for the next step
    const payment = await Payment.findOne({ enrollment: enrollmentId });
    expect(payment).toBeTruthy();
    if (payment) {
      transactionId = payment.transactionId;
      expect(payment.status).toBe(PAYMENT_STATUS.UNPAID); // PAYMENT_STATUS.UNPAID
    }
  });

  it("3. Should validate a successful payment via IPN URL and enqueue invoice", async () => {
    const val_id = "TEST_VALIDATION_ID_" + Date.now();

    const response = await agent
      .post(`/api/v1/payment/success?transactionId=${transactionId}`)
      .send({
        status: "VALID",
        tran_id: transactionId,
        val_id: val_id,
        amount: "1500",
        card_type: "VISA",
        store_amount: "1450",
        bank_tran_id: "BANK123",
        status_code: "200",
        currency: "BDT",
      });

    expect(response.status).toBe(302); // Redirects to Success Frontend URL
    expect(validatePaymentSpy).toHaveBeenCalled();

    // Verify Business Logic side-effects in Database
    const updatedPayment = await Payment.findOne({ transactionId });
    expect(updatedPayment?.status).toBe(PAYMENT_STATUS.PAID);

    const updatedEnrollment = await Enrollment.findById(enrollmentId);
    expect(updatedEnrollment?.status).toBe(ENROLLMENT_STATUS.COMPLETE);

    // Verify the invoice email was attempted via sendEmailDirect
    expect(sendEmailDirectSpy).toHaveBeenCalled();
    const emailCall = sendEmailDirectSpy.mock.calls[0];
    if (emailCall) {
      expect(emailCall[0].templateName).toBe("invoice");
      expect(emailCall[0].templateData?.transactionId).toBe(transactionId);
      expect(emailCall[0].templateData?.totalAmount).toBe(1500);
    }
  });
});
