import type { TemplateItem } from "@/lib/templates-data";

/**
 * Historical test fixture: Pokémon Comparison template.
 * Removed from user-facing runtime lists (TEMPLATES_DATA) in favor of internal tools,
 * but preserved here for testing multi-tone status pill colors, custom colors maps, and data tables.
 */
export const POKEMON_TEMPLATE_FIXTURE: TemplateItem = {
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
};
