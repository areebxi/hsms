/**
 * Stand-in payment gateway for development and demos.
 * No real money moves — returns a fake transaction ref so billing flow can be tested end-to-end.
 * Card/net-banking fields stay on the UI only and are never sent here.
 */

/**
 * @param {{ billId: string, amount: number, paymentMethod?: string }} params
 */
export function processDummyPayment({ billId, amount, paymentMethod }) {
  if (!billId) {
    return { ok: false, reason: "invalid_request" };
  }
  if (typeof amount !== "number" || amount <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }
  // Sanitize method name for a readable ref — letters/digits only, max 8 chars.
  const methodTag = String(paymentMethod || "Card")
    .replace(/\W+/g, "")
    .slice(0, 8)
    .toUpperCase() || "PAY";
  return {
    ok: true,
    transactionRef: `TXN-${methodTag}-${Date.now()}`,
    paidAt: new Date().toISOString(),
  };
}
