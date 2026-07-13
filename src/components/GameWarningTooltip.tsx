import { Box, Stack } from '@mui/material';
import type { ReactElement } from 'react';
import { CursorAnchoredTooltip, TooltipContent } from './CursorAnchoredTooltip';

export function GameWarningIcon({
  dataTest,
}: {
  dataTest: string;
}) {
  return (
    <Box
      component="span"
      data-test={dataTest}
      sx={gameWarningIconStyles}
    >
      !
    </Box>
  );
}

export function GameWarningTooltipContent({
  iconDataTest,
  messages,
}: {
  iconDataTest: string;
  messages: string[];
}) {
  return (
    <TooltipContent sx={gameWarningTooltipContentStyles}>
      <GameWarningIcon dataTest={iconDataTest} />
      <Stack data-test={`${iconDataTest}__messages`} spacing={0.5}>
        {messages.map((message) => (
          <Box component="span" key={message}>
            {message}
          </Box>
        ))}
      </Stack>
    </TooltipContent>
  );
}

export function GameWarningTooltip({
  anchorDataTest,
  arrowDataTest,
  children,
  iconDataTest,
  messages,
}: {
  anchorDataTest: string;
  arrowDataTest: string;
  children: ReactElement;
  iconDataTest: string;
  messages: string[];
}) {
  return (
    <CursorAnchoredTooltip
      arrowDataTest={arrowDataTest}
      closeOnOtherOpen
      title={
        <GameWarningTooltipContent
          iconDataTest={iconDataTest}
          messages={messages}
        />
      }
      tooltipSx={gameWarningTooltipStyles}
    >
      <Box
        data-test={anchorDataTest}
        sx={{ display: 'inline-flex', lineHeight: 0 }}
      >
        {children}
      </Box>
    </CursorAnchoredTooltip>
  );
}

export const gameWarningTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.16)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  maxWidth: 380,
  px: 1.5,
  py: 1.25,
};

export const gameWarningTooltipContentStyles = {
  alignItems: 'center',
  bgcolor: '#ffffff',
  color: '#203015',
  display: 'inline-flex',
  fontSize: 17,
  fontWeight: 700,
  gap: 1,
  lineHeight: 1.35,
};

export const gameWarningIconStyles = {
  alignItems: 'center',
  animation: 'disabledExerciseTooltipBlink 860ms ease-in-out infinite',
  bgcolor: '#ffd13d',
  border: '2px solid #ff7a00',
  borderRadius: '999px',
  boxShadow: '0 0 0 4px rgba(255, 122, 0, 0.16)',
  color: '#7a2500',
  display: 'inline-flex',
  flex: '0 0 auto',
  fontSize: 22,
  fontWeight: 1000,
  height: 32,
  justifyContent: 'center',
  lineHeight: 1,
  width: 32,
  '@keyframes disabledExerciseTooltipBlink': {
    '0%, 100%': {
      opacity: 1,
      transform: 'scale(1)',
    },
    '50%': {
      opacity: 0.35,
      transform: 'scale(1.12)',
    },
  },
};
