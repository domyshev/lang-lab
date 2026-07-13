import { Box } from '@mui/material';
import type { SxProps, Theme as MuiTheme } from '@mui/material';
import capeChampion from '../assets/characters/cape-champion.svg';
import capeChampionForest from '../assets/characters/cape-champion-forest.svg';
import greenPower from '../assets/characters/green-power.svg';
import greenPowerForest from '../assets/characters/green-power-forest.svg';
import studyTroll from '../assets/characters/study-troll.svg';
import studyTrollForest from '../assets/characters/study-troll-forest.svg';
import trollMama from '../assets/characters/troll-mama.svg';
import trollMamaForest from '../assets/characters/troll-mama-forest.svg';
import webRunner from '../assets/characters/web-runner.svg';
import webRunnerForest from '../assets/characters/web-runner-forest.svg';
import { AssistantId, resolveAssistantId } from '../domain/assistants';
import { WorldId, resolveWorldId } from '../domain/worlds';

const assistantImages: Record<WorldId, Record<AssistantId, string>> = {
  football: {
    capeChampion,
    greenPower,
    studyTroll,
    trollMama,
    webRunner,
  },
  forest: {
    capeChampion: capeChampionForest,
    greenPower: greenPowerForest,
    studyTroll: studyTrollForest,
    trollMama: trollMamaForest,
    webRunner: webRunnerForest,
  },
};

export function AssistantStickerIcon({
  ariaLabel,
  assistantId,
  className,
  dataTest,
  size = 36,
  sx,
  worldId,
}: {
  ariaLabel?: string;
  assistantId: AssistantId | string | undefined;
  className?: string;
  dataTest?: string;
  size?: number;
  sx?: SxProps<MuiTheme>;
  worldId?: WorldId;
}) {
  const resolvedWorldId = resolveWorldId(worldId);
  const resolvedAssistantId = resolveAssistantId(assistantId, resolvedWorldId);

  return (
    <Box
      component="img"
      alt={ariaLabel ?? ''}
      aria-label={ariaLabel}
      className={className}
      data-test={dataTest ?? `assistant_sticker_icon__${resolvedAssistantId}`}
      src={assistantImages[resolvedWorldId][resolvedAssistantId]}
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
