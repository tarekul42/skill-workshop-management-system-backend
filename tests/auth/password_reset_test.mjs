import { describe, expect, it } from 'bun:test';
import request from 'supertest';
import app from '../../src/app';

describe('Password Reset Flow Fix', () => {
  it('should not require oldPassword for /auth/reset-password', async () => {
    // 1. Hit the reset-password endpoint with no oldPassword
    const response = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        newPassword: 'NewSecurePassword123!',
      });

    // We expect a 401 or 403 depending on auth middleware, because we have no token.
    // If it returned 400 because of missing oldPassword validation, the test fails.
    expect(response.status).not.toBe(400);
    expect([401, 403, 500]).toContain(response.status);
  });
});

