import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { DialogFormError } from "../../../shared/components/DialogFormError.jsx";
import { apiGet, apiPost } from "../../../shared/api/client.js";

function money(n) {
  return typeof n === "number"
    ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
}

function day(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}

function normalizeCardDigits(s) {
  return s.replace(/\s/g, "").replace(/\D/g, "");
}

function passesLuhn(digits) {
  if (!/^\d{13,19}$/.test(digits)) return false;
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

function spacedCardDigits(digits) {
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function ResidentBillsPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [payBill, setPayBill] = useState(null);
  const [cardDigits, setCardDigits] = useState("");

  const cardNumberValid = useMemo(() => passesLuhn(cardDigits), [cardDigits]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/bills?limit=100");
      setBills(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitPay(e) {
    e.preventDefault();
    if (!payBill || !cardNumberValid) return;
    setDialogError(null);
    try {
      await apiPost("/payments/card", {
        billId: payBill.id,
        cardNumber: cardDigits,
      });
      setPayBill(null);
      setCardDigits("");
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Payment failed");
    }
  }

  const unpaid = bills.filter((b) => b.status !== "Paid");

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Bills & payment</Typography>
      <Typography variant="body2" color="text.secondary">
        You will only see bills for units linked to your account.
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : `${unpaid.length} unpaid · ${bills.length} total`}
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Unit</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Due</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Pay</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bills.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.unit?.unitNumber ?? row.unitId}</TableCell>
              <TableCell>{row.billType}</TableCell>
              <TableCell>{money(row.amount)}</TableCell>
              <TableCell>{day(row.dueDate)}</TableCell>
              <TableCell>{row.effectiveStatus ?? row.status}</TableCell>
              <TableCell align="right">
                {row.status !== "Paid" ? (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      setDialogError(null);
                      setPayBill(row);
                    }}
                  >
                    Pay
                  </Button>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
          {!loading && bills.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography color="text.secondary">
                  No bills yet. If you recently moved in, ask the admin to link your unit to your account.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={Boolean(payBill)}
        onClose={() => {
          setDialogError(null);
          setPayBill(null);
          setCardDigits("");
        }}
        fullWidth
        maxWidth="xs"
      >
        <form onSubmit={submitPay}>
          <DialogTitle>Pay bill</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <Typography variant="body2">
                Amount due: <strong>{payBill ? money(payBill.amount) : ""}</strong>
              </Typography>
              <TextField
                required
                fullWidth
                label="Card number"
                value={spacedCardDigits(cardDigits)}
                onChange={(ev) => {
                  const next = normalizeCardDigits(ev.target.value).slice(0, 19);
                  setCardDigits(next);
                }}
                inputProps={{
                  inputMode: "numeric",
                  autoComplete: "cc-number",
                  maxLength: 26,
                }}
                helperText="Enter your card number as shown on the card."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setDialogError(null);
                setPayBill(null);
                setCardDigits("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={!cardNumberValid}>
              Pay now
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
