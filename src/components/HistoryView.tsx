import { List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import { t } from '../domain/i18n';
import { RootState } from '../store/store';

export function HistoryView() {
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
  );
  const attempts = useSelector((state: RootState) =>
    state.attempts.attempts.filter(
      (attempt) => attempt.targetLanguage === targetLanguage,
    ),
  );

  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h6">
          {t(interfaceLanguage, 'statistics')}
        </Typography>
        <List dense>
          {attempts.map((attempt) => (
            <ListItem key={attempt.id} disablePadding>
              <ListItemText
                primary={`${attempt.exerciseType} / ${attempt.targetLanguage}`}
                secondary={`${attempt.completedAt ?? attempt.createdAt} / score ${
                  attempt.weightedScore ?? 0
                }`}
              />
            </ListItem>
          ))}
        </List>
        {attempts.length === 0 && (
          <Typography color="text.secondary">
            No attempts for this target language yet.
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
