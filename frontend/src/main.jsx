// App entry point — mounts React with routing, MUI theme, and global styles.
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App.jsx";
import { theme } from "./shared/theme/theme.js";

// Drop a legacy theme key so everyone uses the single light theme from shared/theme/theme.js.
try {
  localStorage.removeItem("hsms_theme_mode");
} catch {
  /* ignore */
}

// BrowserRouter wraps the whole app so every page can use React Router links and guards.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
