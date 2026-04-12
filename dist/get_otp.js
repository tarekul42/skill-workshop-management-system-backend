"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_config_1 = require("../src/app/config/redis.config");
async function getOtp(email) {
    try {
        await (0, redis_config_1.connectRedis)();
        const otp = await redis_config_1.redisClient.get(`otp:${email}`);
        console.log(`OTP for ${email}: ${otp}`);
    }
    catch (err) {
        console.error("Error retrieving OTP:", err);
    }
    finally {
        await redis_config_1.redisClient.disconnect();
    }
}
const email = process.argv[2] || "test-route-test@example.com";
getOtp(email);
