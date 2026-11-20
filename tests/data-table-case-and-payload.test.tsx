import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { DataTable } from "@/registry/components/DataTable";
import { normalizePayload } from "@/lib/proxy-helpers";
import { PUT } from "@/app/api/proxy/[appId]/[entity]/route";
import { normalizeConfigFieldNames } from "@/lib/config-normalizer";
import * as appAccessModule from "@/lib/app-access";
import * as serverDbModule from "@/lib/insforge-server";

describe("Item 1: Key Case Mismatch & DataTable CamelCase Rendering", () => {
  it("renders a DataTable with a camelCase column key when database data is lowercased", () => {
    // Column defined with camelCase key
    const columns = [
      { key: "firstName", label: "First Name" },
      { key: "userEmail", label: "Email Address" },
    ];

    // Data returned by PostgreSQL proxy (lowercased column names)
    const data = [
      { id: "u-1", firstname: "Alice Johnson", useremail: "alice@example.com" },
      { id: "u-2", firstname: "Bob Smith", useremail: "bob@example.com" },
    ];

    const html = renderToString(
      <DataTable columns={columns} data={data} state="loaded" />
    );

    // Verify both cell values appear in the rendered HTML
    expect(html).toContain("Alice Johnson");
    expect(html).toContain("alice@example.com");
    expect(html).toContain("Bob Smith");
    expect(html).toContain("bob@example.com");
  });

  it("renders a DataTable with string-shorthand camelCase columns and mixed-case row keys", () => {
    const columns = ["taskTitle", "priorityLevel"];
    const data = [
      { id: "t-1", tasktitle: "Audit RLS Policies", prioritylevel: "High" },
    ];

    const html = renderToString(
      <DataTable columns={columns} data={data} state="loaded" />
    );

    expect(html).toContain("Audit RLS Policies");
    expect(html).toContain("High");
  });

  it("normalizeConfigFieldNames lowercases entity and component column keys at save time", () => {
    const rawConfig = {
      app: "Test App",
      entities: {
        UserProfile: {
          firstName: "string",
          userAge: "number",
        },
      },
      pages: [
        {
          components: [
            {
              type: "DataTable",
              entity: "UserProfile",
              columns: [
                { key: "firstName", label: "First Name" },
                { key: "userAge", label: "Age" },
              ],
            },
          ],
        },
      ],
    };

    const normalized = normalizeConfigFieldNames(rawConfig) as typeof rawConfig;
    expect(normalized.entities.UserProfile).toHaveProperty("firstname");
    expect(normalized.entities.UserProfile).toHaveProperty("userage");
    expect(normalized.entities.UserProfile).not.toHaveProperty("firstName");

    const tableComp = normalized.pages[0].components[0] as {
      columns: { key: string; label: string }[];
    };
    expect(tableComp.columns[0].key).toBe("firstname");
    expect(tableComp.columns[0].label).toBe("First Name"); // Preserves human-readable label
    expect(tableComp.columns[1].key).toBe("userage");
  });
});

describe("Item 2: normalizePayload Schema Enforcement & Collision Rejection", () => {
  const mockSchemaDefinition = {
    title: "TEXT",
    price: "NUMERIC",
    is_active: "BOOLEAN",
    firstname: "TEXT",
  };

  it("rejects payloads where two keys collapse to the same column (e.g. firstName + first_name)", () => {
    const collidingPayload = {
      firstName: "Alice",
      first_name: "Alicia",
      price: 25,
    };

    const res = normalizePayload(collidingPayload, mockSchemaDefinition, "products");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toMatch(/conflicting keys.*firstName.*first_name.*collapse to the same column 'firstname'/i);
    }
  });

  it("rejects payloads with fields not in the entity schema (returns 400 error description, not a db error)", () => {
    const invalidFieldPayload = {
      title: "Gadget",
      unknown_field: "malicious_or_typo_value",
    };

    const res = normalizePayload(invalidFieldPayload, mockSchemaDefinition, "products");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe("Field 'unknown_field' does not exist in schema for entity 'products'");
    }
  });

  it("accepts valid payloads matching schema and normalizes keys to lowercase", () => {
    const validPayload = {
      Title: "Super Widget",
      Price: 99.95,
      is_active: true,
    };

    const res = normalizePayload(validPayload, mockSchemaDefinition, "products");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toEqual({
        title: "Super Widget",
        price: 99.95,
        is_active: true,
      });
    }
  });

  it("validates array payloads for batch operations and catches collisions across items", () => {
    const batchPayload = [
      { title: "Item 1", price: 10 },
      { firstName: "Bob", first_name: "Bobby" }, // Collision in second item
    ];

    const res = normalizePayload(batchPayload, mockSchemaDefinition, "products");
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toMatch(/conflicting keys/i);
    }
  });
});

describe("Item 2 (cont): Handling id and created_at in insert, update, and delete", () => {
  const schemaDef = {
    title: "TEXT",
    price: "NUMERIC",
  };

  it("normalizePayload in insert mode strips id and created_at so DB defaults are preserved", () => {
    const payload = {
      id: "spoofed-uuid-1234",
      created_at: "2020-01-01T00:00:00Z",
      title: "New Item",
      price: 19.99,
    };

    const res = normalizePayload(payload, schemaDef, "items", "insert");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toEqual({
        title: "New Item",
        price: 19.99,
      });
      expect(res.data).not.toHaveProperty("id");
      expect(res.data).not.toHaveProperty("created_at");
    }
  });

  it("normalizePayload in update mode preserves id and created_at in body without rejecting", () => {
    const payload = {
      id: "rec-existing-5678",
      created_at: "2024-05-01T12:00:00Z",
      title: "Updated Title",
      price: 29.99,
    };

    const res = normalizePayload(payload, schemaDef, "items", "update");
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data).toEqual({
        id: "rec-existing-5678",
        created_at: "2024-05-01T12:00:00Z",
        title: "Updated Title",
        price: 29.99,
      });
    }
  });

  it("PUT endpoint: an update with id in the body succeeds and targets the correct record", async () => {
    const mockRecord = {
      id: "rec-body-123",
      title: "Updated via Body ID",
      price: 45,
      created_at: "2026-01-01T00:00:00Z",
    };

    vi.spyOn(appAccessModule, "authorizeAppAccess").mockResolvedValue({
      tableName: "app_123_items",
      schemaDefinition: { title: "TEXT", price: "NUMERIC" },
    } as any);

    let capturedUpdateFields: unknown = null;
    let capturedEqArgs: [string, unknown] | null = null;

    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockImplementation((fields) => {
          capturedUpdateFields = fields;
          return {
            eq: vi.fn().mockImplementation((col, val) => {
              capturedEqArgs = [col, val];
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockRecord,
                    error: null,
                  }),
                }),
              };
            }),
          };
        }),
      }),
    };

    vi.spyOn(serverDbModule, "createInsforgeServer").mockResolvedValue(
      mockSupabaseClient as any
    );

    const request = new Request("http://localhost:3000/api/proxy/app-1/items", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "rec-body-123",
        created_at: "2026-01-01T00:00:00Z",
        title: "Updated via Body ID",
        price: 45,
      }),
    });

    const response = await PUT(request, {
      params: Promise.resolve({ appId: "app-1", entity: "items" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(mockRecord);

    // Verify id and created_at were stripped from updateFields (so PK / created_at are not overwritten)
    expect(capturedUpdateFields).toEqual({
      title: "Updated via Body ID",
      price: 45,
    });
    // Verify id was extracted from body and passed to .eq("id", "rec-body-123")
    expect(capturedEqArgs).toEqual(["id", "rec-body-123"]);
  });
});
