import React from 'react';
import { Box, Text } from 'ink';
import { t } from '../../i18n/index.js';

export function Header(): React.JSX.Element {
  return (
    <Box borderStyle="single" paddingX={1}>
      <Text color="cyan" bold>{t('app.title')}</Text>
      <Text> — {t('app.subtitle')}</Text>
    </Box>
  );
}
