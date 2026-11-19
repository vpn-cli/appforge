import { validateComponentNode } from "@/lib/validation";

export type HeroDemoStateParams = {
  period?: "Weekly" | "Monthly" | "Yearly";
  width?: number;
  includeSlackAlerts?: boolean;
};

export const HERO_SAMPLE_DATA = [
  95, 112, 150, 339, 384, 400, 388, 318, 240, 182, 146, 126, 117, 115, 121, 134, 143,
];

export const HERO_DEMO_TABLE_CONFIG = {
  type: "DataTable" as const,
  entity: "workflows",
  columns: [
    { key: "workflow", label: "WORKFLOW", type: "avatar" as const },
    { key: "trigger", label: "TRIGGER", type: "code" as const },
    { key: "status", label: "STATUS", type: "badge" as const },
  ],
  data: [
    { workflow: "User Sync", trigger: "cron:hourly", status: "Running", icon: "users" },
    { workflow: "Invoice Gen", trigger: "webhook:rx", status: "Idle", icon: "file-text" },
  ],
};

export function buildHeroDemoConfig({
  period = "Monthly",
  width,
  includeSlackAlerts,
}: HeroDemoStateParams = {}) {
  if (includeSlackAlerts) {
    return {
      app: "ops_demo",
      pages: [
        {
          components: [
            {
              type: "Statistic",
              label: "Active Workflows",
              value: "1,244",
            },
            {
              type: "DataTable",
              entity: "workflows",
              columns: [
                { key: "workflow", label: "WORKFLOW", type: "avatar" as const },
                { key: "trigger", label: "TRIGGER", type: "code" as const },
                { key: "status", label: "STATUS", type: "badge" as const },
              ],
              data: [
                { workflow: "User Sync", trigger: "cron:hourly", status: "Running", icon: "users" },
                { workflow: "Invoice Gen", trigger: "webhook:rx", status: "Idle", icon: "file-text" },
                { workflow: "Slack Alerts", trigger: "event:alert", status: "Running", icon: "bell" },
              ],
            },
          ],
        },
      ],
    };
  }

  return {
    app: "ops_demo",
    pages: [
      {
        components: [
          {
            type: "TrendChart",
            title: "Workflow executions",
            caption: "Recorded in current billing cycle",
            value: 14200,
            valueSuffix: " runs",
            trend: "up" as const,
            updatedText: "Sample data",
            period,
            periods: ["Weekly", "Monthly", "Yearly"],
            data: HERO_SAMPLE_DATA,
            ...(width !== undefined ? { width } : {}),
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
  periodDisplay: string = '"Monthly"'
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
      { kind: "string", text: '"TrendChart"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"title"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"Workflow executions"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"caption"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"Recorded in current billing cycle"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"value"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: "14200" },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"valueSuffix"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '" runs"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"trend"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"up"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"updatedText"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: '"Sample data"' },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"period"' },
      { kind: "punct", text: ": " },
      { kind: "string", text: periodDisplay },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"periods"' },
      { kind: "punct", text: ": " },
      { kind: "bracket", text: "[" },
      { kind: "string", text: '"Weekly"' },
      { kind: "punct", text: ", " },
      { kind: "string", text: '"Monthly"' },
      { kind: "punct", text: ", " },
      { kind: "string", text: '"Yearly"' },
      { kind: "bracket", text: "]" },
      { kind: "punct", text: "," },
    ],
    [
      { kind: "plain", text: "      " },
      { kind: "key", text: '"data"' },
      { kind: "punct", text: ": " },
      { kind: "bracket", text: "[" },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "plain", text: "95, 112, 150, 339, 384, 400," },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "plain", text: "388, 318, 240, 182, 146, 126," },
    ],
    [
      { kind: "plain", text: "        " },
      { kind: "plain", text: "117, 115, 121, 134, 143" },
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
}

export const HERO_DEMO_JSON_LINES = buildHeroJsonLines('"Monthly"');

export const HERO_DEMO_RAW_JSON = HERO_DEMO_JSON_LINES.map((line) =>
  line.map((t) => t.text).join("")
).join("\n");

export type HeroScriptedPhase = "initial" | "editing" | "applied";

export type HeroScriptedState = {
  phase: HeroScriptedPhase;
  periodValue: "Weekly" | "Monthly" | "Yearly";
  displayPeriodString: string;
  isEditing: boolean;
  validationStatus: "validating" | "valid";
  activeLineHighlighted: boolean;
  showCursor: boolean;
};

export const INITIAL_HERO_STATE: HeroScriptedState = {
  phase: "initial",
  periodValue: "Weekly",
  displayPeriodString: '"Weekly"',
  isEditing: false,
  validationStatus: "valid",
  activeLineHighlighted: false,
  showCursor: false,
};

/**
 * Validates the candidate component AST node generated from the editor's current code string
 * using the real registry schema validator `validateComponentNode`.
 */
export function validateHeroEditorState(displayPeriodString: string): {
  valid: boolean;
  validationStatus: "validating" | "valid";
  issues?: Array<{ path: string; message: string }>;
} {
  let candidatePeriod: unknown = undefined;
  try {
    candidatePeriod = JSON.parse(displayPeriodString);
  } catch {
    candidatePeriod = displayPeriodString.replace(/^"|"$/g, "");
  }

  const candidateNode = {
    type: "TrendChart",
    title: "Workflow executions",
    caption: "Recorded in current billing cycle",
    value: 14200,
    valueSuffix: " runs",
    trend: "up" as const,
    updatedText: "Sample data",
    period: candidatePeriod,
    periods: ["Weekly", "Monthly", "Yearly"],
    data: HERO_SAMPLE_DATA,
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
 * - 0 .. 2800ms: Initial clean state ("Weekly", valid, no cursor).
 * - 2800 .. 4200ms: Scripted edit in progress (typing "Monthly", validating…).
 * - 4200 .. 10200ms: Applied state ("Monthly", valid, re-rendered via RenderNode).
 * - 10200 .. 11000ms: Reset transition back to initial state.
 */
export function computeScriptedHeroState(tMs: number): HeroScriptedState {
  const t = tMs % 11000;
  const target = '"Monthly"';

  let phase: HeroScriptedPhase = "initial";
  let periodValue: "Weekly" | "Monthly" | "Yearly" = "Weekly";
  let displayPeriodString = '"Weekly"';
  let isEditing = false;
  let activeLineHighlighted = false;
  let showCursor = false;

  if (t < 2800) {
    phase = "initial";
    periodValue = "Weekly";
    displayPeriodString = '"Weekly"';
  } else if (t >= 2800 && t < 4200) {
    phase = "editing";
    periodValue = "Weekly";
    isEditing = true;
    activeLineHighlighted = true;
    showCursor = true;
    const elapsed = t - 2800;
    const progress = Math.min(1, elapsed / 1200);
    const charCount = Math.max(1, Math.floor(progress * target.length));
    displayPeriodString = target.slice(0, charCount);
  } else {
    // 4200 .. 11000ms: Applied state
    phase = "applied";
    periodValue = "Monthly";
    displayPeriodString = '"Monthly"';
    activeLineHighlighted = t < 5200;
  }

  // Real runtime validation via validateComponentNode
  const runtimeValidation = validateHeroEditorState(displayPeriodString);

  return {
    phase,
    periodValue,
    displayPeriodString,
    isEditing,
    validationStatus: runtimeValidation.validationStatus,
    activeLineHighlighted,
    showCursor,
  };
}
