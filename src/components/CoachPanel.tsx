import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { defaultAssistantId, resolveAssistantId } from '../domain/assistants';
import { RootState } from '../store/store';
import { AssistantStickerIcon } from './assistantAssets';

export function CoachPanel() {
  const assistantId = useSelector((state: RootState) =>
    resolveAssistantId(state.app.assistantId ?? defaultAssistantId),
  );

  return (
    <Box
      sx={{
        alignItems: 'flex-start',
        display: 'flex',
        justifyContent: 'flex-start',
        minHeight: { xs: 96, lg: 132 },
        pl: { xs: 0, lg: 1 },
        position: { lg: 'sticky' },
        top: { lg: 92 },
      }}
    >
      <AssistantStickerIcon
        ariaLabel="Assistant character"
        assistantId={assistantId}
        className="coachPortrait"
        size={118}
        sx={{ height: { xs: 90, lg: 118 }, width: { xs: 90, lg: 118 } }}
      />
    </Box>
  );
}
