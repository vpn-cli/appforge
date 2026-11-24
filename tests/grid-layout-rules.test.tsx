import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { resolveGridColsClass, Grid } from "@/registry/components/Grid";

describe("Grid Layout Rules for 5 and 7 items", () => {
  describe("5 items layout rule", () => {
    it("resolves responsive classes for 5 items (5x1 wide, 3+2 medium, 2+2+1 compact, 1 mobile)", () => {
      const cls5 = resolveGridColsClass(5, 5);
      expect(cls5).toContain("grid-cols-1");
      expect(cls5).toContain("@[420px]:grid-cols-2");
      expect(cls5).toContain("@[640px]:grid-cols-3");
      expect(cls5).toContain("@[960px]:grid-cols-5");

      // When configured with 4 columns but 5 items exist, balances into 3+2 on medium and 5x1 on wide
      const cls4With5 = resolveGridColsClass(4, 5);
      expect(cls4With5).toContain("@[640px]:grid-cols-3");
      expect(cls4With5).toContain("@[960px]:grid-cols-5");
    });

    it("renders Grid component with 5 items using container query classes", () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        type: "Statistic",
        label: `Item ${i + 1}`,
        value: i + 1,
      }));

      const html = renderToString(<Grid columns={5} items={items} />);
      expect(html).toContain("@[960px]:grid-cols-5");
      expect(html).toContain("@[640px]:grid-cols-3");
      expect(html).toContain("@[420px]:grid-cols-2");
      expect(html).toContain("grid-cols-1");
    });
  });

  describe("7 items layout rule", () => {
    it("resolves responsive classes for 7 items (balanced 4+3 split on wide)", () => {
      const cls = resolveGridColsClass(4, 7);
      // At >=860px, uses 4 columns yielding 4 on row 1 and 3 on row 2 (balanced 4+3 split, 0 lonely orphans)
      expect(cls).toContain("@[860px]:grid-cols-4");
      expect(cls).toContain("@[640px]:grid-cols-3");
      expect(cls).toContain("@[420px]:grid-cols-2");
      expect(cls).toContain("grid-cols-1");
    });

    it("supports ultra-wide 7x1 layout when configured with 7 columns", () => {
      const cls7 = resolveGridColsClass(7, 7);
      expect(cls7).toContain("@[1100px]:grid-cols-7");
      expect(cls7).toContain("@[860px]:grid-cols-4");
      expect(cls7).toContain("@[640px]:grid-cols-3");
      expect(cls7).toContain("@[420px]:grid-cols-2");
    });

    it("renders Grid component with 7 items using balanced 4+3 container classes", () => {
      const items = Array.from({ length: 7 }, (_, i) => ({
        type: "Statistic",
        label: `Metric ${i + 1}`,
        value: i + 1,
      }));

      const html = renderToString(<Grid columns={4} items={items} />);
      expect(html).toContain("@[860px]:grid-cols-4");
      expect(html).toContain("@[640px]:grid-cols-3");
    });
  });
});
