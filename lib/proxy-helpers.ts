export type OperationMode = "insert" | "update" | "delete";

export type NormalizeResult =
  | { success: true; data: Record<string, unknown> | Record<string, unknown>[] }
  | { success: false; error: string };

/**
 * Resolves a request key to the exact PostgreSQL column name in the schema,
 * trying direct lowercase, snake_case conversion, and stripped-underscore matching.
 */
export function resolveColumn(key: string, allowedColumns: Set<string>): string {
  const direct = key.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
  if (allowedColumns.has(direct)) return direct;

  // Try snake_case conversion (e.g. firstName -> first_name)
  const snake = key
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
  if (allowedColumns.has(snake)) return snake;

  // Try stripping underscores (e.g. first_name -> firstname)
  const stripped = direct.replace(/_/g, "");
  if (allowedColumns.has(stripped)) return stripped;

  return direct || key.toLowerCase();
}

export function normalizeSingleObject(
  item: Record<string, unknown>,
  allowedColumns: Set<string>,
  entityName: string,
  mode: OperationMode
): { data?: Record<string, unknown>; error?: string } {
  const normalized: Record<string, unknown> = {};
  const seenCleanKeys = new Map<string, string>(); // cleanKey -> raw original key

  for (const [key, value] of Object.entries(item)) {
    const targetCol = resolveColumn(key, allowedColumns);
    const canonicalKey = key.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    // 1. Collision check: reject when two keys collapse to the same column (e.g. firstName + first_name)
    const existingKey = seenCleanKeys.get(targetCol) || seenCleanKeys.get(canonicalKey);
    if (existingKey && existingKey !== key) {
      return {
        error: `Payload contains conflicting keys: '${existingKey}' and '${key}' collapse to the same column '${targetCol}'`,
      };
    }
    seenCleanKeys.set(targetCol, key);
    if (canonicalKey) {
      seenCleanKeys.set(canonicalKey, key);
    }

    // 2. Handle id and created_at:
    // On insert: ignore (strip) so database defaults (gen_random_uuid, NOW()) are used
    // On update/delete: allow id and created_at in body
    if (targetCol === "id" || targetCol === "created_at") {
      if (mode === "insert") {
        continue;
      }
      normalized[targetCol] = value;
      continue;
    }

    // 3. Schema check: return 400 for fields not in the entity schema, not a database error
    if (!allowedColumns.has(targetCol)) {
      return {
        error: `Field '${key}' does not exist in schema for entity '${entityName}'`,
      };
    }

    normalized[targetCol] = value;
  }

  return { data: normalized };
}

/**
 * Normalizes request payload keys to lowercase alphanumeric/underscore,
 * validates against the entity schema, and rejects collapsing duplicate keys.
 * In insert mode, id and created_at are ignored (stripped) to preserve system defaults.
 * In update/delete mode, id and created_at are allowed in request bodies.
 */
export function normalizePayload(
  payload: unknown,
  schemaDefinition: Record<string, unknown> | undefined,
  entityName: string,
  mode: OperationMode = "insert"
): NormalizeResult {
  const allowedColumns = new Set<string>(["id", "created_at"]);
  if (schemaDefinition && typeof schemaDefinition === "object") {
    for (const field of Object.keys(schemaDefinition)) {
      const clean = field.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
      if (clean) allowedColumns.add(clean);
    }
  }

  if (Array.isArray(payload)) {
    const normalizedArray: Record<string, unknown>[] = [];
    for (const item of payload) {
      if (typeof item !== "object" || item === null) {
        return { success: false, error: "Array items must be JSON objects" };
      }
      const res = normalizeSingleObject(item as Record<string, unknown>, allowedColumns, entityName, mode);
      if (res.error) return { success: false, error: res.error };
      normalizedArray.push(res.data!);
    }
    return { success: true, data: normalizedArray };
  }

  if (typeof payload === "object" && payload !== null) {
    const res = normalizeSingleObject(payload as Record<string, unknown>, allowedColumns, entityName, mode);
    if (res.error) return { success: false, error: res.error };
    return { success: true, data: res.data! };
  }

  return { success: false, error: "Payload must be a valid JSON object or array" };
}

/**
 * Resolves the client IP strictly from the Vercel edge-overwritten `x-real-ip` header.
 * Never reads `x-forwarded-for`, whose leftmost value can be spoofed by clients.
 * Falls back to "127.0.0.1" when `x-real-ip` is absent (e.g. local dev).
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}
