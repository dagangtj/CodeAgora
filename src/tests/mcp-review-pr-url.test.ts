/**
 * MCP review_pr tool — GitHub PR URL regex validation
 *
 * The schema validates: /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/
 */

import { describe, it, expect } from 'vitest';

// The regex as defined in packages/mcp/src/tools/review-pr.ts
const PR_URL_REGEX = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/;

describe('review_pr URL regex', () => {
  // ---- valid URLs ----

  it('accepts a well-formed GitHub PR URL', () => {
    expect(PR_URL_REGEX.test('https://github.com/owner/repo/pull/123')).toBe(true);
  });

  it('accepts a PR URL with numeric owner/repo names', () => {
    expect(PR_URL_REGEX.test('https://github.com/org123/my-repo/pull/1')).toBe(true);
  });

  it('accepts a PR URL with hyphenated repo name', () => {
    expect(PR_URL_REGEX.test('https://github.com/my-org/my-repo/pull/9999')).toBe(true);
  });

  // ---- invalid URLs ----

  it('rejects a non-GitHub domain', () => {
    expect(PR_URL_REGEX.test('https://gitlab.com/owner/repo/pull/1')).toBe(false);
  });

  it('rejects an internal IP address URL', () => {
    expect(PR_URL_REGEX.test('https://192.168.1.1/owner/repo/pull/1')).toBe(false);
  });

  it('rejects localhost URL', () => {
    expect(PR_URL_REGEX.test('https://localhost/owner/repo/pull/1')).toBe(false);
  });

  it('rejects HTTP (non-HTTPS) URL', () => {
    expect(PR_URL_REGEX.test('http://github.com/owner/repo/pull/1')).toBe(false);
  });

  it('rejects a GitHub URL missing the pull segment', () => {
    expect(PR_URL_REGEX.test('https://github.com/owner/repo/issues/1')).toBe(false);
  });

  it('rejects a GitHub URL with a non-numeric PR number', () => {
    expect(PR_URL_REGEX.test('https://github.com/owner/repo/pull/abc')).toBe(false);
  });

  it('rejects a GitHub URL with extra path segments after PR number', () => {
    expect(PR_URL_REGEX.test('https://github.com/owner/repo/pull/1/files')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(PR_URL_REGEX.test('')).toBe(false);
  });

  it('rejects a URL with a github.com subdomain (github.company.com)', () => {
    expect(PR_URL_REGEX.test('https://github.company.com/owner/repo/pull/1')).toBe(false);
  });

  it('rejects a URL with path traversal in owner segment', () => {
    expect(PR_URL_REGEX.test('https://github.com/../etc/repo/pull/1')).toBe(false);
  });
});
