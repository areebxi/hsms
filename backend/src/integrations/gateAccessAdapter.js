/**
 * Gate access control integration boundary (hardware or simulator).
 */
export async function recordGateEvent({ entityType, entityId, action, managedBy }) {
  console.log("[gateAccess:stub]", { entityType, entityId, action, managedBy });
  return { ok: true };
}
