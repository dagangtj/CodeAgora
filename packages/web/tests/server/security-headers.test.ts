/**
 * Security Headers & Rate Limiter Tests (#178)
 * Tests securityHeaders middleware, rateLimiter middleware, and error handler
 * using Hono's app.request() helper.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';

// ============================================================================
// Helpers
// ============================================================================

async function buildApp() {
  vi.resetModules();
  const { securityHeaders, rateLimiter } = await import(
    '../../src/server/middleware.js'
  );

  const app = new Hono();
  app.use('*', securityHeaders);
  app.use('*', rateLimiter);
  app.get('/api/test', (c) => c.json({ ok: true }));
  app.put('/api/write', (c) => c.json({ ok: true }));
  return app;
}

// ============================================================================
// Security Headers Tests
// ============================================================================

describe('securityHeaders middleware', () => {
  it('sets X-Content-Type-Options: nosniff', async () => {
    const app = await buildApp();
    const res = await app.request('/api/test');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('sets X-Frame-Options: DENY', async () => {
    const app = await buildApp();
    const res = await app.request('/api/test');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('sets Content-Security-Policy header', async () => {
    const app = await buildApp();
    const res = await app.request('/api/test');
    const csp = res.headers.get('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
  });

  it('sets Referrer-Policy header', async () => {
    const app = await buildApp();
    const res = await app.request('/api/test');
    expect(res.headers.get('Referrer-Policy')).toBeTruthy();
  });
});

// ============================================================================
// Rate Limiter Tests
// ============================================================================

describe('rateLimiter middleware', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 429 after more than 100 read requests from same IP', async () => {
    const app = await buildApp();
    const ip = `test-rate-limit-read-${Date.now()}`;
    let lastStatus = 200;

    // Send 101 requests; the 101st should be rate limited
    for (let i = 0; i < 101; i++) {
      const res = await app.request('/api/test', {
        headers: { 'x-forwarded-for': ip },
      });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });

  it('returns 429 after more than 10 write (PUT) requests from same IP', async () => {
    const app = await buildApp();
    const ip = `test-rate-limit-write-${Date.now()}`;
    let lastStatus = 200;

    // Send 11 PUT requests; the 11th should be rate limited
    for (let i = 0; i < 11; i++) {
      const res = await app.request('/api/write', {
        method: 'PUT',
        headers: { 'x-forwarded-for': ip },
      });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });

  it('allows reads up to the limit without 429', async () => {
    const app = await buildApp();
    const ip = `test-rate-limit-ok-${Date.now()}`;

    // Send exactly 100 requests — all should pass
    for (let i = 0; i < 100; i++) {
      const res = await app.request('/api/test', {
        headers: { 'x-forwarded-for': ip },
      });
      expect(res.status).toBe(200);
    }
  });
});

// ============================================================================
// Error Handler Logic Tests (unit-level)
// ============================================================================

// ============================================================================
// Error Handler Logic Tests (direct invocation)
// ============================================================================

describe('errorHandler middleware — error message hiding', () => {
  /**
   * Call errorHandler directly with a minimal mock Context.
   * next() throws the provided error.
   */
  async function callErrorHandler(
    error: Error,
    nodeEnv: string,
  ): Promise<{ status: number; body: unknown }> {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', nodeEnv);

    const { errorHandler: handler } = await import('../../src/server/middleware.js');

    let capturedStatus = 0;
    let capturedBody: unknown = null;

    const fakeCtx = {
      req: { path: '/boom' },
      res: new Response('ok'),
      json(body: unknown, status: number) {
        capturedStatus = status;
        capturedBody = body;
        return new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    } as never;

    const next = async () => { throw error; };
    await handler(fakeCtx, next);

    vi.unstubAllEnvs();
    return { status: capturedStatus, body: capturedBody };
  }

  it('returns "Internal server error" in production (hides real message)', async () => {
    const err = Object.assign(new Error('secret detail'), { status: 500 });
    const { status, body } = await callErrorHandler(err, 'production');
    expect(status).toBe(500);
    expect((body as { error: string }).error).toBe('Internal server error');
  });

  it('does not expose internal error message in production', async () => {
    const err = Object.assign(new Error('secret internal message'), { status: 500 });
    const { body } = await callErrorHandler(err, 'production');
    expect(JSON.stringify(body)).not.toContain('secret internal message');
  });

  it('exposes real error message in development', async () => {
    const err = Object.assign(new Error('secret internal message'), { status: 500 });
    const { status, body } = await callErrorHandler(err, 'development');
    expect(status).toBe(500);
    expect((body as { error: string }).error).toBe('secret internal message');
  });
});
