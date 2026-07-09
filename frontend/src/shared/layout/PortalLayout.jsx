// Shared shell for every role portal — header, nav pills, logout, and page content slot.
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { LogoutButton } from "./LogoutButton.jsx";

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {{ to: string; label: string; end?: boolean }[]} props.links
 * @param {import("react").ReactNode} props.children
 */
export function PortalLayout({ title, subtitle, links, children }) {
  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
        useFlexGap
      >
        <Box>
          <Typography variant="h5" component="h1">
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
          <LogoutButton />
        </Stack>
      </Stack>

      {/* Pill nav — each portal passes its own link list; active route gets highlighted */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          p: 0.5,
          borderRadius: 999,
          bgcolor: "grey.100",
        }}
      >
        {links.map((l) => (
          <Button
            key={l.to}
            component={NavLink}
            to={l.to}
            end={Boolean(l.end)}
            size="small"
            sx={{
              borderRadius: 999,
              px: 2,
              py: 0.75,
              textTransform: "none",
              fontWeight: 500,
              color: "text.secondary",
              "&.active": {
                bgcolor: "background.paper",
                color: "text.primary",
                boxShadow: "0 1px 2px rgba(15,23,42,0.08)",
              },
            }}
          >
            {l.label}
          </Button>
        ))}
      </Box>

      <Divider />

      {/* Child route page renders here (Outlet from each role Layout) */}
      {children}
    </Stack>
  );
}
