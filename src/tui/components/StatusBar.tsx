import React from 'react';
import { Box, Text } from 'ink';
import type { Screen } from '../hooks/useRouter.js';

interface StatusBarProps {
  screen: Screen;
  canGoBack: boolean;
}

const SCREEN_HINTS: Record<Screen, string> = {
  home: '\u2191\u2193: navigate | Enter: select | q: quit',
  'review-setup': 'Enter: next | Esc: back | q: home',
  review: 'q: back',
  pipeline: 'running... | q: cancel',
  results: 'j/k: scroll | Enter: detail | Esc: back | q: home',
  sessions: 'j/k: scroll | Enter: detail | f: filter | q: home',
  config: 'Tab: switch tab | j/k: navigate | q: home',
  debate: 'j/k: scroll | q: back',
};

export function StatusBar({ screen, canGoBack }: StatusBarProps): React.JSX.Element {
  const hint = SCREEN_HINTS[screen] ?? (canGoBack ? 'q: back' : 'q: quit');
  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Text dimColor>{screen}</Text>
      <Text dimColor>{hint}</Text>
    </Box>
  );
}
