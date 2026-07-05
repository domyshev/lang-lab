import { ChangeEvent, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
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

export function ImportCardsView() {
  const dispatch = useDispatch<AppDispatch>();
  const cards = useSelector((state: RootState) => state.cards.cards);
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const [pastedJson, setPastedJson] = useState('');
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleImport = () => {
    importCardsFromText(pastedJson);
  };

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
    <Paper data-test="import_cards__panel" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack data-test="import_cards__content" spacing={2.5}>
        <Box data-test="import_cards__header">
          <Typography
            data-test="import_cards__title"
            variant="h5"
            component="h2"
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
          <Button
            component="a"
            data-test="import_cards__download_format_link"
            download="LANGUAGE_CARD_FORMAT.md"
            href={languageCardFormatUrl}
            size="small"
            variant="text"
            sx={{ mt: 1, px: 0 }}
          >
            {t(interfaceLanguage, 'downloadCardFormat')}
          </Button>
        </Box>

        <Accordion data-test="import_cards__file_accordion" defaultExpanded disableGutters>
          <AccordionSummary
            data-test="import_cards__file_summary"
            expandIcon={<ExpandMoreIcon data-test="import_cards__file_expand_icon" />}
          >
            <Typography data-test="import_cards__file_title" fontWeight={800}>
              {t(interfaceLanguage, 'fileImport')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails data-test="import_cards__file_details">
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
          </AccordionDetails>
        </Accordion>

        <Accordion
          data-test="import_cards__paste_accordion"
          disableGutters
          slotProps={{ transition: { unmountOnExit: true } }}
        >
          <AccordionSummary
            data-test="import_cards__paste_summary"
            expandIcon={<ExpandMoreIcon data-test="import_cards__paste_expand_icon" />}
          >
            <Typography data-test="import_cards__paste_title" fontWeight={800}>
              {t(interfaceLanguage, 'pasteJson')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails data-test="import_cards__paste_details">
            <Stack data-test="import_cards__paste_form" spacing={2}>
              <TextField
                data-test="import_cards__json_textarea"
                label={t(interfaceLanguage, 'cardsJson')}
                value={pastedJson}
                onChange={(event) => setPastedJson(event.target.value)}
                placeholder={`[
  {
    "translations": {
      "en": "apple",
      "es": "manzana",
      "ru": "yabloko"
    },
    "tags": ["food"],
    "difficulty": "easy"
  }
]`}
                multiline
                minRows={12}
                fullWidth
              />
              <Button
                data-test="import_cards__paste_import_button"
                startIcon={<FileUploadIcon />}
                variant="contained"
                onClick={handleImport}
                disabled={!pastedJson.trim()}
                sx={{ alignSelf: 'flex-start' }}
              >
                {t(interfaceLanguage, 'importAction')}
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

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
