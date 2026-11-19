import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  DataTable,
  resolveRowIcon,
  WHITELISTED_ROW_ICONS,
} from "@/registry/components/DataTable";
import {
  buildHeroDemoConfig,
  HERO_DEMO_CONFIG,
} from "@/components/home/heroDemoConfig";

describe("DataTable row icons and schema-validated icon resolution", () => {
  describe("resolveRowIcon helper", () => {
    it("resolves whitelisted Lucide icon names", () => {
      expect(resolveRowIcon("users")).not.toBeNull();
      expect(resolveRowIcon("file-text")).not.toBeNull();
      expect(resolveRowIcon("filetext")).not.toBeNull();
      expect(resolveRowIcon("bell")).not.toBeNull();
      expect(resolveRowIcon("sparkles")).not.toBeNull();
      expect(resolveRowIcon("activity")).not.toBeNull();
      expect(resolveRowIcon("layers")).not.toBeNull();
      expect(resolveRowIcon("check-circle")).not.toBeNull();
    });

    it("returns null for unknown icon names or invalid inputs", () => {
      expect(resolveRowIcon("non-existent-icon")).toBeNull();
      expect(resolveRowIcon("")).toBeNull();
      expect(resolveRowIcon(null)).toBeNull();
      expect(resolveRowIcon(undefined)).toBeNull();
      expect(resolveRowIcon(123)).toBeNull();
    });
  });

  describe("DataTable rendering with explicit icon field", () => {
    it("renders explicit row.icon in avatar circle when icon is specified", () => {
      const html = renderToString(
        <DataTable
          columns={[{ key: "title", label: "Title", type: "avatar" }]}
          data={[
            { title: "Custom Job", icon: "users" },
            { title: "Billing Export", icon: "file-text" },
            { title: "PagerDuty Event", icon: "bell" },
          ]}
        />
      );

      // Should render SVG icons, not initials
      expect(html).toContain("lucide-users");
      expect(html).toContain("lucide-file-text");
      expect(html).toContain("lucide-bell");
    });

    it("does NOT use name regex matching: row named 'User Sync' without icon renders 'US' initials", () => {
      const html = renderToString(
        <DataTable
          columns={[{ key: "title", label: "Title", type: "avatar" }]}
          data={[
            { title: "User Sync" }, // No icon provided!
            { title: "Invoice Gen" }, // No icon provided!
          ]}
        />
      );

      // Must render initials, proving substring regex matching is removed
      expect(html).toContain(">US<");
      expect(html).toContain(">IG<");
      expect(html).not.toContain("lucide-users");
      expect(html).not.toContain("lucide-file-text");
    });

    it("supports column type 'icon'", () => {
      const html = renderToString(
        <DataTable
          columns={[
            { key: "icon", label: "Icon", type: "icon" },
            { key: "name", label: "Name", type: "text" },
          ]}
          data={[
            { icon: "layers", name: "Architecture" },
            { icon: "database", name: "Storage" },
          ]}
        />
      );

      expect(html).toContain("lucide-layers");
      expect(html).toContain("lucide-database");
    });
  });

  describe("Hero Demo JSON Config Icons", () => {
    it("explicitly declares whitelisted icons in hero rows", () => {
      const config = buildHeroDemoConfig({ includeSlackAlerts: true });
      const tableComponent = config.pages[0].components[1] as any;

      expect(tableComponent.data[0].icon).toBe("users");
      expect(tableComponent.data[1].icon).toBe("file-text");
      expect(tableComponent.data[2].icon).toBe("bell");
    });

    it("renders hero DataTable with explicit icons", () => {
      const config = buildHeroDemoConfig({ includeSlackAlerts: true });
      const tableConfig = config.pages[0].components[1] as any;
      const html = renderToString(
        <DataTable
          columns={tableConfig.columns}
          data={tableConfig.data}
        />
      );

      expect(html).toContain("lucide-users");
      expect(html).toContain("lucide-file-text");
    });
  });
});
