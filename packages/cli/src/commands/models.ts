/**
 * Model Leaderboard CLI Command (4.1)
 * Shows model performance rankings from BanditStore data.
 *
 * Data access and formatting live in core; re-exported here for backward compatibility.
 */

export type { LeaderboardEntry } from '@codeagora/core/l0/leaderboard.js';
export { getModelLeaderboard, formatLeaderboard } from '@codeagora/core/l0/leaderboard.js';
