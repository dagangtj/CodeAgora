/**
 * Severity system (V3)
 */

import { z } from 'zod';

export const SeveritySchema = z.enum([
  'HARSHLY_CRITICAL',
  'CRITICAL',
  'WARNING',
  'SUGGESTION',
]);
export type Severity = z.infer<typeof SeveritySchema>;

export const SEVERITY_ORDER = ['HARSHLY_CRITICAL', 'CRITICAL', 'WARNING', 'SUGGESTION'] as const;
