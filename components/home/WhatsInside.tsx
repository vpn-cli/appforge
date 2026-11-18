import { Table2, ShieldCheck, Lock } from "lucide-react";

const CAPABILITIES = [
  {
    title: "Schema-to-Postgres tables",
    description:
      "Entity definitions sync via structured execute_app_ddl RPC calls with identifier checks and whitelisted column types (TEXT, NUMERIC, BOOLEAN, TIMESTAMPTZ) — no raw SQL concatenation and no DROP TABLE.",
    icon: Table2,
  },
  {
    title: "Zod-validated AI with Groq → Gemini failover",
    description:
      "Copilot streams JSON from Groq with pre-first-chunk failover to Gemini, locks out mid-stream failover to prevent mixed output, normalizes prompt cache keys, and validates every node with Zod.",
    icon: ShieldCheck,
  },
  {
    title: "Tenant isolation",
    description:
      "Clerk ownership authorization and Postgres Row-Level Security scope every app and dynamic app_* table. Non-owners get 404 on private apps and read-only access on published apps.",
    icon: Lock,
  },
] as const;

export function WhatsInside() {
  return (
    <section
      aria-labelledby="whats-inside-heading"
      className="w-full py-16 sm:py-20 bg-surface-sunken border-y border-border relative z-10"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 w-full">
        <div className="max-w-2xl mb-10">
          <p className="type-label text-brand-link mb-2">What&apos;s inside</p>
          <h2
            id="whats-inside-heading"
            className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] leading-[1.15] text-foreground"
          >
            Deterministic runtime guarantees
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <article
                key={cap.title}
                className="rounded-2xl bg-card border border-border p-6 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-light border border-border flex items-center justify-center text-brand-link shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>

                <div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-[15px] leading-[1.55] text-text-secondary">
                    {cap.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
