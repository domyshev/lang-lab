import { Box } from '@mui/material';
import type { SxProps, Theme as MuiTheme } from '@mui/material';
import capeChampion from '../assets/characters/cape-champion.svg';
import greenPower from '../assets/characters/green-power.svg';
import studyTroll from '../assets/characters/study-troll.svg';
import trollMama from '../assets/characters/troll-mama.svg';
import webRunner from '../assets/characters/web-runner.svg';
import { AssistantId, resolveAssistantId } from '../domain/assistants';

const assistantImages: Record<AssistantId, string> = {
  capeChampion,
  greenPower,
  studyTroll,
  trollMama,
  webRunner,
};

export function AssistantStickerIcon({
  ariaLabel,
  assistantId,
  className,
  dataTest,
  size = 36,
  sx,
}: {
  ariaLabel?: string;
  assistantId: AssistantId | string | undefined;
  className?: string;
  dataTest?: string;
  size?: number;
  sx?: SxProps<MuiTheme>;
}) {
  const resolvedAssistantId = resolveAssistantId(assistantId);

  return (
    <Box
      component="img"
      alt={ariaLabel ?? ''}
      aria-label={ariaLabel}
      className={className}
      data-test={dataTest ?? `assistant_sticker_icon__${resolvedAssistantId}`}
      src={assistantImages[resolvedAssistantId]}
      sx={{
        display: 'block',
        filter: 'drop-shadow(0 8px 10px rgba(32, 48, 21, 0.18))',
        height: size,
        objectFit: 'contain',
        width: size,
        ...sx,
      }}
    />
  );
}
