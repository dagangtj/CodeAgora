import React from 'react';
import { Box, Text } from 'ink';
import type { Screen } from '../hooks/useRouter.js';
import { t } from '../../i18n/index.js';

interface StatusBarProps {
  screen: Screen;
  canGoBack: boolean;
}

function getScreenHints(): Record<Screen, string> {
  return {
    home: t('statusbar.home'),
    'review-setup': t('statusbar.reviewSetup'),
    review: 'q: back',
    pipeline: t('statusbar.pipeline'),
    results: t('statusbar.results'),
    sessions: t('statusbar.sessions'),
    config: t('statusbar.config'),
    debate: t('statusbar.debate'),
  };
}

export function StatusBar({ screen, canGoBack }: StatusBarProps): React.JSX.Element {
  const hint = getScreenHints()[screen] ?? (canGoBack ? 'q: back' : 'q: quit');
  return (
    <Box borderStyle="single" paddingX={1} justifyContent="space-between">
      <Text dimColor>{screen}</Text>
      <Text dimColor>{hint}</Text>
    </Box>
  );
}
