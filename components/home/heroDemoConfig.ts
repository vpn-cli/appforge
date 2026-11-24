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
  includeSlackAlerts = true,
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
              series: [50, 52, 51, 54, 53, 55, 56],
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
  kind: "bracket" | "key" | "string" | "punct" | "bool" | "number" | "plain" | "fold";
  text: string;
  foldKey?: string;
};

export function buildHeroJsonLines(
  metricDisplayValue: string = "1,244",
  variantDisplay: string = '"gradient"',
  options: {
    seriesExpanded?: boolean;
  } = {}
): readonly (readonly JsonToken[])[] {
  const isSeriesExpanded = options.seriesExpanded ?? false;

  const lines: (readonly JsonToken[])[] = [
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
    // Component 1: Statistic
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
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"trend"' },
      { kind: "punct", text: ": " },
      { kind: "bracket", text: "{" },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "key", text: '"value"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"+12%"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "key", text: '"sentiment"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"positive"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "key", text: '"direction"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"up"' },
      { kind: "punct", text: "," },
    ],
    // series array with fold marker
    isSeriesExpanded
      ? [
          { kind: "plain", text: "        " },
          { kind: "key", text: '"series"' },
          { kind: "punct", text: ": " },
          { kind: "bracket", text: "[" },
          { kind: "fold", text: "▾", foldKey: "series" },
          { kind: "plain", text: " 50, 52, 51, 54, 53, 55, 56 " },
          { kind: "bracket", text: "]" },
        ]
      : [
          { kind: "plain", text: "        " },
          { kind: "key", text: '"series"' },
          { kind: "punct", text: ": " },
          { kind: "fold", text: "[7 values] ▸", foldKey: "series" },
        ],
    [
      { kind: "plain", text: "      " },
      { kind: "bracket", text: "}" },
    ],
    [
      { kind: "plain", text: "    " },
      { kind: "bracket", text: "}," },
    ],
    // Component 2: DataTable
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
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"columns"' },
      { kind: "punct", text: ": " },
      { kind: "bracket", text: "[" },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "bracket", text: "{" },
      { kind: "key", text: '"key"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"workflow"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"label"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"WORKFLOW"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"type"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"avatar"' },
      { kind: "bracket", text: "}," },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "bracket", text: "{" },
      { kind: "key", text: '"key"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"trigger"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"label"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"TRIGGER"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"type"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"code"' },
      { kind: "bracket", text: "}," },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "bracket", text: "{" },
      { kind: "key", text: '"key"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"status"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"label"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"STATUS"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"type"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"badge"' },
      { kind: "bracket", text: "}" },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "bracket", text: "]," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"data"' },
      { kind: "punct", text: ": " },
      { kind: "bracket", text: "[" },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "bracket", text: "{" },
      { kind: "key", text: '"workflow"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"User Sync"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"trigger"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"cron:hourly"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"status"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"Running"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"icon"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"users"' },
      { kind: "bracket", text: "}," },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "bracket", text: "{" },
      { kind: "key", text: '"workflow"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"Invoice Gen"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"trigger"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"webhook:rx"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"status"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"Idle"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"icon"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"file-text"' },
      { kind: "bracket", text: "}," },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "bracket", text: "{" },
      { kind: "key", text: '"workflow"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"Slack Alerts"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"trigger"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"event:alert"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"status"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"Running"' },
      { kind: "punct", text: ", " },
      { kind: "key", text: '"icon"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"bell"' },
      { kind: "bracket", text: "}" },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "bracket", text: "]" },
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

  return lines;
}

export const HERO_DEMO_JSON_LINES = buildHeroJsonLines("1,244", '"gradient"');

export const HERO_DEMO_RAW_JSON = JSON.stringify(HERO_DEMO_CONFIG, null, 2);

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
  variantValue: "gradient",
  displayVariantString: '"gradient"',
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
