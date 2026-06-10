export const PK_PHONE_REGEX = /^03\d{9}$/;
export const PK_PHONE_MESSAGE = "Phone must be 11 digits starting with 03";
export const PK_PHONE_HELPER_TEXT = "Optional. 11 digits starting with 03 (e.g. 03001234567).";

export function sanitizePkPhoneInput(raw) {
  return String(raw ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);
}

/** True if empty or valid PK mobile. */
export function isValidOptionalPkPhone(s) {
  const t = String(s ?? "").trim();
  return t === "" || PK_PHONE_REGEX.test(t);
}

/** For optional phone fields: `null` if OK, else error message. */
export function optionalPhoneFieldError(s) {
  const t = String(s ?? "").trim();
  if (t === "") return null;
  return PK_PHONE_REGEX.test(t) ? null : PK_PHONE_MESSAGE;
}
