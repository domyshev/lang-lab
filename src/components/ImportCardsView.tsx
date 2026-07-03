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
import { t } from '../domain/i18n';
import { applyImportResult } from '../store/cardsSlice';
import { AppDispatch, RootState } from '../store/store';

const summaryLabels: Array<{ key: keyof ImportSummary; label: string }> = [
  { key: 'added', label: 'Added' },
  { key: 'safeMerged', label: 'Safe merged' },
  { key: 'pendingDuplicates', label: 'Pending duplicates' },
  { key: 'invalid', label: 'Invalid' },
  { key: 'skipped', label: 'Skipped' },
];

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
      setFileError('Could not read this file.');
    }
  };

  const rootErrors =
    lastResult?.invalidRecords.filter((record) => record.index === -1) ?? [];
  const recordErrors =
    lastResult?.invalidRecords.filter((record) => record.index !== -1) ?? [];

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
            {t(interfaceLanguage, 'importCards')}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Load a JSON file or paste a JSON array of language cards.
          </Typography>
        </Box>

        <Accordion defaultExpanded disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={800}>
              {t(interfaceLanguage, 'fileImport')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems={{ xs: 'stretch', sm: 'center' }}
            >
              <Button component="label" variant="outlined">
                {t(interfaceLanguage, 'chooseJsonFile')}
                <input
                  aria-label={t(interfaceLanguage, 'chooseJsonFile')}
                  accept=".json,application/json"
                  hidden
                  type="file"
                  onChange={handleFileChange}
                />
              </Button>
              <Typography color="text.secondary" variant="body2">
                {selectedFileName
                  ? `${selectedFileName} imported`
                  : `${cards.length} cards currently stored`}
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          slotProps={{ transition: { unmountOnExit: true } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={800}>
              {t(interfaceLanguage, 'pasteJson')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <TextField
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
                startIcon={<FileUploadIcon />}
                variant="contained"
                onClick={handleImport}
                disabled={!pastedJson.trim()}
                sx={{ alignSelf: 'flex-start' }}
              >
                Import
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {fileError && <Alert severity="error">{fileError}</Alert>}

        {lastResult && (
          <>
            <Divider />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {summaryLabels.map((item) => (
                <Chip
                  key={item.key}
                  label={`${item.label}: ${lastResult.summary[item.key]}`}
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

            {rootErrors.map((record) => (
              <Alert key={record.reason} severity="error">
                {record.reason}
              </Alert>
            ))}

            {recordErrors.length > 0 && (
              <Alert severity="warning">
                <Stack spacing={0.5}>
                  <Typography fontWeight={700}>
                    Some records could not be imported.
                  </Typography>
                  {recordErrors.map((record) => (
                    <Typography key={`${record.index}-${record.reason}`}>
                      Row {record.index + 1}: {record.reason}
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
