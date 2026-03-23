/**
 * Tests for loadPersona() path traversal prevention
 * Issue #102: restrict persona loading to project root
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import { loadPersona } from '@codeagora/core/l2/moderator.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
}));

import { readFile } from 'fs/promises';
const mockReadFile = vi.mocked(readFile);

describe('loadPersona', () => {
  const originalCwd = process.cwd;
  const fakeRoot = '/fake/project';

  beforeEach(() => {
    process.cwd = () => fakeRoot;
    mockReadFile.mockReset();
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  it('loads a valid relative persona file', async () => {
    mockReadFile.mockResolvedValue('You are a security expert.');
    const result = await loadPersona('prompts/security.md');
    expect(result).toBe('You are a security expert.');
    expect(mockReadFile).toHaveBeenCalledWith(
      path.resolve(fakeRoot, 'prompts/security.md'),
      'utf-8'
    );
  });

  it('blocks absolute paths', async () => {
    const result = await loadPersona('/etc/passwd');
    expect(result).toBe('');
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('blocks path traversal with ".." segments', async () => {
    const result = await loadPersona('../../../etc/passwd');
    expect(result).toBe('');
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('blocks paths with null bytes', async () => {
    const result = await loadPersona('prompts/valid.md\x00.txt');
    expect(result).toBe('');
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('blocks paths that resolve outside project root', async () => {
    // Even without explicit "..", some paths could resolve outside
    const result = await loadPersona('../sibling-project/persona.md');
    expect(result).toBe('');
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('returns empty string on file read error', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    const result = await loadPersona('prompts/nonexistent.md');
    expect(result).toBe('');
  });

  it('trims whitespace from loaded content', async () => {
    mockReadFile.mockResolvedValue('  persona content  \n');
    const result = await loadPersona('prompts/valid.md');
    expect(result).toBe('persona content');
  });

  it('returns empty string for empty path', async () => {
    const result = await loadPersona('');
    expect(result).toBe('');
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('returns inline text directly when not a file path', async () => {
    const result = await loadPersona('Extremely skeptical senior engineer');
    expect(result).toBe('Extremely skeptical senior engineer');
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('returns inline text with special characters', async () => {
    const result = await loadPersona('Challenge every assumption — look for false positives');
    expect(result).toBe('Challenge every assumption — look for false positives');
    expect(mockReadFile).not.toHaveBeenCalled();
  });

  it('treats .md paths as file paths', async () => {
    mockReadFile.mockResolvedValue('File persona content');
    const result = await loadPersona('strict.md');
    expect(result).toBe('File persona content');
    expect(mockReadFile).toHaveBeenCalled();
  });

  it('treats paths with slashes as file paths', async () => {
    mockReadFile.mockResolvedValue('Nested persona');
    const result = await loadPersona('.ca/personas/strict.md');
    expect(result).toBe('Nested persona');
    expect(mockReadFile).toHaveBeenCalled();
  });
});
