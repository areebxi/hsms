/**
 * In-process card authorization simulator (no external PSP).
 * Never persist full PAN; caller must only store payment metadata.
 */

function passesLuhn(digits) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = parseInt(digits.charAt(i), 10);
    if (Number.isNaN(digit)) return false;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * @param {{ billId: string, cardNumber: string, amount: number }} params — cardNumber digits only, 13–19 chars
 */
export function processCardPayment({ billId, cardNumber, amount }) {
  if (!billId || typeof cardNumber !== "string") {
    return { ok: false, reason: "invalid_card_number" };
  }
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) {
    return { ok: false, reason: "invalid_card_number" };
  }
  if (!passesLuhn(digits)) {
    return { ok: false, reason: "invalid_card_number" };
  }
  if (typeof amount !== "number" || amount <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }
  const last4 = digits.slice(-4);
  return {
    ok: true,
    transactionRef: `TXN-${Date.now()}-${last4}`,
    paidAt: new Date().toISOString(),
  };
}
