import React from 'react';
import { Box, Text } from 'ink';
import { Menu } from '../components/Menu.js';
import type { Screen } from '../hooks/useRouter.js';
import { t } from '../../i18n/index.js';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
  onQuit: () => void;
}

function getMenuItems(): Array<{ label: string; value: string }> {
  return [
    { label: t('home.review'), value: 'review-setup' },
    { label: t('home.sessions'), value: 'sessions' },
    { label: t('home.config'), value: 'config' },
    { label: t('home.quit'), value: 'quit' },
  ];
}

export function HomeScreen({ onNavigate, onQuit }: HomeScreenProps): React.JSX.Element {
  function handleSelect(item: { label: string; value: string }): void {
    if (item.value === 'quit') {
      onQuit();
    } else {
      onNavigate(item.value as Screen);
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Main Menu</Text>
      <Menu items={getMenuItems()} onSelect={handleSelect} />
    </Box>
  );
}
