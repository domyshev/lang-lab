import { Box, Paper, Stack, Typography } from '@mui/material';
import coachAnalyst from '../assets/coach-analyst.png';

export function CoachPanel({ comment }: { comment: string }) {
  return (
    <Paper sx={{ p: 2, borderLeft: '4px solid #9cca56', overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems="center"
      >
        <Box
          aria-label="Sports coach"
          className="coachPortrait"
          sx={{
            width: 96,
            height: 116,
            borderRadius: 2,
            position: 'relative',
            flex: '0 0 auto',
            overflow: 'hidden',
            bgcolor: 'secondary.main',
            border: '1px solid rgba(32, 48, 21, 0.18)',
          }}
        >
          <Box
            component="img"
            src={coachAnalyst}
            alt=""
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block',
            }}
          />
          <Box className="coachWink" aria-hidden="true" />
        </Box>
        <Box>
          <Typography variant="overline">Coach</Typography>
          <Typography>{comment}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
