import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { shouldStrikeAnswerCharacter } from '../../domain/answerCharacters';
import {
  getCrosswordCellTone,
  getIncorrectCrosswordEntries,
} from '../../domain/crosswordResults';
import type { CrosswordAttemptSnapshot } from '../../domain/exercises';
import { t } from '../../domain/i18n';
import type { SupportedLanguage } from '../../domain/languages';
import { CursorAnchoredTooltip } from '../CursorAnchoredTooltip';
import { formatAttemptDate, type RecentCardResult } from './RecentAnswersChip';

export function CrosswordHistoryReplay({
  correctness,
  dataTestPrefix,
  interfaceLanguage,
  recentResultsByCardId = {},
  snapshot,
}: {
  correctness: Record<string, boolean>;
  dataTestPrefix: string;
  interfaceLanguage: SupportedLanguage;
  recentResultsByCardId?: Record<string, RecentCardResult[]>;
  snapshot: CrosswordAttemptSnapshot;
}) {
  const { bounds } = snapshot.puzzle;
  const rows = createRange(bounds.minRow, bounds.maxRow);
  const columns = createRange(bounds.minCol, bounds.maxCol);
  const cellByKey = new Map(
    snapshot.puzzle.cells.map((cell) => [
      toCellKey(cell.row, cell.col),
      cell,
    ]),
  );
  const startEntryByKey = new Map(
    snapshot.puzzle.entries.map((entry, index) => [
      toCellKey(entry.row, entry.col),
      { entry, number: index + 1 },
    ]),
  );
  const entryNumberById = new Map(
    snapshot.puzzle.entries.map((entry, index) => [entry.cardId, index + 1]),
  );

  return (
    <Box
      data-test={`${dataTestPrefix}__grid`}
      sx={{
        display: 'grid',
        gap: 0.5,
        gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        maxWidth: `min(100%, ${columns.length * 38}px)`,
        mx: 'auto',
        overflow: 'visible',
        pl: 2.75,
        pt: 2.75,
        width: '100%',
      }}
    >
      {rows.flatMap((row) =>
        columns.map((col) => {
          const key = toCellKey(row, col);
          const cell = cellByKey.get(key);
          const displayRow = row - bounds.minRow + 1;
          const displayCol = col - bounds.minCol + 1;

          if (!cell || /\s/.test(cell.solution)) {
            return (
              <Box
                data-test={`${dataTestPrefix}__empty_cell__${displayRow}_${displayCol}`}
                key={key}
                sx={emptyCellStyles}
              />
            );
          }

          const startEntry = startEntryByKey.get(key);
          const value = snapshot.cellValues[key] ?? '';
          const resultTone = getCrosswordCellTone(cell, correctness);
          const ghostValue = !value.trim() ? cell.solution : '';
          const tone = ghostValue ? undefined : resultTone;
          const displayValue = value || ghostValue;
          const incorrectEntries = getIncorrectCrosswordEntries(
            cell,
            snapshot.puzzle,
            correctness,
          ).sort(
            (left, right) =>
              (entryNumberById.get(left.cardId) ?? Number.MAX_SAFE_INTEGER) -
              (entryNumberById.get(right.cardId) ?? Number.MAX_SAFE_INTEGER),
          );
          const shouldStrike = shouldStrikeAnswerCharacter({
            actual: value,
            expected: cell.solution,
            isIncorrect: tone === 'incorrect',
          });
          const staticCell = (
            <Box
              component="span"
              data-test={`${dataTestPrefix}__cell__${displayRow}_${displayCol}`}
              sx={letterCellStyles}
              style={{
                backgroundColor:
                  tone === 'correct'
                    ? 'rgb(235, 247, 225)'
                    : tone === 'incorrect'
                      ? 'rgb(253, 235, 238)'
                      : undefined,
                borderColor:
                  tone === 'correct'
                    ? '#8fc773'
                    : tone === 'incorrect'
                      ? '#f2a7b4'
                      : undefined,
                textDecorationLine: shouldStrike ? 'line-through' : 'none',
                textDecorationThickness: '2px',
                ...(ghostValue ? ghostCellStyle : {}),
              }}
            >
              {displayValue}
            </Box>
          );

          return (
            <Box key={key} sx={letterCellShellStyles}>
              {startEntry && (
                <Tooltip
                  arrow
                  placement="top-start"
                  slotProps={getClueTooltipSlotProps(
                    `${dataTestPrefix}__clue_tooltip__${startEntry.entry.cardId}`,
                  )}
                  title={
                    <Stack spacing={0.5}>
                      <Typography
                        sx={{
                          color: '#2f7d9b',
                          fontSize: 14,
                          fontWeight: 900,
                          lineHeight: 1.2,
                        }}
                      >
                        {t(interfaceLanguage, 'question')}
                      </Typography>
                      <Typography sx={{ fontSize: 14, lineHeight: 1.35 }}>
                        {startEntry.entry.clue}
                      </Typography>
                    </Stack>
                  }
                >
                  <Box
                    aria-label={`${t(interfaceLanguage, 'question')} ${startEntry.number}`}
                    component="button"
                    data-test={`${dataTestPrefix}__clue_number__${startEntry.entry.cardId}`}
                    sx={getClueNumberStyles(startEntry.entry.direction)}
                    type="button"
                  >
                    {startEntry.number}
                  </Box>
                </Tooltip>
              )}
              {incorrectEntries.length > 0 ? (
                <CursorAnchoredTooltip
                  arrowDataTest={`${dataTestPrefix}__correction__${displayRow}_${displayCol}__tooltip_arrow`}
                  closeOnOtherOpen
                  leaveDelay={0}
                  title={
                    <Stack
                      data-test={`${dataTestPrefix}__correction__${displayRow}_${displayCol}__tooltip`}
                      spacing={1.25}
                    >
                      {incorrectEntries.map((entry) => {
                        const entryNumber = entryNumberById.get(entry.cardId);
                        const entryDataTest = `${dataTestPrefix}__correction__${displayRow}_${displayCol}__entry__${encodeURIComponent(
                          entry.cardId,
                        )}`;

                        return (
                          <Stack
                            alignItems="center"
                            data-test={entryDataTest}
                            key={entry.cardId}
                            spacing={0.75}
                          >
                            <Box
                              aria-label={`${t(interfaceLanguage, 'question')} ${entryNumber}`}
                              component="span"
                              data-test={`${entryDataTest}__number`}
                              sx={correctionNumberStyles}
                            >
                              {entryNumber}
                            </Box>
                            <Stack
                              aria-label={entry.answer}
                              data-test={`${entryDataTest}__answer`}
                              direction="row"
                              flexWrap="wrap"
                              justifyContent="center"
                              spacing={0.5}
                              useFlexGap
                            >
                              {entry.answer.split('').map((character, index) =>
                                character.trim() === '' ? (
                                  <Box
                                    aria-hidden="true"
                                    component="span"
                                    data-test={`${entryDataTest}__answer__space__${index}`}
                                    key={`space-${index}`}
                                    sx={correctionAnswerSpaceStyles}
                                  />
                                ) : (
                                  <Box
                                    component="span"
                                    data-test={`${entryDataTest}__answer__cell__${index}`}
                                    key={`${character}-${index}`}
                                    sx={correctionAnswerCellStyles}
                                  >
                                    {character}
                                  </Box>
                                ),
                              )}
                            </Stack>
                            <RecentResultsBlock
                              dataTestPrefix={entryDataTest}
                              interfaceLanguage={interfaceLanguage}
                              recentResults={
                                recentResultsByCardId[entry.cardId]?.slice(0, 10) ??
                                []
                              }
                            />
                          </Stack>
                        );
                      })}
                    </Stack>
                  }
                  transitionTimeout={0}
                  tooltipSx={answerTooltipStyles}
                >
                  <Box
                    aria-label={incorrectEntries
                      .map(
                        (entry) =>
                          `${t(interfaceLanguage, 'question')} ${entryNumberById.get(entry.cardId)}: ${entry.answer}`,
                      )
                      .join('; ')}
                    component="button"
                    data-test={`${dataTestPrefix}__correction__${displayRow}_${displayCol}__anchor`}
                    sx={correctionAnchorStyles}
                    type="button"
                  >
                    {staticCell}
                  </Box>
                </CursorAnchoredTooltip>
              ) : (
                staticCell
              )}
            </Box>
          );
        }),
      )}
    </Box>
  );
}

function createRange(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}

function toCellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

const letterCellShellStyles = {
  aspectRatio: '1 / 1',
  minWidth: 0,
  position: 'relative',
  width: '100%',
};

const letterCellStyles = {
  alignItems: 'center',
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  display: 'inline-flex',
  fontSize: 20,
  fontWeight: 800,
  aspectRatio: '1 / 1',
  height: 'auto',
  justifyContent: 'center',
  lineHeight: 1,
  minWidth: 0,
  p: 0,
  textAlign: 'center',
  textTransform: 'lowercase',
  width: '100%',
};

function getClueNumberStyles(direction: 'across' | 'down') {
  return {
    ...clueNumberBaseStyles,
    ...(direction === 'across'
      ? {
          left: -20,
          top: '50%',
          transform: 'translateY(-50%)',
        }
      : {
          left: '50%',
          top: -20,
          transform: 'translateX(-50%)',
        }),
  };
}

const clueNumberBaseStyles = {
  alignItems: 'center',
  bgcolor: '#f5d66b',
  border: '1px solid rgba(119, 86, 0, 0.24)',
  borderRadius: '50%',
  color: '#203015',
  cursor: 'help',
  display: 'inline-flex',
  fontSize: 9,
  fontWeight: 950,
  height: 15,
  justifyContent: 'center',
  lineHeight: 1,
  p: 0,
  position: 'absolute',
  width: 15,
  zIndex: 1,
};

const emptyCellStyles = {
  aspectRatio: '1 / 1',
  minWidth: 0,
  width: '100%',
};

const ghostCellStyle = {
  backgroundColor: 'transparent',
  color: 'rgba(32, 48, 21, 0.38)',
};

function RecentResultsBlock({
  dataTestPrefix,
  interfaceLanguage,
  recentResults,
}: {
  dataTestPrefix: string;
  interfaceLanguage: SupportedLanguage;
  recentResults: RecentCardResult[];
}) {
  return (
    <Stack data-test={`${dataTestPrefix}__recent`} spacing={0.5}>
      <Typography
        data-test={`${dataTestPrefix}__recent_title`}
        sx={{
          color: '#203015',
          fontSize: 14,
          fontWeight: 850,
          mt: '10px',
        }}
      >
        {t(interfaceLanguage, 'recentAnswersTitle')}
      </Typography>
      <Stack data-test={`${dataTestPrefix}__recent_results`} spacing={0.5}>
        {recentResults.map((result, index) => (
          <Stack
            data-test={`${dataTestPrefix}__recent_result__${index}`}
            direction="row"
            key={`${result.occurredAt}-${index}`}
            spacing={0.75}
            sx={{ alignItems: 'center' }}
          >
            <Chip
              data-test={`${dataTestPrefix}__recent_result_chip__${index}`}
              label={t(
                interfaceLanguage,
                result.isCorrect ? 'metricCorrectSuffix' : 'metricIncorrectSuffix',
              )}
              size="small"
              sx={recentResultChipStyles(result.isCorrect)}
            />
            <Typography
              data-test={`${dataTestPrefix}__recent_result_date__${index}`}
              sx={{ color: 'rgba(32, 48, 21, 0.72)', fontSize: 11 }}
            >
              {formatAttemptDate(result.occurredAt)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function recentResultChipStyles(isCorrect: boolean) {
  return {
    bgcolor: isCorrect ? 'rgb(235, 247, 225)' : 'rgb(253, 235, 238)',
    border: '1px solid',
    borderColor: isCorrect ? '#8fc773' : '#f2a7b4',
    color: '#111111',
    fontSize: 12,
    fontWeight: 800,
    height: 24,
  };
}

function getClueTooltipSlotProps(dataTest: string) {
  return {
    popper: {
      modifiers: [{ name: 'offset', options: { offset: [0, 5] } }],
    },
    tooltip: {
      ...({ 'data-test': dataTest } as Record<string, string>),
      sx: (theme: { palette: { mode: string } }) => ({
        bgcolor: theme.palette.mode === 'dark' ? '#1f2933' : '#ffffff',
        border:
          theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.18)'
            : '1px solid rgba(32, 48, 21, 0.14)',
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 14px 30px rgba(0, 0, 0, 0.32)'
            : '0 14px 30px rgba(32, 48, 21, 0.14)',
        color: theme.palette.mode === 'dark' ? '#f8fafc' : '#203015',
        maxWidth: 280,
        p: 1.25,
      }),
    },
    arrow: {
      sx: (theme: { palette: { mode: string } }) => ({
        color: theme.palette.mode === 'dark' ? '#1f2933' : '#ffffff',
        '&:before': {
          border:
            theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.18)'
              : '1px solid rgba(32, 48, 21, 0.14)',
        },
      }),
    },
  };
}

const correctionAnchorStyles = {
  bgcolor: 'transparent',
  border: 0,
  color: 'inherit',
  display: 'inline-flex',
  height: '100%',
  p: 0,
  width: '100%',
};

const correctionNumberStyles = {
  alignItems: 'center',
  bgcolor: '#f5d66b',
  border: '1px solid rgba(119, 86, 0, 0.3)',
  borderRadius: '50%',
  color: '#203015',
  display: 'inline-flex',
  fontSize: 13,
  fontWeight: 950,
  height: 26,
  justifyContent: 'center',
  lineHeight: 1,
  width: 26,
};

const correctionAnswerCellStyles = {
  alignItems: 'center',
  bgcolor: 'rgb(235, 247, 225)',
  border: '1px solid #8fc773',
  borderRadius: 1,
  color: '#203015',
  display: 'inline-flex',
  fontSize: 20,
  fontWeight: 800,
  height: 34,
  justifyContent: 'center',
  lineHeight: 1,
  textTransform: 'lowercase',
  width: 34,
};

const correctionAnswerSpaceStyles = {
  display: 'inline-flex',
  height: 34,
  width: 34,
};

const answerTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.14)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  maxWidth: 'min(520px, calc(100vw - 32px))',
  p: 1.25,
};
