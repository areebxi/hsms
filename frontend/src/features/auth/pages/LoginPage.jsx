// Sign-in page — posts credentials, stores the JWT, and routes by role.
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiPost, setStoredToken } from "../../../shared/api/client.js";
import { ROLE_HOME } from "../../../shared/constants/roles.js";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1. Call the login API with email + password.
      const data = await apiPost("/auth/login", { email, password });
      // 2. Save the JWT so later API calls and route guards can use it.
      setStoredToken(data.token);
      // 3. Look up where this role should land (admin, resident, etc.).
      const home = ROLE_HOME[data.user.role];
      if (!home) {
        throw new Error("Unknown role from server");
      }
      // 4. Replace history so the user can't "back" into the login form.
      navigate(home, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 440, mx: "auto", width: "100%" }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Housing Society Management System
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sign in with the email and password your society gave you
        </Typography>
      </Stack>

      <Card component="form" onSubmit={handleSubmit}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              disabled={loading}
            />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
