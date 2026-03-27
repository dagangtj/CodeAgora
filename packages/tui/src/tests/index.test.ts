/**
 * Tests for packages/tui/src/index.tsx
 *
 * Verifies that startTui and startTuiDemo are exported as callable functions,
 * and that startTuiDemo passes a demoResult prop to the App component.
 * Ink's render() is mocked to prevent actual terminal I/O.
 *
 * Uses dynamic imports so vi.mock hoisting works correctly with tsc.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock ink so no actual terminal rendering happens.
// ---------------------------------------------------------------------------
vi.mock('ink', () => ({
  render: vi.fn().mockReturnValue({
    waitUntilExit: vi.fn().mockReturnValue(Promise.resolve()),
  }),
}));

vi.mock('../App.js', () => ({
  App: vi.fn(),
}));

vi.mock('../demo-data.js', () => ({
  DEMO_RESULT: { sessionId: 'test-demo', status: 'success', summary: null, discussions: [] },
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('startTui', () => {
  it('is exported as a function', async () => {
    const mod = await import('../index.js');
    expect(typeof mod.startTui).toBe('function');
  });

  it('calls ink render when invoked', async () => {
    const writeStub = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const ink = await import('ink');
    const { startTui } = await import('../index.js');

    startTui();

    expect(ink.render).toHaveBeenCalledTimes(1);
    writeStub.mockRestore();
  });
});

describe('startTuiDemo', () => {
  it('is exported as a function', async () => {
    const mod = await import('../index.js');
    expect(typeof mod.startTuiDemo).toBe('function');
  });

  it('calls ink render when invoked', async () => {
    const writeStub = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const ink = await import('ink');
    const { startTuiDemo } = await import('../index.js');

    await startTuiDemo();

    expect(ink.render).toHaveBeenCalledTimes(1);
    writeStub.mockRestore();
  });

  it('passes a demoResult prop to the App component', async () => {
    const writeStub = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const createElementSpy = vi.spyOn(
      (await import('react')).default,
      'createElement',
    );
    const { startTuiDemo } = await import('../index.js');

    await startTuiDemo();

    const callWithDemo = createElementSpy.mock.calls.find(
      (args) =>
        args[1] !== null &&
        typeof args[1] === 'object' &&
        'demoResult' in (args[1] as Record<string, unknown>),
    );
    expect(callWithDemo).toBeDefined();
    expect((callWithDemo![1] as Record<string, unknown>).demoResult).toMatchObject({
      sessionId: 'test-demo',
    });
    writeStub.mockRestore();
  });

  it('startTui does not pass a demoResult prop', async () => {
    const writeStub = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const createElementSpy = vi.spyOn(
      (await import('react')).default,
      'createElement',
    );
    const { startTui } = await import('../index.js');

    startTui();

    const callWithDemo = createElementSpy.mock.calls.find(
      (args) =>
        args[1] !== null &&
        typeof args[1] === 'object' &&
        'demoResult' in (args[1] as Record<string, unknown>),
    );
    expect(callWithDemo).toBeUndefined();
    writeStub.mockRestore();
  });
});
