import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { DialogFormError } from "../../../shared/components/DialogFormError.jsx";
import { PhoneTextField } from "../../../shared/components/PhoneTextField.jsx";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../../shared/api/client.js";
import { ROLES } from "../../../shared/constants/roles.js";
import { optionalPhoneFieldError, sanitizePkPhoneInput } from "../../../shared/validation/pkPhone.js";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

const ROLE_OPTIONS = Object.values(ROLES);
const STATUS_OPTIONS = ["Active", "Inactive"];

function createEmptyForm() {
  return {
    name: "",
    email: "",
    phone: "",
    password: "",
    role: ROLES.Resident,
    status: "Active",
    familyDetails: { members: [] },
    vehicleInfo: { vehicles: [] },
  };
}

function normalizeFamilyFromApi(v) {
  if (!v || typeof v !== "object" || !Array.isArray(v.members)) {
    return { members: [] };
  }
  return {
    members: v.members.map((m) => ({
      name: m.name ?? "",
      relationship: m.relationship ?? "",
      age: m.age != null && m.age !== "" ? String(m.age) : "",
      phone: sanitizePkPhoneInput(m.phone ?? ""),
    })),
  };
}

function normalizeVehicleFromApi(v) {
  if (!v || typeof v !== "object" || !Array.isArray(v.vehicles)) {
    return { vehicles: [] };
  }
  return {
    vehicles: v.vehicles.map((x) => ({
      registrationNumber: x.registrationNumber ?? "",
      makeModel: x.makeModel ?? "",
      color: x.color ?? "",
    })),
  };
}

/**
 * @param {{ familyDetails: { members: Array<{ name: string, relationship: string, age: string, phone: string }> }, vehicleInfo: { vehicles: Array<{ registrationNumber: string, makeModel: string, color: string }> } }} form
 * @returns {{ familyDetails: object, vehicleInfo: object } | { error: string }}
 */
function buildFamilyAndVehiclePayload(form) {
  const members = [];
  for (const m of form.familyDetails.members) {
    const name = (m.name ?? "").trim();
    const relationship = (m.relationship ?? "").trim();
    const phone = (m.phone ?? "").trim();
    const ageRaw = m.age === "" || m.age == null ? "" : String(m.age).trim();
    const any = name || relationship || phone || ageRaw;
    if (!any) continue;
    if (!name || !relationship) {
      return { error: "Each family member with any details must have a name and relationship." };
    }
    const pe = optionalPhoneFieldError(phone);
    if (pe) {
      return { error: `Family member (${name}): ${pe}` };
    }
    const entry = { name, relationship };
    if (ageRaw) {
      const age = Number(ageRaw);
      if (!Number.isInteger(age) || age < 0 || age > 120) {
        return { error: `Family member (${name}): age must be a whole number from 0 to 120.` };
      }
      entry.age = age;
    }
    if (phone) entry.phone = phone;
    members.push(entry);
  }

  const vehicles = [];
  for (const v of form.vehicleInfo.vehicles) {
    const reg = (v.registrationNumber ?? "").trim();
    const mm = (v.makeModel ?? "").trim();
    const color = (v.color ?? "").trim();
    const any = reg || mm || color;
    if (!any) continue;
    if (!reg) {
      return { error: "Each vehicle with any details must have a registration number." };
    }
    vehicles.push({
      registrationNumber: reg,
      ...(mm ? { makeModel: mm } : {}),
      ...(color ? { color } : {}),
    });
  }

  return { familyDetails: { members }, vehicleInfo: { vehicles } };
}

function householdSummary(row) {
  const n = Array.isArray(row.familyDetails?.members) ? row.familyDetails.members.length : 0;
  const v = Array.isArray(row.vehicleInfo?.vehicles) ? row.vehicleInfo.vehicles.length : 0;
  return `${n} fam · ${v} veh`;
}

function MemberFamilyVehicleSection({ form, setForm }) {
  const { members } = form.familyDetails;
  const { vehicles } = form.vehicleInfo;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Family in household
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Optional. If you enter any detail for a person, name and relationship are required. Use 03XXXXXXXXX for
          optional mobile numbers.
        </Typography>
        {members.map((m, i) => (
          <Stack
            key={`fm-${i}`}
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{ mb: 1.5 }}
            alignItems={{ md: "flex-start" }}
          >
            <TextField
              size="small"
              label="Name"
              value={m.name}
              onChange={(ev) => {
                const v = ev.target.value;
                setForm((f) => ({
                  ...f,
                  familyDetails: {
                    members: f.familyDetails.members.map((row, j) => (j === i ? { ...row, name: v } : row)),
                  },
                }));
              }}
              sx={{ flex: 1, minWidth: 120 }}
            />
            <TextField
              size="small"
              label="Relationship"
              value={m.relationship}
              onChange={(ev) => {
                const v = ev.target.value;
                setForm((f) => ({
                  ...f,
                  familyDetails: {
                    members: f.familyDetails.members.map((row, j) => (j === i ? { ...row, relationship: v } : row)),
                  },
                }));
              }}
              sx={{ flex: 1, minWidth: 120 }}
            />
            <TextField
              size="small"
              label="Age"
              type="number"
              value={m.age}
              onChange={(ev) => {
                const v = ev.target.value;
                setForm((f) => ({
                  ...f,
                  familyDetails: {
                    members: f.familyDetails.members.map((row, j) => (j === i ? { ...row, age: v } : row)),
                  },
                }));
              }}
              inputProps={{ min: 0, max: 120 }}
              sx={{ width: { md: 96 } }}
            />
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <PhoneTextField
                size="small"
                label="Phone (optional)"
                value={m.phone}
                onPhoneChange={(phone) =>
                  setForm((f) => ({
                    ...f,
                    familyDetails: {
                      members: f.familyDetails.members.map((row, j) => (j === i ? { ...row, phone } : row)),
                    },
                  }))
                }
              />
            </Box>
            <Button
              size="small"
              color="error"
              sx={{ alignSelf: { md: "center" } }}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  familyDetails: { members: f.familyDetails.members.filter((_, j) => j !== i) },
                }))
              }
            >
              Remove
            </Button>
          </Stack>
        ))}
        <Button
          size="small"
          variant="outlined"
          onClick={() =>
            setForm((f) => ({
              ...f,
              familyDetails: {
                members: [...f.familyDetails.members, { name: "", relationship: "", age: "", phone: "" }],
              },
            }))
          }
        >
          Add family member
        </Button>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Vehicles
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Optional. If you enter make or color, registration number is required for that row.
        </Typography>
        {vehicles.map((veh, i) => (
          <Stack
            key={`veh-${i}`}
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            sx={{ mb: 1.5 }}
            alignItems={{ md: "flex-start" }}
          >
            <TextField
              size="small"
              label="Registration"
              value={veh.registrationNumber}
              onChange={(ev) => {
                const v = ev.target.value;
                setForm((f) => ({
                  ...f,
                  vehicleInfo: {
                    vehicles: f.vehicleInfo.vehicles.map((row, j) =>
                      j === i ? { ...row, registrationNumber: v } : row
                    ),
                  },
                }));
              }}
              sx={{ flex: 1, minWidth: 120 }}
            />
            <TextField
              size="small"
              label="Make / model"
              value={veh.makeModel}
              onChange={(ev) => {
                const v = ev.target.value;
                setForm((f) => ({
                  ...f,
                  vehicleInfo: {
                    vehicles: f.vehicleInfo.vehicles.map((row, j) => (j === i ? { ...row, makeModel: v } : row)),
                  },
                }));
              }}
              sx={{ flex: 1, minWidth: 120 }}
            />
            <TextField
              size="small"
              label="Color"
              value={veh.color}
              onChange={(ev) => {
                const v = ev.target.value;
                setForm((f) => ({
                  ...f,
                  vehicleInfo: {
                    vehicles: f.vehicleInfo.vehicles.map((row, j) => (j === i ? { ...row, color: v } : row)),
                  },
                }));
              }}
              sx={{ flex: 1, minWidth: 100 }}
            />
            <Button
              size="small"
              color="error"
              sx={{ alignSelf: { md: "center" } }}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  vehicleInfo: { vehicles: f.vehicleInfo.vehicles.filter((_, j) => j !== i) },
                }))
              }
            >
              Remove
            </Button>
          </Stack>
        ))}
        <Button
          size="small"
          variant="outlined"
          onClick={() =>
            setForm((f) => ({
              ...f,
              vehicleInfo: {
                vehicles: [...f.vehicleInfo.vehicles, { registrationNumber: "", makeModel: "", color: "" }],
              },
            }))
          }
        >
          Add vehicle
        </Button>
      </Box>
    </Stack>
  );
}

export function MembersPage() {
  const [appliedQuery, setAppliedQuery] = useState("");
  const [queryInput, setQueryInput] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [phoneError, setPhoneError] = useState(null);

  const [form, setForm] = useState(() => createEmptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (appliedQuery.trim()) params.set("q", appliedQuery.trim());
      const path = params.toString() ? `/users?${params}` : "/users";
      const data = await apiGet(path);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load members");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [appliedQuery]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setDialogError(null);
    if (form.password.length < 8) {
      setDialogError("Initial password must be at least 8 characters.");
      return;
    }
    const pe = optionalPhoneFieldError(form.phone);
    if (pe) {
      setPhoneError(pe);
      return;
    }
    setPhoneError(null);
    const extra = buildFamilyAndVehiclePayload(form);
    if ("error" in extra) {
      setDialogError(extra.error);
      return;
    }
    try {
      await apiPost("/users", {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
        status: form.status,
        familyDetails: extra.familyDetails,
        vehicleInfo: extra.vehicleInfo,
      });
      setCreateOpen(false);
      setForm(createEmptyForm());
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Create failed");
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editRow) return;
    setDialogError(null);
    if (form.password.length > 0 && form.password.length < 8) {
      setDialogError("New password must be at least 8 characters.");
      return;
    }
    const pe = optionalPhoneFieldError(form.phone);
    if (pe) {
      setPhoneError(pe);
      return;
    }
    setPhoneError(null);
    const extra = buildFamilyAndVehiclePayload(form);
    if ("error" in extra) {
      setDialogError(extra.error);
      return;
    }
    try {
      const body = {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        status: form.status,
        familyDetails: extra.familyDetails,
        vehicleInfo: extra.vehicleInfo,
      };
      if (form.password.length > 0) {
        body.password = form.password;
      }
      await apiPatch(`/users/${editRow.id}`, body);
      setEditRow(null);
      setForm(createEmptyForm());
      await load();
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : "Update failed");
    }
  }

  function openEdit(row) {
    setPhoneError(null);
    setDialogError(null);
    setEditRow(row);
    setForm({
      name: row.name ?? "",
      email: row.email ?? "",
      phone: sanitizePkPhoneInput(row.phone ?? ""),
      password: "",
      role: row.role ?? ROLES.Resident,
      status: row.status ?? "Active",
      familyDetails: normalizeFamilyFromApi(row.familyDetails),
      vehicleInfo: normalizeVehicleFromApi(row.vehicleInfo),
    });
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete member ${row.name}? This cannot be undone.`)) return;
    setError(null);
    try {
      await apiDelete(`/users/${row.id}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" component="h2">
          Members & directory
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Search by name, email, or phone. Register members with unit linkage via Ownership.
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
        <TextField
          size="small"
          label="Search"
          value={queryInput}
          onChange={(ev) => setQueryInput(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") setAppliedQuery(queryInput);
          }}
          sx={{ minWidth: 240 }}
        />
        <Button variant="outlined" onClick={() => setAppliedQuery(queryInput)}>
          Apply
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setPhoneError(null);
            setDialogError(null);
            setForm(createEmptyForm());
            setCreateOpen(true);
          }}
        >
          Register member
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary">
        {loading ? "Loading…" : `${total} user(s)`}
      </Typography>

      <Card>
        <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Household</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.phone || "—"}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{householdSummary(row)}</TableCell>
                    <TableCell>{formatDate(row.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      <Button size="small" color="error" sx={{ ml: 0.5 }} onClick={() => handleDelete(row)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="text.secondary">No users match.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onClose={() => {
          setPhoneError(null);
          setDialogError(null);
          setCreateOpen(false);
        }}
        fullWidth
        maxWidth="md"
      >
        <form onSubmit={handleCreate}>
          <DialogTitle>Register member</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Full name"
                value={form.name}
                onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
              />
              <TextField
                required
                type="email"
                label="Email"
                value={form.email}
                onChange={(ev) => setForm((f) => ({ ...f, email: ev.target.value }))}
              />
              <PhoneTextField
                value={form.phone}
                onPhoneChange={(phone) => {
                  setForm((f) => ({ ...f, phone }));
                  setPhoneError(null);
                }}
                error={Boolean(phoneError)}
                helperText={phoneError || undefined}
              />
              <TextField
                required
                type="password"
                label="Initial password"
                helperText="Minimum 8 characters"
                value={form.password}
                onChange={(ev) => setForm((f) => ({ ...f, password: ev.target.value }))}
              />
              <TextField
                select
                label="Role"
                value={form.role}
                onChange={(ev) => setForm((f) => ({ ...f, role: ev.target.value }))}
              >
                {ROLE_OPTIONS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r === ROLES.SecurityGuard ? "Security Guard" : r}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(ev) => setForm((f) => ({ ...f, status: ev.target.value }))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
              <Divider />
              <MemberFamilyVehicleSection form={form} setForm={setForm} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setPhoneError(null);
                setDialogError(null);
                setCreateOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(editRow)}
        onClose={() => {
          setPhoneError(null);
          setDialogError(null);
          setEditRow(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <form onSubmit={handleEdit}>
          <DialogTitle>Edit member</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <DialogFormError error={dialogError} onClose={() => setDialogError(null)} />
              <TextField
                required
                label="Full name"
                value={form.name}
                onChange={(ev) => setForm((f) => ({ ...f, name: ev.target.value }))}
              />
              <TextField
                required
                type="email"
                label="Email"
                value={form.email}
                onChange={(ev) => setForm((f) => ({ ...f, email: ev.target.value }))}
              />
              <PhoneTextField
                value={form.phone}
                onPhoneChange={(phone) => {
                  setForm((f) => ({ ...f, phone }));
                  setPhoneError(null);
                }}
                error={Boolean(phoneError)}
                helperText={phoneError || undefined}
              />
              <TextField
                type="password"
                label="New password"
                helperText="Leave blank to keep current password"
                value={form.password}
                onChange={(ev) => setForm((f) => ({ ...f, password: ev.target.value }))}
              />
              <TextField
                select
                label="Role"
                value={form.role}
                onChange={(ev) => setForm((f) => ({ ...f, role: ev.target.value }))}
              >
                {ROLE_OPTIONS.map((r) => (
                  <MenuItem key={r} value={r}>
                    {r === ROLES.SecurityGuard ? "Security Guard" : r}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(ev) => setForm((f) => ({ ...f, status: ev.target.value }))}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
              <Divider />
              <MemberFamilyVehicleSection form={form} setForm={setForm} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={() => {
                setPhoneError(null);
                setDialogError(null);
                setEditRow(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
