import TextField from "@mui/material/TextField";

import {
  PK_PHONE_HELPER_TEXT,
  PK_PHONE_MESSAGE,
  sanitizePkPhoneInput,
} from "../validation/pkPhone.js";

/**
 * Optional PK mobile: digits only, max 11, must start with 03 when non-empty.
 * @param {(digits: string) => void} onPhoneChange
 */
export function PhoneTextField({
  value,
  onPhoneChange,
  error = false,
  helperText,
  label = "Phone",
  inputProps,
  ...rest
}) {
  const showError = Boolean(error);
  const resolvedHelper = showError
    ? helperText || PK_PHONE_MESSAGE
    : helperText ?? PK_PHONE_HELPER_TEXT;

  return (
    <TextField
      label={label}
      value={value}
      onChange={(ev) => onPhoneChange(sanitizePkPhoneInput(ev.target.value))}
      error={showError}
      helperText={resolvedHelper}
      inputProps={{ maxLength: 11, inputMode: "numeric", ...inputProps }}
      {...rest}
    />
  );
}
