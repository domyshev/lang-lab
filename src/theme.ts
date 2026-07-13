import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    primary: {
      main: '#ffc400',
      contrastText: '#2b1600',
    },
    secondary: {
      main: '#c60b1e',
      contrastText: '#fff7cc',
    },
    background: {
      default: '#fffaf0',
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
