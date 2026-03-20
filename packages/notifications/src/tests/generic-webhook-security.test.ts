/**
 * Generic Webhook HMAC Security Tests (#189a)
 * Tests sendGenericWebhook() for secret validation, HTTPS enforcement,
 * and successful signed delivery.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendGenericWebhook } from '../generic-webhook.js';

// ============================================================================
// fetch mock
// ============================================================================

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ============================================================================
// Tests
// ============================================================================

describe('sendGenericWebhook — HMAC security', () => {
  it('sends a signed request when config is valid', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    await sendGenericWebhook(
      { url: 'https://example.com/hook', secret: 'supersecretvalue123' },
      'pipeline-complete',
      { result: 'ACCEPT' },
    );

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.com/hook');
    expect((init.headers as Record<string, string>)['X-CodeAgora-Signature']).toMatch(
      /^sha256=[0-9a-f]{64}$/,
    );
    expect((init.headers as Record<string, string>)['X-CodeAgora-Event']).toBe(
      'pipeline-complete',
    );
  });

  it('does not call fetch when secret is empty', async () => {
    await sendGenericWebhook(
      { url: 'https://example.com/hook', secret: '' },
      'pipeline-complete',
      {},
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not call fetch when secret is shorter than 16 characters', async () => {
    await sendGenericWebhook(
      { url: 'https://example.com/hook', secret: 'tooshort' },
      'pipeline-complete',
      {},
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not call fetch when secret is exactly 15 characters (boundary)', async () => {
    await sendGenericWebhook(
      { url: 'https://example.com/hook', secret: '123456789012345' }, // 15 chars
      'pipeline-complete',
      {},
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sends when secret is exactly 16 characters (min valid length)', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    await sendGenericWebhook(
      { url: 'https://example.com/hook', secret: '1234567890123456' }, // 16 chars
      'pipeline-complete',
      {},
    );
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('does not call fetch for HTTP URLs (HTTPS required)', async () => {
    await sendGenericWebhook(
      { url: 'http://example.com/hook', secret: 'supersecretvalue123' },
      'pipeline-complete',
      {},
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not call fetch for invalid URLs', async () => {
    await sendGenericWebhook(
      { url: 'not-a-url', secret: 'supersecretvalue123' },
      'pipeline-complete',
      {},
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('skips filtered events when events list does not include the event', async () => {
    await sendGenericWebhook(
      {
        url: 'https://example.com/hook',
        secret: 'supersecretvalue123',
        events: ['review-started'],
      },
      'pipeline-complete',
      {},
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sends when events list includes "all"', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    await sendGenericWebhook(
      {
        url: 'https://example.com/hook',
        secret: 'supersecretvalue123',
        events: ['all'],
      },
      'pipeline-complete',
      {},
    );
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});
