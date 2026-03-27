import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { DEMO_RESULT } from './demo-data.js';

export function startTui(): void {
  // Enter alternate screen buffer — preserves terminal history on exit
  process.stdout.write('\x1b[?1049h');

  const instance = render(React.createElement(App));

  // Leave alternate screen buffer when the render instance unmounts/exits
  instance.waitUntilExit().finally(() => {
    process.stdout.write('\x1b[?1049l');
  });
}

/** Launch TUI directly on the results screen with hardcoded demo data. No API keys needed. */
export function startTuiDemo(): void {
  process.stdout.write('\x1b[?1049h');

  const instance = render(React.createElement(App, { demoResult: DEMO_RESULT }));

  instance.waitUntilExit().finally(() => {
    process.stdout.write('\x1b[?1049l');
  });
}
