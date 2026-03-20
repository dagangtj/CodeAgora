/**
 * Discord SSRF / Webhook URL Validation Tests (#189b)
 * Tests validateWebhookUrl() from webhook.ts for URL validation,
 * HTTPS enforcement, and allowed-host domain checks that prevent SSRF.
 */

import { describe, it, expect } from 'vitest';
import { validateWebhookUrl } from '../webhook.js';

// ============================================================================
// Tests
// ============================================================================

describe('validateWebhookUrl — SSRF prevention', () => {
  // Valid Discord webhook URLs
  it('accepts a valid discord.com webhook URL', () => {
    expect(() =>
      validateWebhookUrl(
        'https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz',
      ),
    ).not.toThrow();
  });

  it('accepts a valid discordapp.com webhook URL', () => {
    expect(() =>
      validateWebhookUrl(
        'https://discordapp.com/api/webhooks/1234567890/token',
      ),
    ).not.toThrow();
  });

  it('accepts a valid hooks.slack.com webhook URL', () => {
    expect(() =>
      validateWebhookUrl(
        'https://hooks.slack.com/services/TTEST/BTEST/fake-test-placeholder',
      ),
    ).not.toThrow();
  });

  // HTTP URLs must be blocked
  it('rejects HTTP discord.com URL (must be HTTPS)', () => {
    expect(() =>
      validateWebhookUrl('http://discord.com/api/webhooks/123/token'),
    ).toThrow('HTTPS');
  });

  it('rejects HTTP hooks.slack.com URL', () => {
    expect(() =>
      validateWebhookUrl('http://hooks.slack.com/services/T/B/X'),
    ).toThrow('HTTPS');
  });

  // Internal / private IP addresses — blocked via disallowed host check
  it('rejects 127.0.0.1 (loopback) — not in allowed host list', () => {
    expect(() =>
      validateWebhookUrl('https://127.0.0.1/hook'),
    ).toThrow();
  });

  it('rejects 10.x.x.x (private range) — not in allowed host list', () => {
    expect(() =>
      validateWebhookUrl('https://10.0.0.1/hook'),
    ).toThrow();
  });

  it('rejects 192.168.x.x (private range) — not in allowed host list', () => {
    expect(() =>
      validateWebhookUrl('https://192.168.1.1/hook'),
    ).toThrow();
  });

  it('rejects 169.254.x.x (link-local) — not in allowed host list', () => {
    expect(() =>
      validateWebhookUrl('https://169.254.169.254/latest/meta-data'),
    ).toThrow();
  });

  // Arbitrary external hosts
  it('rejects arbitrary external HTTPS host', () => {
    expect(() =>
      validateWebhookUrl('https://evil.example.com/steal'),
    ).toThrow();
  });

  it('rejects invalid URL string', () => {
    expect(() => validateWebhookUrl('not-a-url')).toThrow();
  });

  // Subdomain must match (e.g. *.discord.com is allowed)
  it('accepts subdomains of discord.com', () => {
    expect(() =>
      validateWebhookUrl('https://canary.discord.com/api/webhooks/1/tok'),
    ).not.toThrow();
  });

  // Host spoofing via path — must be blocked
  it('rejects URL where host is attacker.com but path contains discord.com', () => {
    expect(() =>
      validateWebhookUrl('https://attacker.com/discord.com/hook'),
    ).toThrow();
  });
});
