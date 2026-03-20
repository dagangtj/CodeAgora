import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomBytes } from 'crypto';

export function writeTempPrompt(prompt: string): string {
  const tmpDir = os.tmpdir();
  const filename = `codeagora-prompt-${randomBytes(8).toString('hex')}.txt`;
  const filepath = path.join(tmpDir, filename);
  fs.writeFileSync(filepath, prompt, 'utf-8');
  return filepath;
}

export function cleanupTempPrompt(filepath: string): void {
  try { fs.unlinkSync(filepath); } catch { /* ignore */ }
}
