/**
 * Placeholder for a real gate/barrier system (RFID, boom barrier, etc.).
 * Swap this stub for hardware SDK calls when integrating on-site equipment.
 */
export async function recordGateEvent({ entityType, entityId, action, managedBy }) {
  console.log("[gateAccess:stub]", { entityType, entityId, action, managedBy });
  return { ok: true };
}
