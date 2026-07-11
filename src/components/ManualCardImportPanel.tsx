import { ChangeEvent, useState } from 'react';
import { Alert, Box, Button, Chip, Divider, Link, Paper, Stack, Typography } from '@mui/material';
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

export function ManualCardImportPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const cards = useSelector((state: RootState) => state.cards.cards);
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const text = await readFileAsText(file);
      const result = importLanguageCards({
        existingCards: cards,
        pastedJson: text,
        now: new Date().toISOString(),
      });
      dispatch(applyImportResult(result));
      setSelectedFileName(file.name);
      setFileError(null);
      setLastResult(result);
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
        <div data-test="import_cards__header">
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
              '&:hover': { textDecorationLine: 'none' },
            }}
          >
            {t(interfaceLanguage, 'downloadCardFormat')}
          </Link>
        </div>

        <Box
          data-test="import_cards__file_panel"
          sx={{
            bgcolor: '#ffffff',
            border: '1px solid',
            borderColor: 'rgba(37, 118, 150, 0.16)',
            borderRadius: 1,
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
        </Box>

        {fileError && (
          <Alert data-test="import_cards__file_error_alert" severity="error">
            {fileError}
          </Alert>
        )}

        {lastResult && (
          <>
            <Divider data-test="import_cards__summary_divider" />
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
                  label={`${t(interfaceLanguage, item.labelKey)}: ${lastResult.summary[item.key]}`}
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
                {localizeImportReason(interfaceLanguage, record.reason)}
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
                      {localizeImportReason(interfaceLanguage, record.reason)}
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

function localizeImportReason(
  language: RootState['app']['interfaceLanguage'],
  reason: string,
): string {
  switch (reason) {
    case 'JSON is not valid.':
      return t(language, 'importErrorInvalidJson');
    case 'Root value must be an array.':
      return t(language, 'importErrorRootArray');
    case 'Record must be an object.':
      return t(language, 'importErrorRecordObject');
    case 'Card must include translations for at least two supported languages.':
      return t(language, 'importErrorTranslations');
    default:
      return t(language, 'importErrorUnknown');
  }
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
