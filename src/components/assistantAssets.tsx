import { Box } from '@mui/material';
import type { SxProps, Theme as MuiTheme } from '@mui/material';
import capeChampion from '../assets/characters/cape-champion.svg';
import capeChampionForest from '../assets/characters/cape-champion-forest.svg';
import forestElf from '../assets/characters/forest-elf.svg';
import greenPower from '../assets/characters/green-power.svg';
import greenPowerForest from '../assets/characters/green-power-forest.svg';
import ladybug from '../assets/characters/ladybug.svg';
import mkFlameNinja from '../assets/characters/mk-flame-ninja.svg';
import mkIceGuardian from '../assets/characters/mk-ice-guardian.svg';
import mkShadowQueen from '../assets/characters/mk-shadow-queen.svg';
import mkThunderMonk from '../assets/characters/mk-thunder-monk.svg';
import studyTroll from '../assets/characters/study-troll.svg';
import studyTrollForest from '../assets/characters/study-troll-forest.svg';
import trekChiefEngineer from '../assets/characters/trek-chief-engineer.svg';
import trekHelmPilot from '../assets/characters/trek-helm-pilot.svg';
import trekScienceOfficer from '../assets/characters/trek-science-officer.svg';
import trekStarCaptain from '../assets/characters/trek-star-captain.svg';
import trollMama from '../assets/characters/troll-mama.svg';
import trollMamaForest from '../assets/characters/troll-mama-forest.svg';
import unicorn from '../assets/characters/unicorn.svg';
import webRunner from '../assets/characters/web-runner.svg';
import webRunnerForest from '../assets/characters/web-runner-forest.svg';
import { AssistantId, resolveAssistantId } from '../domain/assistants';
import { WorldId, resolveWorldId } from '../domain/worlds';

const assistantImages: Record<WorldId, Record<AssistantId, string>> = {
  football: {
    capeChampion,
    forestElf,
    greenPower,
    ladybug,
    studyTroll,
    trollMama,
    unicorn,
    webRunner,
  },
  forest: {
    capeChampion: capeChampionForest,
    forestElf,
    greenPower: greenPowerForest,
    ladybug,
    studyTroll: studyTrollForest,
    trollMama: trollMamaForest,
    unicorn,
    webRunner: webRunnerForest,
  },
  mortalKombat: {
    capeChampion: mkThunderMonk,
    forestElf: mkShadowQueen,
    greenPower: mkIceGuardian,
    ladybug: mkShadowQueen,
    studyTroll: mkFlameNinja,
    trollMama: mkThunderMonk,
    unicorn: mkIceGuardian,
    webRunner: mkShadowQueen,
  },
  starTrek: {
    capeChampion: trekHelmPilot,
    forestElf: trekScienceOfficer,
    greenPower: trekScienceOfficer,
    ladybug: trekHelmPilot,
    studyTroll: trekStarCaptain,
    trollMama: trekStarCaptain,
    unicorn: trekChiefEngineer,
    webRunner: trekChiefEngineer,
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
