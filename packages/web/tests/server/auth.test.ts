/**
 * Auth Middleware Tests
 * Tests authMiddleware and getAuthToken() using Hono's app.request() helper.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build a minimal Hono app that applies authMiddleware globally and exposes
 * two routes mirroring the real server:
 *   GET /api/health  — should be exempt from auth
 *   GET /api/sessions — should require auth
 */
async function buildApp() {
  // Re-import middleware fresh so the module picks up the stubbed env value.
  const { authMiddleware } = await import('../../src/server/middleware.js');

  const app = new Hono();
  app.use('/api/*', authMiddleware);
  app.get('/api/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/sessions', (c) => c.json([]));
  return app;
}

// ============================================================================
// Tests
// ============================================================================

describe('authMiddleware', () => {
  describe('with a known token set via env', () => {
    const KNOWN_TOKEN = 'test-token-abc123';

    beforeEach(() => {
      vi.stubEnv('CODEAGORA_DASHBOARD_TOKEN', KNOWN_TOKEN);
      // Invalidate the cached module so the new env value is picked up.
      vi.resetModules();
    });

    it('GET /api/health — accessible without any token', async () => {
      const app = await buildApp();
      const res = await app.request('/api/health');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
    });

    it('GET /api/sessions — returns 401 when no Authorization header', async () => {
      const app = await buildApp();
      const res = await app.request('/api/sessions');
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Authentication required');
    });

    it('GET /api/sessions — returns 401 when Authorization header is not Bearer scheme', async () => {
      const app = await buildApp();
      const res = await app.request('/api/sessions', {
        headers: { Authorization: `Basic ${KNOWN_TOKEN}` },
      });
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Authentication required');
    });

    it('GET /api/sessions — returns 403 for wrong Bearer token', async () => {
      const app = await buildApp();
      const res = await app.request('/api/sessions', {
        headers: { Authorization: 'Bearer wrong-token' },
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Invalid token');
    });

    it('GET /api/sessions — returns 200 for correct Bearer token', async () => {
      const app = await buildApp();
      const res = await app.request('/api/sessions', {
        headers: { Authorization: `Bearer ${KNOWN_TOKEN}` },
      });
      expect(res.status).toBe(200);
    });
  });

  describe('getAuthToken()', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('returns the env token when CODEAGORA_DASHBOARD_TOKEN is set', async () => {
      vi.stubEnv('CODEAGORA_DASHBOARD_TOKEN', 'my-fixed-token');
      const { getAuthToken } = await import('../../src/server/middleware.js');
      expect(getAuthToken()).toBe('my-fixed-token');
    });

    it('auto-generates a 64-char hex token when env var is not set', async () => {
      vi.unstubAllEnvs();
      // Ensure the var is absent.
      delete process.env['CODEAGORA_DASHBOARD_TOKEN'];
      const { getAuthToken } = await import('../../src/server/middleware.js');
      const token = getAuthToken();
      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('returns the same value on repeated calls (stable within module lifetime)', async () => {
      vi.stubEnv('CODEAGORA_DASHBOARD_TOKEN', 'stable-token');
      const { getAuthToken } = await import('../../src/server/middleware.js');
      expect(getAuthToken()).toBe(getAuthToken());
    });
  });
});
