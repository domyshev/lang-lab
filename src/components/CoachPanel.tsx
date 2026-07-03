import { Box, Paper } from '@mui/material';
import { useSelector } from 'react-redux';
import forestTutor from '../assets/characters/forest-tutor.png';
import kitchenSage from '../assets/characters/kitchen-sage.png';
import starHero from '../assets/characters/star-hero.png';
import { AssistantId, defaultAssistantId } from '../domain/assistants';
import { RootState } from '../store/store';

const assistantImages: Record<AssistantId, string> = {
  forestTutor,
  kitchenSage,
  starHero,
};

export function CoachPanel() {
  const assistantId = useSelector(
    (state: RootState) => state.app.assistantId ?? defaultAssistantId,
  );

  return (
    <Paper sx={{ p: 2, borderLeft: '4px solid #9cca56', overflow: 'hidden' }}>
      <Box
        aria-label="Assistant character"
        className="coachPortrait"
        sx={{
          width: '100%',
          maxWidth: 220,
          aspectRatio: '4 / 5',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'secondary.main',
          border: '1px solid rgba(32, 48, 21, 0.18)',
          mx: 'auto',
        }}
      >
        <Box
          component="img"
          src={assistantImages[assistantId]}
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
    </Paper>
  );
}
