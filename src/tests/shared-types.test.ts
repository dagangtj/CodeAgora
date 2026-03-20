/**
 * #183 Shared Types Tests
 * Verifies that the new type files in @codeagora/shared work correctly.
 */

import { describe, it, expect } from 'vitest';
import { ok, err } from '@codeagora/shared/types/result.js';
import { SeveritySchema, SEVERITY_ORDER } from '@codeagora/shared/types/severity.js';
import { EvidenceDocumentSchema } from '@codeagora/shared/types/evidence.js';

// ============================================================================
// Result<T>
// ============================================================================

describe('Result<T>', () => {
  it('ok() returns success=true with data', () => {
    const result = ok(42);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(42);
    }
  });

  it('ok() works with object data', () => {
    const result = ok({ name: 'test', value: 100 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('test');
      expect(result.data.value).toBe(100);
    }
  });

  it('err() returns success=false with error', () => {
    const result = err('something went wrong');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('something went wrong');
    }
  });

  it('err() works with typed error objects', () => {
    const result = err({ code: 404, message: 'not found' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(404);
    }
  });

  it('ok() and err() produce discriminated union', () => {
    const results = [ok('hello'), err('oops')];
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
  });
});

// ============================================================================
// Severity
// ============================================================================

describe('Severity enum', () => {
  it('SeveritySchema accepts all valid values', () => {
    expect(SeveritySchema.parse('HARSHLY_CRITICAL')).toBe('HARSHLY_CRITICAL');
    expect(SeveritySchema.parse('CRITICAL')).toBe('CRITICAL');
    expect(SeveritySchema.parse('WARNING')).toBe('WARNING');
    expect(SeveritySchema.parse('SUGGESTION')).toBe('SUGGESTION');
  });

  it('SeveritySchema rejects invalid values', () => {
    expect(() => SeveritySchema.parse('UNKNOWN')).toThrow();
    expect(() => SeveritySchema.parse('critical')).toThrow(); // lowercase not accepted
    expect(() => SeveritySchema.parse('')).toThrow();
  });

  it('SEVERITY_ORDER has correct order: HARSHLY_CRITICAL first, SUGGESTION last', () => {
    expect(SEVERITY_ORDER[0]).toBe('HARSHLY_CRITICAL');
    expect(SEVERITY_ORDER[1]).toBe('CRITICAL');
    expect(SEVERITY_ORDER[2]).toBe('WARNING');
    expect(SEVERITY_ORDER[3]).toBe('SUGGESTION');
    expect(SEVERITY_ORDER).toHaveLength(4);
  });

  it('SEVERITY_ORDER contains all Severity enum values', () => {
    const enumValues = SeveritySchema.options;
    for (const val of enumValues) {
      expect(SEVERITY_ORDER).toContain(val);
    }
  });
});

// ============================================================================
// EvidenceDocumentSchema
// ============================================================================

describe('EvidenceDocumentSchema', () => {
  const validDoc = {
    issueTitle: 'SQL injection risk',
    problem: 'User input is directly interpolated into SQL query',
    evidence: ['Line 42: query = `SELECT * FROM users WHERE id = ${userId}`'],
    severity: 'CRITICAL' as const,
    suggestion: 'Use parameterized queries',
    filePath: 'src/db/users.ts',
    lineRange: [42, 42] as [number, number],
  };

  it('parses a valid EvidenceDocument', () => {
    const result = EvidenceDocumentSchema.safeParse(validDoc);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.issueTitle).toBe('SQL injection risk');
      expect(result.data.severity).toBe('CRITICAL');
    }
  });

  it('accepts optional source field: llm', () => {
    const result = EvidenceDocumentSchema.safeParse({ ...validDoc, source: 'llm' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('llm');
    }
  });

  it('accepts optional source field: rule', () => {
    const result = EvidenceDocumentSchema.safeParse({ ...validDoc, source: 'rule' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.source).toBe('rule');
    }
  });

  it('accepts optional confidence within [0, 100]', () => {
    const result = EvidenceDocumentSchema.safeParse({ ...validDoc, confidence: 85 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confidence).toBe(85);
    }
  });

  it('rejects confidence outside [0, 100]', () => {
    expect(EvidenceDocumentSchema.safeParse({ ...validDoc, confidence: -1 }).success).toBe(false);
    expect(EvidenceDocumentSchema.safeParse({ ...validDoc, confidence: 101 }).success).toBe(false);
  });

  it('rejects invalid severity', () => {
    const result = EvidenceDocumentSchema.safeParse({ ...validDoc, severity: 'HIGH' });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const { issueTitle: _, ...missingTitle } = validDoc;
    expect(EvidenceDocumentSchema.safeParse(missingTitle).success).toBe(false);

    const { filePath: __, ...missingFile } = validDoc;
    expect(EvidenceDocumentSchema.safeParse(missingFile).success).toBe(false);
  });

  it('rejects lineRange with wrong tuple length', () => {
    const result = EvidenceDocumentSchema.safeParse({ ...validDoc, lineRange: [42] });
    expect(result.success).toBe(false);
  });
});
