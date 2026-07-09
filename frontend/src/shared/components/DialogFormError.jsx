// Small helper that shows a form error alert inside a dialog when something goes wrong.
import { Alert } from "@mui/material";

/** Error alert for the top of a MUI DialogContent form stack. */
export function DialogFormError({ error, onClose }) {
  if (!error) return null;
  return (
    <Alert severity="error" onClose={onClose}>
      {error}
    </Alert>
  );
}
