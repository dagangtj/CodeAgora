/**
 * Hardcoded pipeline result for demo/portfolio mode.
 * Simulates a completed review of an Express.js + React web application
 * with realistic security and quality findings.
 */

import type { PipelineResult } from '@codeagora/core/pipeline/orchestrator.js';

/**
 * Build a topIssue entry with an extra `suggestion` field.
 * The formal PipelineSummary type only declares severity/filePath/lineRange/title,
 * but ResultsScreen reads `suggestion` dynamically via `'suggestion' in issue`.
 */
function issue(
  severity: string,
  filePath: string,
  lineRange: [number, number],
  title: string,
  suggestion: string,
): { severity: string; filePath: string; lineRange: [number, number]; title: string; suggestion: string } {
  return { severity, filePath, lineRange, title, suggestion };
}

export const DEMO_RESULT: PipelineResult = {
  sessionId: 'demo-20260326-001',
  date: '2026-03-26',
  status: 'success',
  summary: {
    decision: 'NEEDS_HUMAN',
    reasoning: 'Multiple critical security vulnerabilities found that require immediate attention before deployment.',
    totalReviewers: 4,
    forfeitedReviewers: 0,
    severityCounts: {
      HARSHLY_CRITICAL: 2,
      CRITICAL: 4,
      WARNING: 5,
      SUGGESTION: 4,
    },
    topIssues: [
      // ── HARSHLY_CRITICAL (2) ──────────────────────────────────────────────
      issue(
        'HARSHLY_CRITICAL',
        'src/routes/auth.ts',
        [45, 52],
        'SQL injection via unsanitized user input in login query',
        'Use parameterized queries or an ORM. Replace string concatenation with prepared statements: db.query("SELECT * FROM users WHERE email = $1", [email]).',
      ),
      issue(
        'HARSHLY_CRITICAL',
        'src/config/database.ts',
        [12, 12],
        'Hardcoded database credentials exposed in source control',
        'Move credentials to environment variables and load via process.env. Add the config file to .gitignore and rotate the compromised credentials immediately.',
      ),

      // ── CRITICAL (4) ─────────────────────────────────────────────────────
      issue(
        'CRITICAL',
        'src/middleware/rate-limit.ts',
        [1, 1],
        'No rate limiting configured on public API endpoints',
        'Integrate express-rate-limit with a sliding window of 100 requests per 15 minutes for authentication routes and 1000 for general API routes.',
      ),
      issue(
        'CRITICAL',
        'src/auth/jwt.ts',
        [8, 8],
        'JWT signing secret stored as plaintext string literal',
        'Load the JWT secret from an environment variable (process.env.JWT_SECRET) and ensure it is at least 256 bits of entropy. Rotate the exposed secret.',
      ),
      issue(
        'CRITICAL',
        'src/routes/users.ts',
        [67, 73],
        'Unvalidated user input passed directly to database query parameters',
        'Validate and sanitize all query parameters with a schema validator (e.g., zod) before passing them to the data layer.',
      ),
      issue(
        'CRITICAL',
        'src/app.ts',
        [15, 15],
        'CORS policy missing — all origins accepted by default',
        'Configure the cors middleware with an explicit allowlist of trusted origins and restrict allowed methods to those actually needed.',
      ),

      // ── WARNING (5) ──────────────────────────────────────────────────────
      issue(
        'WARNING',
        'src/routes/comments.ts',
        [34, 34],
        'User-submitted comments rendered without input sanitization',
        'Sanitize HTML content with DOMPurify or a similar library before storing or rendering user comments to prevent stored XSS.',
      ),
      issue(
        'WARNING',
        'src/components/App.tsx',
        [12, 12],
        'Missing React error boundary around route components',
        'Wrap top-level route components in an ErrorBoundary to prevent full-page crashes from uncaught rendering errors.',
      ),
      issue(
        'WARNING',
        'src/utils/hash.ts',
        [22, 22],
        'Using deprecated MD5 algorithm for password hashing',
        'Replace MD5 with bcrypt or Argon2id for password hashing. MD5 is cryptographically broken and unsuitable for credential storage.',
      ),
      issue(
        'WARNING',
        'src/services/user.service.ts',
        [89, 89],
        'N+1 query pattern in user listing with role resolution',
        'Use a JOIN query or DataLoader-style batching to fetch users and roles in a single database round-trip.',
      ),
      issue(
        'WARNING',
        'src/routes/products.ts',
        [45, 45],
        'Endpoint returns unbounded result set without pagination',
        'Add limit/offset or cursor-based pagination. Default to 50 items per page and enforce a maximum of 200.',
      ),

      // ── SUGGESTION (4) ────────────────────────────────────────────────────
      issue(
        'SUGGESTION',
        'src/config/database.ts',
        [30, 30],
        'Database connections created per-request instead of pooled',
        'Configure a connection pool (e.g., pg Pool with min: 2, max: 10) to reduce connection overhead and improve throughput.',
      ),
      issue(
        'SUGGESTION',
        'tsconfig.json',
        [3, 3],
        'TypeScript strict mode is disabled',
        'Enable "strict": true in tsconfig.json to catch null reference errors, implicit any types, and other common mistakes at compile time.',
      ),
      issue(
        'SUGGESTION',
        'src/routes/auth.ts',
        [78, 78],
        'Magic numbers used for token expiry and retry limits',
        'Extract numeric literals (3600, 5, 30000) into named constants in a shared config module for clarity and single-point-of-change.',
      ),
      issue(
        'SUGGESTION',
        'src/middleware/logger.ts',
        [1, 1],
        'No request/response logging middleware configured',
        'Add structured logging middleware (e.g., pino-http) to capture request method, path, status code, and latency for observability.',
      ),
    ],
    totalDiscussions: 8,
    resolved: 5,
    escalated: 3,
  },
  discussions: [
    {
      discussionId: 'disc-auth-sqli',
      filePath: 'src/routes/auth.ts',
      lineRange: [45, 52] as [number, number],
      finalSeverity: 'HARSHLY_CRITICAL',
      reasoning: 'All reviewers unanimously confirmed SQL injection vulnerability with concrete exploit path.',
      consensusReached: true,
      rounds: 2,
    },
    {
      discussionId: 'disc-db-creds',
      filePath: 'src/config/database.ts',
      lineRange: [12, 12] as [number, number],
      finalSeverity: 'HARSHLY_CRITICAL',
      reasoning: 'Credentials are committed to version control. Immediate rotation required.',
      consensusReached: true,
      rounds: 1,
    },
    {
      discussionId: 'disc-rate-limit',
      filePath: 'src/middleware/rate-limit.ts',
      lineRange: [1, 1] as [number, number],
      finalSeverity: 'CRITICAL',
      reasoning: 'Absence of rate limiting exposes authentication endpoints to brute-force attacks.',
      consensusReached: true,
      rounds: 2,
    },
    {
      discussionId: 'disc-jwt-secret',
      filePath: 'src/auth/jwt.ts',
      lineRange: [8, 8] as [number, number],
      finalSeverity: 'CRITICAL',
      reasoning: 'Plaintext JWT secret enables token forgery if source code is leaked.',
      consensusReached: true,
      rounds: 1,
    },
    {
      discussionId: 'disc-user-input',
      filePath: 'src/routes/users.ts',
      lineRange: [67, 73] as [number, number],
      finalSeverity: 'CRITICAL',
      reasoning: 'Escalated after debate — initial WARNING upgraded due to direct database exposure.',
      consensusReached: false,
      rounds: 3,
    },
    {
      discussionId: 'disc-cors',
      filePath: 'src/app.ts',
      lineRange: [15, 15] as [number, number],
      finalSeverity: 'CRITICAL',
      reasoning: 'Open CORS policy combined with cookie-based auth creates CSRF vector.',
      consensusReached: true,
      rounds: 2,
    },
    {
      discussionId: 'disc-xss-comments',
      filePath: 'src/routes/comments.ts',
      lineRange: [34, 34] as [number, number],
      finalSeverity: 'WARNING',
      reasoning: 'Stored XSS risk confirmed but limited by Content-Security-Policy header.',
      consensusReached: false,
      rounds: 3,
    },
    {
      discussionId: 'disc-md5-hash',
      filePath: 'src/utils/hash.ts',
      lineRange: [22, 22] as [number, number],
      finalSeverity: 'WARNING',
      reasoning: 'MD5 for passwords is unacceptable. Consensus on WARNING rather than CRITICAL since it only affects new signups.',
      consensusReached: true,
      rounds: 2,
    },
  ],
};
