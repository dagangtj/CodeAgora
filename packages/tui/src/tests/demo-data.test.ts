/**
 * Tests for packages/tui/src/demo-data.ts
 *
 * Validates that DEMO_RESULT satisfies the shape expected by the pipeline
 * and by the TUI screens that consume it, without relying on runtime Ink rendering.
 */

import { describe, it, expect } from 'vitest';
import { DEMO_RESULT } from '../demo-data.js';

describe('DEMO_RESULT', () => {
  it('has a non-empty sessionId string', () => {
    expect(typeof DEMO_RESULT.sessionId).toBe('string');
    expect(DEMO_RESULT.sessionId.length).toBeGreaterThan(0);
  });

  it('has status "success"', () => {
    expect(DEMO_RESULT.status).toBe('success');
  });

  it('has a summary object', () => {
    expect(DEMO_RESULT.summary).toBeDefined();
    expect(typeof DEMO_RESULT.summary).toBe('object');
  });

  it('summary.decision is a non-empty string', () => {
    expect(typeof DEMO_RESULT.summary?.decision).toBe('string');
    expect((DEMO_RESULT.summary?.decision ?? '').length).toBeGreaterThan(0);
  });

  it('summary.totalReviewers is a positive number', () => {
    expect(typeof DEMO_RESULT.summary?.totalReviewers).toBe('number');
    expect(DEMO_RESULT.summary!.totalReviewers).toBeGreaterThan(0);
  });

  it('summary.topIssues is a non-empty array', () => {
    expect(Array.isArray(DEMO_RESULT.summary?.topIssues)).toBe(true);
    expect(DEMO_RESULT.summary!.topIssues.length).toBeGreaterThan(0);
  });

  it('every topIssue has severity, filePath, lineRange, and title', () => {
    for (const issue of DEMO_RESULT.summary!.topIssues) {
      expect(typeof issue.severity).toBe('string');
      expect(typeof issue.filePath).toBe('string');
      expect(Array.isArray(issue.lineRange)).toBe(true);
      expect(issue.lineRange).toHaveLength(2);
      expect(typeof issue.title).toBe('string');
    }
  });

  it('every topIssue lineRange has numeric start and end', () => {
    for (const issue of DEMO_RESULT.summary!.topIssues) {
      const [start, end] = issue.lineRange;
      expect(typeof start).toBe('number');
      expect(typeof end).toBe('number');
      expect(start).toBeGreaterThan(0);
      expect(end).toBeGreaterThanOrEqual(start);
    }
  });

  it('every topIssue severity is one of the known values', () => {
    const knownSeverities = new Set(['HARSHLY_CRITICAL', 'CRITICAL', 'WARNING', 'SUGGESTION']);
    for (const issue of DEMO_RESULT.summary!.topIssues) {
      expect(knownSeverities.has(issue.severity)).toBe(true);
    }
  });

  it('summary.severityCounts entries match topIssues count per severity', () => {
    const counts: Record<string, number> = {};
    for (const issue of DEMO_RESULT.summary!.topIssues) {
      counts[issue.severity] = (counts[issue.severity] ?? 0) + 1;
    }
    const declared = DEMO_RESULT.summary!.severityCounts as Record<string, number>;
    for (const [severity, count] of Object.entries(counts)) {
      expect(declared[severity]).toBe(count);
    }
  });

  it('discussions is a non-empty array', () => {
    expect(Array.isArray(DEMO_RESULT.discussions)).toBe(true);
    expect(DEMO_RESULT.discussions!.length).toBeGreaterThan(0);
  });

  it('every discussion has required fields', () => {
    for (const disc of DEMO_RESULT.discussions!) {
      expect(typeof disc.discussionId).toBe('string');
      expect(typeof disc.filePath).toBe('string');
      expect(Array.isArray(disc.lineRange)).toBe(true);
      expect(typeof disc.finalSeverity).toBe('string');
      expect(typeof disc.reasoning).toBe('string');
      expect(typeof disc.consensusReached).toBe('boolean');
      expect(typeof disc.rounds).toBe('number');
    }
  });

  it('summary.totalDiscussions matches discussions array length', () => {
    expect(DEMO_RESULT.summary!.totalDiscussions).toBe(DEMO_RESULT.discussions!.length);
  });

  it('summary.resolved + summary.escalated equals totalDiscussions', () => {
    const { resolved, escalated, totalDiscussions } = DEMO_RESULT.summary!;
    expect((resolved ?? 0) + (escalated ?? 0)).toBe(totalDiscussions);
  });
});
