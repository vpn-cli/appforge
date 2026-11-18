export interface TemplateItem {
  id: string;
  title: string;
  description: string;
  category: "Operations" | "Organization" | "Scratch";
  componentsCount: number;
  entitiesCount: number;
  config: {
    app: string;
    entities: Record<string, Record<string, string>>;
    pages: Array<{
      components: Array<Record<string, unknown>>;
    }>;
  };
}

export const TEMPLATES_DATA: TemplateItem[] = [
  {
    id: "crm",
    title: "Analytics CRM",
    description: "Pipeline metrics, conversion rates, and searchable lead table.",
    category: "Operations",
    componentsCount: 6,
    entitiesCount: 2,
    config: {
      app: "Analytics CRM",
      entities: {
        leads: { company: "string", contact: "string", value: "number", status: "string" },
        activities: { lead_id: "string", type: "string", date: "string" },
      },
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Sales Analytics CRM",
              subtitle: "Q3 Performance Metrics and Pipeline",
              size: "lg",
            },
            {
              type: "Grid",
              columns: 4,
              gap: 3,
              items: [
                { type: "Statistic", label: "Total Pipeline", value: "$1.2M", trend: { value: "+18%", sentiment: "positive" } },
                { type: "Statistic", label: "Active Leads", value: "84", trend: { value: "-5%", sentiment: "neutral" } },
                { type: "Statistic", label: "Conversion Rate", value: "12.5%", trend: { value: "+2.1%", sentiment: "positive" } },
                { type: "Statistic", label: "Closed Won", value: "42 Deals" },
              ],
            },
            { type: "Header", title: "Recent Opportunities", size: "md" },
            {
              type: "DataTable",
              entity: "leads",
              columns: [
                { key: "company", label: "Company", type: "text" },
                { key: "contact", label: "Contact", type: "text" },
                { key: "value", label: "Value ($)", type: "currency" },
                { key: "status", label: "Status", type: "status" },
              ],
              data: [
                { company: "Acme Cloud", contact: "Jane Doe", value: 48000, status: "Active" },
                { company: "Nexus AI", contact: "Mark Vance", value: 72000, status: "Pending" },
                { company: "HyperScale", contact: "Sarah Lin", value: 31000, status: "Active" },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "pokemon",
    title: "Pokémon Comparison",
    description: "Type matchups, combat power, and colored status pill comparison across battle tiers.",
    category: "Operations",
    componentsCount: 6,
    entitiesCount: 1,
    config: {
      app: "Pokémon Comparison",
      entities: {
        pokemon: { pokemon: "string", type: "string", cp: "number", matchup: "string", status: "string" },
      },
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Pokémon Battle Comparison",
              subtitle: "Type matchups, combat power, and battle readiness analysis.",
              size: "lg",
            },
            {
              type: "Grid",
              columns: 4,
              gap: 3,
              items: [
                { type: "Statistic", label: "Battle Readiness", value: "94.2%", trend: { value: "+3.4%", sentiment: "positive" } },
                { type: "Statistic", label: "Strong Matchups", value: "84", trend: { value: "+12", sentiment: "positive" } },
                { type: "Statistic", label: "Balanced Matchups", value: "42", trend: { value: "0", sentiment: "neutral" } },
                { type: "Statistic", label: "Critical Weaknesses", value: "9", trend: { value: "-5", sentiment: "positive" } },
              ],
            },
            {
              type: "DataTable",
              columns: [
                { key: "pokemon", label: "Pokémon", type: "text" },
                { key: "type", label: "Type", type: "code" },
                { key: "cp", label: "CP", type: "number" },
                {
                  key: "matchup",
                  label: "Matchup",
                  type: "status",
                  colors: {
                    Legendary: "purple",
                    Special: "violet",
                    Common: "gray",
                  },
                },
                {
                  key: "status",
                  label: "Battle Status",
                  type: "status",
                },
              ],
              data: [
                { pokemon: "Charizard", type: "Fire / Flying", cp: 2850, matchup: "Strong", status: "Active" },
                { pokemon: "Blastoise", type: "Water", cp: 2780, matchup: "Balanced", status: "Healthy" },
                { pokemon: "Venusaur", type: "Grass / Poison", cp: 2720, matchup: "Weak", status: "Degraded" },
                { pokemon: "Mewtwo", type: "Psychic", cp: 4120, matchup: "Legendary", status: "Draft" },
                { pokemon: "Gengar", type: "Ghost / Poison", cp: 2870, matchup: "Special", status: "Idle" },
                { pokemon: "Pikachu", type: "Electric", cp: 2150, matchup: "Good", status: "Running" },
                { pokemon: "Snorlax", type: "Normal", cp: 3220, matchup: "Common", status: "Scheduled" },
                { pokemon: "Dragonite", type: "Dragon / Flying", cp: 3790, matchup: "Strong", status: "Critical" },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "incident",
    title: "Incident Command Center",
    description: "Real-time service degradation alerts, active remediation runs, and edge latency telemetry.",
    category: "Operations",
    componentsCount: 6,
    entitiesCount: 1,
    config: {
      app: "Incident Command Center",
      entities: {
        incidents: { id: "string", service: "string", severity: "string", status: "string", impact: "number" },
      },
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Incident Command Center",
              subtitle: "Real-time service degradation alerts and edge latency.",
              size: "lg",
            },
            {
              type: "Grid",
              columns: 4,
              gap: 3,
              items: [
                { type: "Statistic", label: "Active Incidents", value: "2", trend: { value: "-3", sentiment: "positive" } },
                { type: "Statistic", label: "MTTR", value: "14m", trend: { value: "-4m", sentiment: "positive" } },
                { type: "Statistic", label: "Degraded Services", value: "1", trend: { value: "+1", sentiment: "negative" } },
                { type: "Statistic", label: "Global Uptime", value: "99.98%" },
              ],
            },
            {
              type: "DataTable",
              columns: [
                { key: "id", label: "Incident ID", type: "id" },
                { key: "service", label: "Service", type: "text" },
                { key: "severity", label: "Severity", type: "badge" },
                { key: "status", label: "Status", type: "badge" },
              ],
              data: [
                { id: "INC-4091", service: "API Gateway Ingress", severity: "Critical", status: "Active" },
                { id: "INC-4092", service: "Auth0 Token Relay", severity: "Warning", status: "Pending" },
                { id: "INC-4089", service: "Postgres Read Replica", severity: "Minor", status: "Resolved" },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "directory",
    title: "Employee Directory",
    description: "Corporate directory with team cards, roles, and quick profiles.",
    category: "Organization",
    componentsCount: 5,
    entitiesCount: 1,
    config: {
      app: "Employee Directory",
      entities: {
        employees: { name: "string", role: "string", department: "string", email: "string" },
      },
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Employee Directory",
              subtitle: "Search and manage personnel globally.",
              size: "lg",
            },
            {
              type: "Grid",
              columns: 3,
              gap: 3,
              items: [
                { type: "Statistic", label: "Total Headcount", value: "142", trend: { value: "+12%", sentiment: "positive" } },
                { type: "Statistic", label: "Departments", value: "8" },
                { type: "Statistic", label: "Open Roles", value: "24", trend: { value: "+4", sentiment: "positive" } },
              ],
            },
            {
              type: "DataTable",
              entity: "employees",
              columns: [
                { key: "name", label: "Employee", type: "avatar" },
                { key: "role", label: "Role", type: "text" },
                { key: "department", label: "Department", type: "badge" },
                { key: "email", label: "Email", type: "code" },
              ],
              data: [
                { name: "Sarah Jenkins", role: "Product Lead", department: "Design", email: "s.jenkins@co.internal" },
                { name: "Alex Thorne", role: "Staff Engineer", department: "Core Infra", email: "a.thorne@co.internal" },
                { name: "Elena Rostova", role: "VP Growth", department: "Revenue", email: "e.rostova@co.internal" },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    id: "blank",
    title: "Blank Canvas",
    description: "Start from a clean slate and build with JSON or the AI Copilot.",
    category: "Scratch",
    componentsCount: 2,
    entitiesCount: 0,
    config: {
      app: "Blank Canvas",
      entities: {},
      pages: [
        {
          components: [
            {
              type: "Header",
              title: "Blank Canvas",
              subtitle: "Start from a clean slate and build with JSON or Copilot.",
              size: "lg",
            },
            {
              type: "Card",
              title: "Empty Workspace",
              subtitle: "Prompt Copilot or configure data structures in the JSON editor.",
            },
          ],
        },
      ],
    },
  },
];
