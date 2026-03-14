/**
 * Providers Command
 * List supported providers and API key status.
 */

import { getSupportedProviders } from '../../l1/provider-registry.js';
import { getProviderEnvVar } from './doctor.js';
import { statusColor, bold } from '../utils/colors.js';

// ============================================================================
// Types
// ============================================================================

export interface ProviderInfo {
  name: string;
  apiKeyEnvVar: string;
  apiKeySet: boolean;
}

// ============================================================================
// Public API
// ============================================================================

export function listProviders(): ProviderInfo[] {
  return getSupportedProviders().map((name) => {
    const apiKeyEnvVar = getProviderEnvVar(name);
    return {
      name,
      apiKeyEnvVar,
      apiKeySet: Boolean(process.env[apiKeyEnvVar]),
    };
  });
}

export function formatProviderList(providers: ProviderInfo[]): string {
  const COL_PROVIDER = 14;
  const COL_KEY = 22;

  const header =
    'Provider'.padEnd(COL_PROVIDER) +
    'API Key'.padEnd(COL_KEY) +
    'Status';
  const divider = '\u2500'.repeat(COL_PROVIDER + COL_KEY + 10);

  const rows = providers.map((p) => {
    const paddedName = p.name.padEnd(COL_PROVIDER);
    const paddedKey = p.apiKeyEnvVar.padEnd(COL_KEY);
    const keyDisplay = p.apiKeySet
      ? statusColor.pass(`\u2713 ${paddedKey}`)
      : statusColor.fail(`\u2717 ${paddedKey}`);
    const status = p.apiKeySet ? 'available' : 'no key';
    return bold(paddedName) + keyDisplay + status;
  });

  return [header, divider, ...rows].join('\n');
}
