/**
 * prompt-file.ts unit tests
 * Tests for writeTempPrompt and cleanupTempPrompt utilities.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { writeTempPrompt, cleanupTempPrompt } from '../../packages/shared/src/utils/prompt-file.js';

describe('writeTempPrompt()', () => {
  it('creates a file that exists on disk', () => {
    const filepath = writeTempPrompt('hello world');
    try {
      expect(fs.existsSync(filepath)).toBe(true);
    } finally {
      cleanupTempPrompt(filepath);
    }
  });

  it('writes the prompt content exactly to the file', () => {
    const prompt = 'Review this code for security issues\nLine 2';
    const filepath = writeTempPrompt(prompt);
    try {
      const content = fs.readFileSync(filepath, 'utf-8');
      expect(content).toBe(prompt);
    } finally {
      cleanupTempPrompt(filepath);
    }
  });

  it('places the file in the OS temp directory', () => {
    const filepath = writeTempPrompt('test');
    try {
      expect(filepath.startsWith(os.tmpdir())).toBe(true);
    } finally {
      cleanupTempPrompt(filepath);
    }
  });

  it('filename contains the codeagora-prompt- prefix', () => {
    const filepath = writeTempPrompt('test');
    try {
      const basename = path.basename(filepath);
      expect(basename.startsWith('codeagora-prompt-')).toBe(true);
    } finally {
      cleanupTempPrompt(filepath);
    }
  });

  it('filename contains a random hex suffix', () => {
    const filepath = writeTempPrompt('test');
    try {
      const basename = path.basename(filepath, '.txt');
      // format: codeagora-prompt-{16 hex chars}
      const hexPart = basename.replace('codeagora-prompt-', '');
      expect(/^[0-9a-f]{16}$/.test(hexPart)).toBe(true);
    } finally {
      cleanupTempPrompt(filepath);
    }
  });

  it('generates unique file paths on each call', () => {
    const fp1 = writeTempPrompt('a');
    const fp2 = writeTempPrompt('b');
    try {
      expect(fp1).not.toBe(fp2);
    } finally {
      cleanupTempPrompt(fp1);
      cleanupTempPrompt(fp2);
    }
  });
});

describe('cleanupTempPrompt()', () => {
  it('deletes the file after cleanup', () => {
    const filepath = writeTempPrompt('to be deleted');
    expect(fs.existsSync(filepath)).toBe(true);
    cleanupTempPrompt(filepath);
    expect(fs.existsSync(filepath)).toBe(false);
  });

  it('does not throw when the file does not exist', () => {
    const nonExistent = path.join(os.tmpdir(), 'codeagora-prompt-doesnotexist.txt');
    expect(() => cleanupTempPrompt(nonExistent)).not.toThrow();
  });

  it('does not throw when called twice on the same path', () => {
    const filepath = writeTempPrompt('double cleanup');
    cleanupTempPrompt(filepath);
    expect(() => cleanupTempPrompt(filepath)).not.toThrow();
  });
});
