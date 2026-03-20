/**
 * CLI Sessions Keyword Search Tests (#78)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

import { listSessions } from '@codeagora/cli/commands/sessions.js';

// ============================================================================
// Helpers
// ============================================================================

async function makeSession(
  baseDir: string,
  date: string,
  sessionId: string,
  options?: {
    status?: string;
    verdict?: Record<string, unknown>;
  }
): Promise<string> {
  const sessionDir = path.join(baseDir, '.ca', 'sessions', date, sessionId);
  await fs.mkdir(sessionDir, { recursive: true });

  const metadata = {
    sessionId,
    date,
    timestamp: Date.now(),
    diffPath: '/tmp/test.patch',
    status: options?.status ?? 'completed',
    startedAt: Date.now(),
  };
  await fs.writeFile(path.join(sessionDir, 'metadata.json'), JSON.stringify(metadata));

  if (options?.verdict) {
    await fs.writeFile(
      path.join(sessionDir, 'head-verdict.json'),
      JSON.stringify(options.verdict)
    );
  }

  return sessionDir;
}

// ============================================================================
// listSessions with keyword search
// ============================================================================

describe('listSessions with keyword search', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ca-search-test-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('returns all sessions when no keyword is provided', async () => {
    await makeSession(tmpDir, '2026-03-13', '001', {
      verdict: { issues: [{ title: 'Missing null check' }] },
    });
    await makeSession(tmpDir, '2026-03-13', '002', {
      verdict: { issues: [{ title: 'SQL injection risk' }] },
    });

    const result = await listSessions(tmpDir, { limit: 10 });
    expect(result).toHaveLength(2);
  });

  it('includes session when keyword matches verdict content', async () => {
    await makeSession(tmpDir, '2026-03-13', '001', {
      verdict: { issues: [{ title: 'Missing null check' }] },
    });
    await makeSession(tmpDir, '2026-03-13', '002', {
      verdict: { issues: [{ title: 'SQL injection risk' }] },
    });

    const result = await listSessions(tmpDir, { keyword: 'null check' });
    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('001');
  });

  it('excludes session when keyword does not match', async () => {
    await makeSession(tmpDir, '2026-03-13', '001', {
      verdict: { issues: [{ title: 'Missing null check' }] },
    });

    const result = await listSessions(tmpDir, { keyword: 'memory leak' });
    expect(result).toHaveLength(0);
  });

  it('performs case-insensitive matching', async () => {
    await makeSession(tmpDir, '2026-03-13', '001', {
      verdict: { issues: [{ title: 'Missing Null Check' }] },
    });

    const upper = await listSessions(tmpDir, { keyword: 'NULL CHECK' });
    expect(upper).toHaveLength(1);

    const lower = await listSessions(tmpDir, { keyword: 'null check' });
    expect(lower).toHaveLength(1);

    const mixed = await listSessions(tmpDir, { keyword: 'Null Check' });
    expect(mixed).toHaveLength(1);
  });

  it('matches keyword against metadata fields', async () => {
    await makeSession(tmpDir, '2026-03-13', '001', { status: 'completed' });
    await makeSession(tmpDir, '2026-03-13', '002', { status: 'failed' });

    const result = await listSessions(tmpDir, { keyword: 'test.patch' });
    // Both sessions have diffPath: '/tmp/test.patch' in metadata
    expect(result).toHaveLength(2);
  });

  it('matches keyword in verdict when no metadata match', async () => {
    await makeSession(tmpDir, '2026-03-13', '001', {
      verdict: { issues: [{ title: 'Buffer overflow vulnerability' }] },
    });
    await makeSession(tmpDir, '2026-03-13', '002', {
      verdict: { issues: [{ title: 'Unused import' }] },
    });

    const result = await listSessions(tmpDir, { keyword: 'overflow' });
    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('001');
  });

  it('returns empty when keyword matches nothing', async () => {
    await makeSession(tmpDir, '2026-03-13', '001', {
      verdict: { issues: [{ title: 'Issue A' }] },
    });

    const result = await listSessions(tmpDir, { keyword: 'xyznonexistent' });
    expect(result).toHaveLength(0);
  });

  it('combines keyword with other filters', async () => {
    await makeSession(tmpDir, '2026-03-13', '001', {
      status: 'completed',
      verdict: { issues: [{ title: 'Missing null check' }] },
    });
    await makeSession(tmpDir, '2026-03-13', '002', {
      status: 'failed',
      verdict: { issues: [{ title: 'Missing null check' }] },
    });

    const result = await listSessions(tmpDir, { keyword: 'null', status: 'completed' });
    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('001');
    expect(result[0].status).toBe('completed');
  });

  it('handles sessions without verdict files when searching', async () => {
    await makeSession(tmpDir, '2026-03-13', '001', { status: 'completed' });

    // Should still search metadata — 'completed' is in metadata
    const result = await listSessions(tmpDir, { keyword: 'completed' });
    expect(result).toHaveLength(1);
  });

  it('respects limit after keyword filtering', async () => {
    for (let i = 1; i <= 5; i++) {
      await makeSession(tmpDir, '2026-03-13', String(i).padStart(3, '0'), {
        verdict: { issues: [{ title: 'Common issue' }] },
      });
    }

    const result = await listSessions(tmpDir, { keyword: 'Common', limit: 3 });
    expect(result).toHaveLength(3);
  });
});
