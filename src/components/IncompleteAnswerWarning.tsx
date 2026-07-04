import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { Box } from '@mui/material';

export function IncompleteAnswerWarning({
  label,
  pulseKey,
  visible,
}: {
  label: string;
  pulseKey: number;
  visible: boolean;
}) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'inline-flex',
        flexShrink: 0,
        height: 38,
        justifyContent: 'center',
        width: 34,
      }}
    >
      {visible && (
        <WarningAmberRoundedIcon
          key={pulseKey}
          aria-label={label}
          className="missingInputWarning"
          sx={{ color: '#d6a500', fontSize: 30 }}
        />
      )}
    </Box>
  );
}
