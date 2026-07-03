import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#9cca56',
      contrastText: '#203015',
    },
    secondary: {
      main: '#f0f7d7',
      contrastText: '#203015',
    },
    background: {
      default: '#fbfcf5',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
});
