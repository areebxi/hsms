/**
 * View society bills for the resident's units, dismiss new-bill alerts,
 * and pay unpaid bills online via card or net banking (dummy gateway).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { DialogFormError } from "../../../shared/components/DialogFormError.jsx";
import { apiGet, apiPatch, apiPost } from "../../../shared/api/client.js";

// Banks offered in the net-banking payment form.
const BANKS = [
  { code: "HBL", label: "HBL" },
  { code: "UBL", label: "UBL" },
  { code: "MCB", label: "MCB" },
  { code: "MEEZAN", label: "Meezan Bank" },
];

// Format amounts and dates for display in the table and alerts.
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

// Card field helpers: strip spaces, add spacing, and format MM/YY expiry.
function normalizeCardDigits(s) {
  return s.replace(/\s/g, "").replace(/\D/g, "");
}

function spacedCardDigits(digits) {
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiryInput(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

// Default payment form when opening or closing the pay dialog.
function emptyForm() {
  return {
    channel: "Card",
    cardBrand: "Visa",
    cardholderName: "",
    cardDigits: "",
    expiry: "",
    securityCode: "",
    bankCode: "",
    customerId: "",
    pin: "",
  };
}

// Build a readable message from a bill_created notification payload.
function billNotificationMessage(payload) {
  const unit = payload?.unitNumber ?? payload?.unitId ?? "your unit";
  const type = payload?.billType ?? "Bill";
  const amount = money(payload?.amount);
  const due = day(payload?.dueDate);
  return `Bill generated — ${type} for unit ${unit}: ${amount}, due ${due}.`;
}

export function ResidentBillsPage() {
  const [bills, setBills] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);
  const [payBill, setPayBill] = useState(null); // bill row being paid, or null when dialog is closed
  const [form, setForm] = useState(emptyForm);
  const [paying, setPaying] = useState(false);
  const [successRef, setSuccessRef] = useState(null); // transaction ref shown after a successful payment

  // Require enough card or net-banking details before Pay now is enabled.
  const formValid = useMemo(() => {
    if (form.channel === "NetBanking") {
      return (
        Boolean(form.bankCode) &&
        form.customerId.trim().length >= 4 &&
        form.pin.replace(/\D/g, "").length >= 4
      );
    }
    const expiryDigits = form.expiry.replace(/\D/g, "");
    return (
      form.cardholderName.trim().length >= 2 &&
      form.cardDigits.length >= 13 &&
      expiryDigits.length === 4 &&
      form.securityCode.replace(/\D/g, "").length === 3
    );
  }, [form]);

  // Load bills and unread bill-created notifications for this resident.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [billsData, notificationsData] = await Promise.all([
        apiGet("/bills?limit=100"),
        apiGet("/notifications?unreadOnly=true"),
      ]);
      setBills(billsData.items ?? []);
      setNotifications(
        (notificationsData.items ?? []).filter((n) => n.event === "bill_created")
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reset payment dialog state when the user closes it or after success.
  function closePayDialog() {
    setDialogError(null);
    setPayBill(null);
    setForm(emptyForm());
    setPaying(false);
    setSuccessRef(null);
  }

  // Merge a partial update into the payment form.
  function patchForm(patch) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  // Payment flow: send bill id and method to the gateway, show ref, then refresh bills.
  async function submitPay(e) {
    e.preventDefault();
    if (!payBill || !formValid || paying) return;
    setDialogError(null);
    setPaying(true);
    try {
      const paymentMethod =
        form.channel === "NetBanking" ? "NetBanking" : form.cardBrand;
      const result = await apiPost("/payments/gateway", {
        billId: payBill.id,
        paymentMethod,
      });
      setSuccessRef(result.transactionRef || "OK");
      await load();
      setTimeout(() => {
        closePayDialog();
      }, 1200);
    } catch (err) {
      setPaying(false);
      setDialogError(err instanceof Error ? err.message : "Payment failed");
    }
  }

  // Mark a bill alert as read and remove it from the banner list.
  async function dismissNotification(notificationId) {
    try {
      await apiPatch(`/notifications/${notificationId}/read`, {});
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dismiss notification");
    }
  }

  const unpaid = bills.filter((b) => b.status !== "Paid"); // used in the summary line

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

      {notifications.map((n) => (
        <Alert
          key={n.id}
          severity="info"
          onClose={() => dismissNotification(n.id)}
        >
          {billNotificationMessage(n.payload)}
        </Alert>
      ))}

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
                      setSuccessRef(null);
                      setForm(emptyForm());
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

      <Dialog open={Boolean(payBill)} onClose={closePayDialog} fullWidth maxWidth="sm">
        <form onSubmit={submitPay}>
          <DialogTitle>Secure payment</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />

              {successRef ? (
                <Alert severity="success">Payment successful. Ref: {successRef}</Alert>
              ) : (
                <>
                  <Typography variant="body2">
                    Amount due: <strong>{payBill ? money(payBill.amount) : ""}</strong>
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    fullWidth
                    value={form.channel}
                    onChange={(_e, next) => {
                      if (next) patchForm({ channel: next });
                    }}
                  >
                    <ToggleButton value="Card">Card</ToggleButton>
                    <ToggleButton value="NetBanking">Net banking</ToggleButton>
                  </ToggleButtonGroup>

                  {form.channel === "Card" ? (
                    <Stack spacing={2}>
                      <FormControl>
                        <FormLabel>Payment method</FormLabel>
                        <RadioGroup
                          row
                          value={form.cardBrand}
                          onChange={(ev) => patchForm({ cardBrand: ev.target.value })}
                        >
                          <FormControlLabel value="Visa" control={<Radio />} label="Visa" />
                          <FormControlLabel
                            value="Mastercard"
                            control={<Radio />}
                            label="Mastercard"
                          />
                        </RadioGroup>
                      </FormControl>

                      <TextField
                        required
                        fullWidth
                        label="Cardholder name"
                        value={form.cardholderName}
                        onChange={(ev) => patchForm({ cardholderName: ev.target.value })}
                        inputProps={{ autoComplete: "off" }}
                      />

                      <TextField
                        required
                        fullWidth
                        label="Card number"
                        value={spacedCardDigits(form.cardDigits)}
                        onChange={(ev) => {
                          const next = normalizeCardDigits(ev.target.value).slice(0, 19);
                          patchForm({ cardDigits: next });
                        }}
                        inputProps={{
                          inputMode: "numeric",
                          autoComplete: "off",
                          maxLength: 26,
                        }}
                      />

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 2,
                        }}
                      >
                        <TextField
                          required
                          fullWidth
                          label="Expiry date"
                          placeholder="MM/YY"
                          value={form.expiry}
                          onChange={(ev) => patchForm({ expiry: formatExpiryInput(ev.target.value) })}
                          inputProps={{
                            inputMode: "numeric",
                            autoComplete: "off",
                            maxLength: 5,
                          }}
                        />
                        <TextField
                          required
                          fullWidth
                          label="Security code"
                          value={form.securityCode}
                          onChange={(ev) => {
                            const next = ev.target.value.replace(/\D/g, "").slice(0, 3);
                            patchForm({ securityCode: next });
                          }}
                          inputProps={{
                            inputMode: "numeric",
                            autoComplete: "off",
                            maxLength: 3,
                          }}
                        />
                      </Box>
                    </Stack>
                  ) : (
                    <Stack spacing={2}>
                      <TextField
                        select
                        required
                        fullWidth
                        label="Bank"
                        value={form.bankCode}
                        onChange={(ev) => patchForm({ bankCode: ev.target.value })}
                      >
                        {BANKS.map((b) => (
                          <MenuItem key={b.code} value={b.code}>
                            {b.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        required
                        fullWidth
                        label="Customer ID"
                        value={form.customerId}
                        onChange={(ev) => patchForm({ customerId: ev.target.value })}
                        inputProps={{ autoComplete: "off" }}
                      />
                      <TextField
                        required
                        fullWidth
                        type="password"
                        label="PIN"
                        value={form.pin}
                        onChange={(ev) => {
                          const next = ev.target.value.replace(/\D/g, "").slice(0, 6);
                          patchForm({ pin: next });
                        }}
                        inputProps={{
                          inputMode: "numeric",
                          autoComplete: "off",
                          maxLength: 6,
                        }}
                      />
                    </Stack>
                  )}
                </>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button type="button" onClick={closePayDialog} disabled={paying && !successRef}>
              {successRef ? "Close" : "Cancel"}
            </Button>
            {!successRef && (
              <Button type="submit" variant="contained" disabled={!formValid || paying}>
                {paying ? "Processing…" : "Pay now"}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
