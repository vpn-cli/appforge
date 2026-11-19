import { validateComponentNode } from "@/lib/validation";

export type HeroDemoStateParams = {
  metricValue?: number;
  invoiceStatus?: "Idle" | "Running";
  includeSlackAlerts?: boolean;
  variant?: "panel" | "gradient";
};

export function buildHeroDemoConfig({
  metricValue = 1244,
  invoiceStatus = "Idle",
  includeSlackAlerts = false,
  variant = "gradient",
}: HeroDemoStateParams = {}) {
  const rows = [
    { workflow: "User Sync", trigger: "cron:hourly", status: "Running", icon: "users" },
    { workflow: "Invoice Gen", trigger: "webhook:rx", status: invoiceStatus, icon: "file-text" },
  ];

  if (includeSlackAlerts) {
    rows.push({
      workflow: "Slack Alerts",
      trigger: "event:alert",
      status: "Running",
      icon: "bell",
    });
  }

  return {
    app: "ops_demo",
    pages: [
      {
        components: [
          {
            type: "Statistic",
            label: "Active Workflows",
            value: metricValue.toLocaleString("en-US"),
            variant,
            trend: {
              value: "+12%",
              sentiment: "positive" as const,
              direction: "up" as const,
              series: [24, 28, 27, 36, 42, 45, 54],
            },
          },
          {
            type: "DataTable",
            entity: "workflows",
            columns: [
              { key: "workflow", label: "WORKFLOW", type: "avatar" as const },
              { key: "trigger", label: "TRIGGER", type: "code" as const },
              { key: "status", label: "STATUS", type: "badge" as const },
            ],
            data: rows,
          },
        ],
      },
    ],
  };
}

export const HERO_DEMO_CONFIG = buildHeroDemoConfig();

export type JsonToken = {
  kind: "bracket" | "key" | "string" | "punct" | "bool" | "plain";
  text: string;
};

export function buildHeroJsonLines(
  metricDisplayValue: string = "1,244",
  variantDisplay: string = '"gradient"'
): readonly (readonly JsonToken[])[] {
  return [
    [{ kind: "bracket", text: "{" }],
    [
      { kind: "plain", text: "  " },
      { kind: "key", text: '"app"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"ops_demo"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "  " },
      { kind: "key", text: '"pages"' },
      { kind: "punct", text: ": " },
      { kind: "bracket", text: "[{" },
      { kind: "plain", text: " " },
      { kind: "key", text: '"components"' },
      { kind: "punct", text: ": " },
      { kind: "bracket", text: "[" },
    ],
    [
      { kind: "plain", text: "    " },
      { kind: "bracket", text: "{" },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"type"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"Statistic"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"label"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"Active Workflows"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"value"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: `"${metricDisplayValue}"` },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"variant"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: variantDisplay },
    ],
    [
      { kind: "plain", text: "    " },
      { kind: "bracket", text: "}," },
    ],
    [
      { kind: "plain", text: "    " },
      { kind: "bracket", text: "{" },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"type"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"DataTable"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"entity"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"workflows"' },
    ],
    [
      { kind: "plain", text: "    " },
      { kind: "bracket", text: "}" },
    ],
    [
      { kind: "plain", text: "  " },
      { kind: "bracket", text: "]}]" },
    ],
    [{ kind: "bracket", text: "}" }],
  ];
}

export const HERO_DEMO_JSON_LINES = buildHeroJsonLines("1,244", '"gradient"');

export const HERO_DEMO_RAW_JSON = HERO_DEMO_JSON_LINES.map((line) =>
  line.map((t) => t.text).join("")
).join("\n");

export type HeroScriptedPhase = "initial" | "editing" | "applied";

export type HeroScriptedState = {
  phase: HeroScriptedPhase;
  variantValue: "panel" | "gradient";
  displayVariantString: string;
  isEditing: boolean;
  validationStatus: "validating" | "valid";
  activeLineHighlighted: boolean;
  showCursor: boolean;
};

export const INITIAL_HERO_STATE: HeroScriptedState = {
  phase: "initial",
  variantValue: "panel",
  displayVariantString: '"panel"',
  isEditing: false,
  validationStatus: "valid",
  activeLineHighlighted: false,
  showCursor: false,
};

/**
 * Validates the candidate component AST node generated from the editor's current code string
 * using the real registry schema validator `validateComponentNode`.
 */
export function validateHeroEditorState(displayVariantString: string): {
  valid: boolean;
  validationStatus: "validating" | "valid";
  issues?: Array<{ path: string; message: string }>;
} {
  let candidateVariant: unknown = undefined;
  try {
    candidateVariant = JSON.parse(displayVariantString);
  } catch {
    candidateVariant = displayVariantString.replace(/^"|"$/g, "");
  }

  const candidateNode = {
    type: "Statistic",
    label: "Active Workflows",
    value: "1,244",
    variant: candidateVariant,
    trend: { value: "+12%", sentiment: "positive" as const },
  };

  const res = validateComponentNode(candidateNode);
  return {
    valid: res.valid,
    validationStatus: res.valid ? "valid" : "validating",
    issues: res.issues,
  };
}

/**
 * Deterministic scripted edit state calculator.
 * Cycle duration: 11,000ms.
 * - 0 .. 2800ms: Initial clean state ("panel", valid, no cursor).
 * - 2800 .. 4200ms: Scripted edit in progress (typing "gradient", validating…).
 * - 4200 .. 10200ms: Applied state ("gradient", valid, re-rendered via RenderNode).
 * - 10200 .. 11000ms: Reset transition back to initial state.
 *
 * NOTE: validationStatus is NOT hard-coded; it is computed by passing the candidate AST
 * to validateComponentNode at runtime.
 */
export function computeScriptedHeroState(tMs: number): HeroScriptedState {
  const t = tMs % 11000;
  const target = '"gradient"';

  let phase: HeroScriptedPhase = "initial";
  let variantValue: "panel" | "gradient" = "panel";
  let displayVariantString = '"panel"';
  let isEditing = false;
  let activeLineHighlighted = false;
  let showCursor = false;

  if (t < 2800) {
    phase = "initial";
    variantValue = "panel";
    displayVariantString = '"panel"';
  } else if (t >= 2800 && t < 4200) {
    phase = "editing";
    variantValue = "panel"; // not yet applied to preview until fully valid
    isEditing = true;
    activeLineHighlighted = true;
    showCursor = true;
    const elapsed = t - 2800;
    const progress = Math.min(1, elapsed / 1200);
    const charCount = Math.max(1, Math.floor(progress * target.length));
    displayVariantString = target.slice(0, charCount);
  } else {
    // 4200 .. 11000ms: Applied state
    phase = "applied";
    variantValue = "gradient";
    displayVariantString = '"gradient"';
    activeLineHighlighted = t < 5200;
  }

  // Real runtime validation via validateComponentNode
  const runtimeValidation = validateHeroEditorState(displayVariantString);

  return {
    phase,
    variantValue,
    displayVariantString,
    isEditing,
    validationStatus: runtimeValidation.validationStatus,
    activeLineHighlighted,
    showCursor,
  };
}
