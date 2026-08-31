/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it, spyOn } from "bun:test";

/**
 * Phase 3 regression: multi-session refresh tokens + reuse detection.
 *
 * Tests the core token utilities directly (userTokens.ts) with a mocked
 * Redis Map, avoiding express/session middleware complexities.  This gives
 * full control over the refresh-key lifecycle while remaining fast and
 * independent of a real Redis server.
 */
import mongoose from "mongoose";
import {
  createUserTokens,
  createNewAccessToken,
  revokeAllRefreshTokens,
  revokeRefreshSession,
} from "../../src/app/utils/userTokens";
import envVariables from "../../src/app/config/env";
import { redisClient } from "../../src/app/config/redis.config";
import User from "../../src/app/modules/user/user.model";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import bcrypt from "bcryptjs";

// Shared in-memory Redis emulation
const kv = new Map<string, string>();

beforeAll(async () => {
  // Connect MongoMemoryReplSet
  const mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongoServer.getUri());

  // Mock Redis client methods
  spyOn(redisClient, "connect").mockResolvedValue({} as any);
  spyOn(redisClient, "get").mockImplementation(async (key: string) =>
    kv.has(key) ? (kv.get(key) as string) : null,
  );
  spyOn(redisClient, "set").mockImplementation(
    async (key: string, value: string) => {
      kv.set(key, value);
      return "OK" as any;
    },
  );
  spyOn(redisClient, "del").mockImplementation(async (...args: any[]) => {
    const keys = args.flat().map(String);
    let removed = 0;
    for (const key of keys) {
      if (kv.delete(key)) removed++;
    }
    return removed as any;
  });
  spyOn(redisClient, "expire").mockResolvedValue(true as unknown as never);
  spyOn(redisClient, "scanIterator").mockImplementation(async function* (
    opts?: { MATCH?: string },
  ) {
    const match = opts?.MATCH ?? "*";
    const regex = new RegExp(
      "^" +
        match
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/\*/g, ".*")
          .replace(/\?/g, ".")
        + "$",
    );
    for (const key of [...kv.keys()]) {
      if (regex.test(key)) yield key;
    }
  } as any);

  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }

  await User.create({
    name: "Session User",
    email: "session@phase3.test",
    password: await bcrypt.hash("Password123!", 12),
    role: "STUDENT",
    isVerified: true,
    isActive: "ACTIVE",
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});

const makePayload = (userId: string) => ({
  _id: userId,
  email: "session@phase3.test",
  role: "STUDENT" as const,
});

describe("Refresh token sessions (userTokens.ts)", () => {
  it("creates independent sessions per call (multi-device)", async () => {
    kv.clear();
    const user = await User.findOne({ email: "session@phase3.test" });
    const userId = String(user!._id);

    const s1 = await createUserTokens(makePayload(userId));
    const s2 = await createUserTokens(makePayload(userId));

    expect(s1.refreshToken).not.toBe(s2.refreshToken);
    expect(kv.size).toBe(2);

    // Revoking session 1 must not affect session 2
    const revoked1 = await revokeRefreshSession(s1.refreshToken);
    expect(revoked1).toBe(true);
    expect(kv.size).toBe(1);

    // Session 2 still works
    const rotated = await createNewAccessToken(s2.refreshToken);
    expect(rotated.accessToken).toBeDefined();
    expect(rotated.refreshToken).toBeDefined();
  });

  it("rotates tokens and invalidates the previous generation", async () => {
    kv.clear();
    const user = await User.findOne({ email: "session@phase3.test" });
    const userId = String(user!._id);

    const s = await createUserTokens(makePayload(userId));
    const keysBefore = kv.size;

    const rotated = await createNewAccessToken(s.refreshToken);
    expect(rotated.accessToken).not.toBe(s.accessToken);
    expect(kv.size).toBe(keysBefore); // old key replaced by new

    // Old token is invalid
    await expect(createNewAccessToken(s.refreshToken)).rejects.toThrow(
      "Invalid or expired refresh token",
    );
  });

  it("reuse detection revokes ALL sessions of the user", async () => {
    kv.clear();
    const user = await User.findOne({ email: "session@phase3.test" });
    const userId = String(user!._id);

    const s1 = await createUserTokens(makePayload(userId));
    const s2 = await createUserTokens(makePayload(userId));
    expect(kv.size).toBe(2);

    // Rotate session 1
    const rotated = await createNewAccessToken(s1.refreshToken);
    expect(kv.size).toBe(2); // old replaced by new

    // Replay the consumed token → theft signal
    await expect(createNewAccessToken(s1.refreshToken)).rejects.toThrow(
      "Invalid or expired refresh token",
    );

    // All sessions revoked (including s2)
    expect(kv.size).toBe(0);
    await expect(createNewAccessToken(rotated.refreshToken)).rejects.toThrow(
      "Invalid or expired refresh token",
    );
  });

  it("revokeAllRefreshTokens clears every session for a user", async () => {
    kv.clear();
    const user = await User.findOne({ email: "session@phase3.test" });
    const userId = String(user!._id);

    await createUserTokens(makePayload(userId));
    await createUserTokens(makePayload(userId));
    expect(kv.size).toBe(2);

    await revokeAllRefreshTokens(userId);
    expect(kv.size).toBe(0);
  });

  it("revokeRefreshSession only removes its own session", async () => {
    kv.clear();
    const user = await User.findOne({ email: "session@phase3.test" });
    const userId = String(user!._id);

    const s1 = await createUserTokens(makePayload(userId));
    const s2 = await createUserTokens(makePayload(userId));
    expect(kv.size).toBe(2);

    const revoked = await revokeRefreshSession(s1.refreshToken);
    expect(revoked).toBe(true);
    expect(kv.size).toBe(1);

    // s2 still valid
    const rotated = await createNewAccessToken(s2.refreshToken);
    expect(rotated.accessToken).toBeDefined();
  });

  it("revokeRefreshSession returns true for a valid but already-rotated token", async () => {
    kv.clear();
    const user = await User.findOne({ email: "session@phase3.test" });
    const userId = String(user!._id);

    const s = await createUserTokens(makePayload(userId));
    await createNewAccessToken(s.refreshToken); // rotate away

    // Token is still a valid JWT; key is already gone → true (idempotent)
    const revoked = await revokeRefreshSession(s.refreshToken);
    expect(revoked).toBe(true);
    expect(kv.size).toBe(1); // only the rotated session remains
  });
});
