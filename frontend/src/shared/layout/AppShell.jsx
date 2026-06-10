import { Box, Container } from "@mui/material";

export function AppShell({ children }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: { md: 1440 },
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: 3,
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
