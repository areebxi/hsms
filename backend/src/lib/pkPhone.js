import { z } from "zod";

export const PK_PHONE_REGEX = /^03\d{9}$/;
export const PK_PHONE_MESSAGE = "Phone must be 11 digits starting with 03";

/** Optional: omit, empty, or exactly 11 digits starting with 03. */
export const optionalPkPhone = z.preprocess(
  (val) => {
    if (val === undefined || val === null) return undefined;
    const s = String(val).trim();
    return s === "" ? undefined : s;
  },
  z.union([z.undefined(), z.string().regex(PK_PHONE_REGEX, { message: PK_PHONE_MESSAGE })]),
);
