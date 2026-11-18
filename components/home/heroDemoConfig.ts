export const HERO_DEMO_CONFIG = {
  app: "ops_demo",
  pages: [
    {
      components: [
        {
          type: "Statistic",
          label: "Workflows (demo)",
          value: "2",
        },
        {
          type: "DataTable",
          entity: "workflows",
        },
      ],
    },
  ],
} as const;

export type JsonToken = {
  kind: "bracket" | "key" | "string" | "punct" | "plain";
  text: string;
};

// Formatted directly from HERO_DEMO_CONFIG with max 32 chars/line so there is zero horizontal scroll
export const HERO_DEMO_JSON_LINES: readonly (readonly JsonToken[])[] = [
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
    { kind: "string", text: '"Workflows (demo)"' },
    { kind: "punct", text: "," },
  ],
  [
    { kind: "plain", text: "      " },
    { kind: "key", text: '"value"' },
    { kind: "punct", text: ": " },
    { kind: "string", text: '"2"' },
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

export const HERO_DEMO_RAW_JSON = HERO_DEMO_JSON_LINES.map((line) =>
  line.map((t) => t.text).join("")
).join("\n");
