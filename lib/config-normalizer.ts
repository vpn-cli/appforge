/**
 * Recursively normalizes field names in entities and components to lowercase
 * so that config keys match PostgreSQL column names consistently.
 */
export function normalizeConfigFieldNames<T>(config: T): T {
  if (!config || typeof config !== "object") return config;

  const normalized = { ...(config as Record<string, unknown>) };

  // 1. Normalize entities: lowercase field keys within each entity
  if (normalized.entities && typeof normalized.entities === "object") {
    const newEntities: Record<string, Record<string, unknown>> = {};
    for (const [entityName, fields] of Object.entries(normalized.entities as Record<string, unknown>)) {
      if (fields && typeof fields === "object") {
        const newFields: Record<string, unknown> = {};
        for (const [fieldName, fieldType] of Object.entries(fields as Record<string, unknown>)) {
          const cleanKey = fieldName.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
          newFields[cleanKey || fieldName.toLowerCase()] = fieldType;
        }
        newEntities[entityName] = newFields;
      } else {
        newEntities[entityName] = fields as Record<string, unknown>;
      }
    }
    normalized.entities = newEntities;
  }

  // 2. Normalize components in pages: lowercase column keys in DataTable, field keys in Form, etc.
  if (Array.isArray(normalized.pages)) {
    normalized.pages = normalized.pages.map((page: unknown) => {
      if (!page || typeof page !== "object") return page;
      const p = page as Record<string, unknown>;
      return {
        ...p,
        components: normalizeComponentNodes(p.components),
      };
    });
  }

  return normalized as T;
}

function normalizeComponentNodes(components: unknown): unknown {
  if (!Array.isArray(components)) return components;

  return components.map((comp: unknown) => {
    if (!comp || typeof comp !== "object") return comp;
    const updated = { ...(comp as Record<string, unknown>) };

    // DataTable columns
    if (updated.type === "DataTable" && Array.isArray(updated.columns)) {
      updated.columns = updated.columns.map((col: unknown) => {
        if (typeof col === "string") {
          return col.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
        }
        if (col && typeof col === "object" && typeof (col as { key?: unknown }).key === "string") {
          const c = col as Record<string, unknown>;
          return {
            ...c,
            key: (c.key as string).replace(/[^a-zA-Z0-9_]/g, "").toLowerCase(),
          };
        }
        return col;
      });
    }

    // Grid items or nested components
    if (Array.isArray(updated.items)) {
      updated.items = normalizeComponentNodes(updated.items);
    }
    if (Array.isArray(updated.content)) {
      updated.content = normalizeComponentNodes(updated.content);
    }

    return updated;
  });
}
