export type HeroDemoStateParams = {
  metricValue?: number;
  invoiceStatus?: "Idle" | "Running";
  includeSlackAlerts?: boolean;
};

export function buildHeroDemoConfig({
  metricValue = 1244,
  invoiceStatus = "Idle",
  includeSlackAlerts = false,
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
            variant: "gradient" as const,
            trend: { value: "+12%", sentiment: "positive" as const },
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
  metricDisplayValue: string = "1,244"
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
      { kind: "string", text: '"gradient"' },
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

export const HERO_DEMO_JSON_LINES = buildHeroJsonLines("1,244");

export const HERO_DEMO_RAW_JSON = HERO_DEMO_JSON_LINES.map((line) =>
  line.map((t) => t.text).join("")
).join("\n");
