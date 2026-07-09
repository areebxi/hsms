// Shared MUI theme — colors, typography, and component defaults for the whole app.
import { alpha, createTheme } from "@mui/material/styles";

const PRIMARY = {
  main: "#0f172a",
  light: "#334155",
  dark: "#020617",
  contrastText: "#ffffff",
};

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: PRIMARY,
    secondary: { main: "#64748b" },
    text: {
      primary: "#111827",
      secondary: "#6b7280",
    },
    background: { default: "#f9fafb", paper: "#ffffff" },
    divider: alpha("#000000", 0.08),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: {
      defaultProps: {
        elevation: 0,
        variant: "outlined",
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius,
          borderColor: theme.palette.divider,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
        }),
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 10,
          fontWeight: 500,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          backgroundColor: alpha(theme.palette.grey[100], 0.9),
        }),
        notchedOutline: ({ theme }) => ({
          borderColor: theme.palette.divider,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          fontWeight: 600,
          color: theme.palette.text.secondary,
          borderBottomColor: theme.palette.divider,
        }),
        root: ({ theme }) => ({
          borderBottomColor: theme.palette.divider,
        }),
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.palette.divider,
        }),
      },
    },
  },
});
