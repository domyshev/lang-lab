import { ChangeEvent, useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import KeyIcon from '@mui/icons-material/Key';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  importLanguageCards,
  ImportResult,
  ImportSummary,
} from '../domain/importCards';
import {
  formatImportedFile,
  formatStoredCardCount,
  t,
} from '../domain/i18n';
import { applyImportResult } from '../store/cardsSlice';
import { markAgentsIntroCoachmarkShown } from '../store/appSlice';
import { AppDispatch, RootState } from '../store/store';
import languageCardFormatUrl from '../../docs/LANGUAGE_CARD_FORMAT.md?url';

const summaryLabels = [
  { key: 'added', labelKey: 'importAdded' },
  { key: 'safeMerged', labelKey: 'importSafeMerged' },
  { key: 'pendingDuplicates', labelKey: 'importPendingDuplicates' },
  { key: 'invalid', labelKey: 'importInvalid' },
  { key: 'skipped', labelKey: 'importSkipped' },
] as const satisfies Array<{
  key: keyof ImportSummary;
  labelKey:
    | 'importAdded'
    | 'importSafeMerged'
    | 'importPendingDuplicates'
    | 'importInvalid'
    | 'importSkipped';
}>;

const agentCapabilityRows = [
  {
    icon: <BarChartIcon fontSize="small" />,
    key: 'agentsAnalyzeStatsCapability',
  },
  {
    icon: <LibraryAddIcon fontSize="small" />,
    key: 'agentsVocabularyCapability',
  },
  {
    icon: <HistoryIcon fontSize="small" />,
    key: 'agentsRollbackNotice',
  },
] as const;

function getAgentCapabilityTone(key: (typeof agentCapabilityRows)[number]['key']) {
  const tones = {
    agentsAnalyzeStatsCapability: {
      bg: '#e8f6fb',
      border: 'rgba(37, 118, 150, 0.20)',
      color: '#174e69',
    },
    agentsVocabularyCapability: {
      bg: '#fff2cf',
      border: 'rgba(138, 90, 18, 0.20)',
      color: '#8a5a12',
    },
    agentsRollbackNotice: {
      bg: '#f3edff',
      border: 'rgba(111, 79, 166, 0.20)',
      color: '#6f4fa6',
    },
  };

  return tones[key];
}

export function ImportCardsView() {
  const dispatch = useDispatch<AppDispatch>();
  const cards = useSelector((state: RootState) => state.cards.cards);
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const hasAgentsIntroCoachmarkBeenShown = useSelector((state: RootState) =>
    Boolean(state.app.hasAgentsIntroCoachmarkBeenShown),
  );
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const importCardsFromText = (jsonText: string) => {
    const result = importLanguageCards({
      existingCards: cards,
      pastedJson: jsonText,
      now: new Date().toISOString(),
    });

    dispatch(applyImportResult(result));
    setLastResult(result);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const text = await readFileAsText(file);
      setSelectedFileName(file.name);
      setFileError(null);
      importCardsFromText(text);
    } catch {
      setSelectedFileName(null);
      setFileError(t(interfaceLanguage, 'couldNotReadFile'));
    }
  };

  const rootErrors =
    lastResult?.invalidRecords.filter((record) => record.index === -1) ?? [];
  const recordErrors =
    lastResult?.invalidRecords.filter((record) => record.index !== -1) ?? [];

  return (
    <Paper
      data-test="import_cards__panel"
      sx={{
        bgcolor: '#f9fdff',
        border: '1px solid rgba(37, 118, 150, 0.16)',
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack data-test="import_cards__content" spacing={2.5}>
        <Box data-test="agents_view__header">
          <Typography
            data-test="agents_view__title"
            variant="h5"
            component="h2"
            sx={{ fontWeight: 800 }}
          >
            {t(interfaceLanguage, 'agentsTitle')}
          </Typography>
        </Box>

        {!hasAgentsIntroCoachmarkBeenShown && (
          <Paper
            aria-label={t(interfaceLanguage, 'agentsIntroCoachmarkTitle')}
            data-test="agents_view__intro_coachmark"
            role="dialog"
            sx={{
              bgcolor: '#fff8ef',
              border: '1px solid rgba(150, 93, 26, 0.22)',
              borderRadius: 3,
              boxShadow:
                '0 18px 36px rgba(105, 67, 20, 0.12), inset 0 0 0 1px rgba(255,255,255,0.68)',
              p: { xs: 1.5, sm: 2 },
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                background:
                  'radial-gradient(circle, rgba(255, 209, 102, 0.42), transparent 64%)',
                height: 120,
                position: 'absolute',
                right: -20,
                top: -44,
                width: 120,
              }}
            />
            <Stack data-test="agents_view__intro_coachmark_content" spacing={1.25}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  aria-hidden="true"
                  data-test="agents_view__intro_coachmark_icon__news"
                  sx={{
                    alignItems: 'center',
                    bgcolor: '#fff0c2',
                    border: '1px solid rgba(150, 93, 26, 0.26)',
                    borderRadius: '50%',
                    color: '#6f4bd8',
                    display: 'inline-flex',
                    height: 34,
                    justifyContent: 'center',
                    width: 34,
                  }}
                >
                  <NewspaperIcon fontSize="small" />
                </Box>
                <Typography
                  data-test="agents_view__intro_coachmark_title"
                  sx={{
                    color: '#5c3d14',
                    fontSize: 15,
                    fontWeight: 950,
                    lineHeight: 1.2,
                  }}
                >
                  {t(interfaceLanguage, 'agentsIntroCoachmarkTitle')}
                </Typography>
              </Stack>
              <Stack
                data-test="agents_view__intro_details"
                spacing={1.5}
                sx={{ pt: 0.25 }}
              >
                <Typography
                  color="text.secondary"
                  data-test="agents_view__open_router_intro"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.58)',
                    border: '1px solid rgba(150, 93, 26, 0.16)',
                    borderRadius: 2,
                    color: '#6b5a43',
                    fontSize: 13,
                    lineHeight: 1.4,
                    p: 1.15,
                  }}
                >
                  {t(interfaceLanguage, 'agentsOpenRouterIntro')}{' '}
                  <Link
                    data-test="agents_view__open_router_link"
                    href="https://openrouter.ai/"
                    rel="noreferrer"
                    target="_blank"
                    sx={{
                      color: '#174e69',
                      fontWeight: 900,
                      textDecorationColor: 'rgba(23, 78, 105, 0.48)',
                    }}
                  >
                    Open Router
                  </Link>
                  {t(interfaceLanguage, 'agentsOpenRouterIntroSuffix')}
                </Typography>

                <Alert
                  data-test="agents_view__trial_key_notice"
                  icon={<KeyIcon data-test="agents_view__trial_key_icon" />}
                  severity="info"
                  sx={{
                    alignItems: 'center',
                    bgcolor: '#eef8fc',
                    border: '1px solid rgba(37, 118, 150, 0.18)',
                    color: '#174e69',
                  }}
                >
                  {t(interfaceLanguage, 'agentsTrialKeyNotice')}
                </Alert>

                <Box data-test="agents_view__capabilities">
                  <Stack data-test="agents_view__capabilities_content" spacing={1.25}>
                    <Stack
                      data-test="agents_view__capabilities_title_row"
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Box
                        aria-hidden="true"
                        data-test="agents_view__capabilities_title_icon"
                        sx={{
                          alignItems: 'center',
                          bgcolor: '#e8f6fb',
                          border: '1px solid rgba(37, 118, 150, 0.20)',
                          borderRadius: '50%',
                          color: '#174e69',
                          display: 'inline-flex',
                          height: 32,
                          justifyContent: 'center',
                          width: 32,
                        }}
                      >
                        <AutoAwesomeIcon fontSize="small" />
                      </Box>
                      <Typography
                        data-test="agents_view__capabilities_title"
                        fontWeight={900}
                      >
                        {t(interfaceLanguage, 'agentsCapabilitiesTitle')}
                      </Typography>
                    </Stack>

                    <Stack data-test="agents_view__capability_rows" spacing={1}>
                      {agentCapabilityRows.map((row) => (
                        <Stack
                          data-test={`agents_view__capability_row__${row.key}`}
                          key={row.key}
                          direction="row"
                          spacing={1.25}
                          alignItems="flex-start"
                          sx={{
                            bgcolor: '#ffffff',
                            border: '1px solid rgba(37, 118, 150, 0.14)',
                            borderRadius: 2,
                            boxShadow: '0 8px 18px rgba(23, 78, 105, 0.06)',
                            p: 1.25,
                          }}
                        >
                          <Box
                            aria-hidden="true"
                            data-test={`agents_view__capability_icon__${row.key}`}
                            sx={{
                              alignItems: 'center',
                              bgcolor: getAgentCapabilityTone(row.key).bg,
                              border: `1px solid ${getAgentCapabilityTone(row.key).border}`,
                              borderRadius: 1.5,
                              color: getAgentCapabilityTone(row.key).color,
                              display: 'inline-flex',
                              flexShrink: 0,
                              height: 32,
                              justifyContent: 'center',
                              mt: 0.1,
                              width: 32,
                            }}
                          >
                            {row.icon}
                          </Box>
                          <Typography data-test={`agents_view__capability_text__${row.key}`}>
                            {t(interfaceLanguage, row.key)}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
              <Button
                data-test="agents_view__intro_coachmark_close_button"
                size="small"
                variant="outlined"
                onClick={() => dispatch(markAgentsIntroCoachmarkShown())}
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: '#fffaf0',
                  borderColor: 'rgba(150, 93, 26, 0.30)',
                  borderRadius: 2,
                  color: '#5c3d14',
                  fontWeight: 900,
                  '&:hover': {
                    bgcolor: '#fff1c8',
                    borderColor: 'rgba(150, 93, 26, 0.44)',
                  },
                }}
              >
                {t(interfaceLanguage, 'tutorialClose')}
              </Button>
            </Stack>
          </Paper>
        )}

        <Divider data-test="agents_view__import_divider" />

        <Box data-test="import_cards__header">
          <Typography
            data-test="import_cards__title"
            variant="h6"
            component="h3"
            sx={{ fontWeight: 800 }}
          >
            {t(interfaceLanguage, 'importCards')}
          </Typography>
          <Typography
            color="text.secondary"
            data-test="import_cards__description"
            sx={{ mt: 0.5 }}
          >
            {t(interfaceLanguage, 'importDescription')}
          </Typography>
          <Link
            component="a"
            data-test="import_cards__download_format_link"
            download="LANGUAGE_CARD_FORMAT.md"
            href={languageCardFormatUrl}
            sx={{
              color: '#174e69',
              display: 'inline-flex',
              fontWeight: 850,
              mt: 1,
              textDecorationLine: 'underline',
              textDecorationThickness: '1px',
              textUnderlineOffset: '3px',
              '&:hover': {
                textDecorationLine: 'none',
              },
            }}
          >
            {t(interfaceLanguage, 'downloadCardFormat')}
          </Link>
        </Box>

        <Paper
          data-test="import_cards__file_panel"
          variant="outlined"
          sx={{
            bgcolor: '#ffffff',
            borderColor: 'rgba(37, 118, 150, 0.16)',
            p: 2,
          }}
        >
          <Stack
            data-test="import_cards__file_controls"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <Button
              component="label"
              data-test="import_cards__choose_file_button"
              variant="outlined"
              sx={{
                bgcolor: '#eef8fc',
                borderColor: 'rgba(37, 118, 150, 0.42)',
                color: '#174e69',
                fontWeight: 900,
                '&:hover': {
                  bgcolor: '#e8f6fb',
                  borderColor: '#2f7d9b',
                },
              }}
            >
              {t(interfaceLanguage, 'chooseJsonFile')}
              <input
                aria-label={t(interfaceLanguage, 'chooseJsonFile')}
                accept=".json,application/json"
                data-test="import_cards__file_input"
                hidden
                type="file"
                onChange={handleFileChange}
              />
            </Button>
            <Typography
              color="text.secondary"
              data-test="import_cards__file_status"
              variant="body2"
            >
              {selectedFileName
                ? formatImportedFile(interfaceLanguage, selectedFileName)
                : formatStoredCardCount(interfaceLanguage, cards.length)}
            </Typography>
          </Stack>
        </Paper>

        {fileError && (
          <Alert data-test="import_cards__file_error_alert" severity="error">
            {fileError}
          </Alert>
        )}

        {lastResult && (
          <>
            <Divider />
            <Stack
              data-test="import_cards__summary_chips"
              direction="row"
              spacing={1}
              flexWrap="wrap"
              useFlexGap
            >
              {summaryLabels.map((item) => (
                <Chip
                  data-test={`import_cards__summary_chip__${item.key}`}
                  key={item.key}
                  label={`${t(interfaceLanguage, item.labelKey)}: ${
                    lastResult.summary[item.key]
                  }`}
                  color={
                    item.key === 'invalid' && lastResult.summary.invalid > 0
                      ? 'error'
                      : item.key === 'pendingDuplicates' &&
                          lastResult.summary.pendingDuplicates > 0
                        ? 'warning'
                        : 'default'
                  }
                  variant="outlined"
                />
              ))}
            </Stack>

            {rootErrors.map((record, index) => (
              <Alert
                data-test={`import_cards__root_error__${index}`}
                key={record.reason}
                severity="error"
              >
                {record.reason}
              </Alert>
            ))}

            {recordErrors.length > 0 && (
              <Alert data-test="import_cards__record_errors_alert" severity="warning">
                <Stack data-test="import_cards__record_errors_list" spacing={0.5}>
                  <Typography data-test="import_cards__record_errors_title" fontWeight={700}>
                    {t(interfaceLanguage, 'recordsCouldNotBeImported')}
                  </Typography>
                  {recordErrors.map((record) => (
                    <Typography
                      data-test={`import_cards__record_error__${record.index}`}
                      key={`${record.index}-${record.reason}`}
                    >
                      {t(interfaceLanguage, 'row')} {record.index + 1}:{' '}
                      {record.reason}
                    </Typography>
                  ))}
                </Stack>
              </Alert>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}

function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
