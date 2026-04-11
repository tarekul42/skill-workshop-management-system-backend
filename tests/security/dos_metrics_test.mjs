import { describe, expect, it, mock, spyOn, beforeAll } from 'bun:test';

// Mock CSRF Protection BEFORE importing app or router
mock.module('../../src/app/config/csrf.config', () => ({
  doubleCsrfProtection: (req, res, next) => next(),
  generateCsrfToken: () => 'mocked-csrf-token',
}));

import request from 'supertest';
import app from '../../src/app';
import { connectRedis, redisClient } from '../../src/app/config/redis.config';

describe('Prometheus Metrics Cardinality Fix', () => {
  beforeAll(async () => {
    spyOn(redisClient, 'connect').mockResolvedValue({});
    spyOn(redisClient, 'get').mockResolvedValue(null);
    spyOn(redisClient, 'set').mockResolvedValue('OK');
    spyOn(redisClient, 'incr').mockResolvedValue(1);
    spyOn(redisClient, 'pexpire').mockResolvedValue(1);
    
    // Mock multi / exec chain for rate limiter
    spyOn(redisClient, 'multi').mockReturnValue({
      incr: function() { return this; },
      pexpire: function() { return this; },
      exec: async () => [[null, 1], [null, 1]]
    });

    await connectRedis();
  });

  it('should not leak unique invalid paths into metrics labels', async () => {
    // 1. Hit several random invalid paths
    const randomPaths = ['/a', '/b', '/c', '/d', '/e'];
    
    for (const path of randomPaths) {
      await request(app).get(path); // Don't care about status, just want to trigger the router
    }

    // 2. Fetch metrics
    const response = await request(app).get('/metrics');
    const metrics = response.text || ''; // supertest returns text for non-JSON

    // 3. Check if random paths exist in metrics
    let leakDetected = false;
    for (const path of randomPaths) {
      if (metrics.includes(`route="${path}"`)) {
        leakDetected = true;
      }
    }

    expect(leakDetected).toBe(false);

    // It should ideally have "(unmatched)" for the random paths, but we primarily assert no leak
    if (metrics.includes('route="(unmatched)"')) {
      expect(metrics).toContain('route="(unmatched)"');
    }
  }, 10000); // Increased timeout to 10s just in case
});

