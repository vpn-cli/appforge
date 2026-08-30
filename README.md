# AppForge

> A highly-scalable metadata-driven generative web application runtime

AppForge interprets natural language prompts via large language models, compiles them into a mathematically sound graphical JSON AST, and dynamically renders enterprise-grade B2B applications instantaneously directly inside the Web DOM.

![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Architecture by Component](#architecture-by-component)
5. [Repository Structure](#repository-structure)
6. [Tech Stack](#tech-stack)
7. [Why These Technologies?](#why-these-technologies)
8. [Core Application Flows](#core-application-flows)
9. [Data Flow](#data-flow)
10. [Database Architecture](#database-architecture)
11. [Authentication & Authorization](#authentication--authorization)
12. [Configuration (Env)](#configuration--environment-variables)
13. [Local Development](#local-development)
14. [Docker Deployment](#docker)
15. [CI/CD & Testing](#cicd--testing)
16. [Security & Error Handling](#security--error-handling)
17. [Observability](#observability)
18. [Debugging Guide](#debugging-guide)
19. [Known Limitations (TODOs)](#known-limitations)

---

## Overview

Traditional web applications require developers to hardcode layouts, map databases, and bind REST endpoints together manually. **AppForge removes this friction** by utilizing a real-time Generative Pipeline capable of compiling a robust application runtime in under `1.2s` using Llama-3.3-70B. It is designed for enterprise prototyping—allowing non-technical users to build and securely deploy fully structural React dashboards instantly using only a textbox.

---

## Key Features

- **Prompt-to-Software Copilot:** The `CopilotPanel` routes raw user requests to an AI LLM, instantly returning a structured JSON DOM.
- **Serverless Semantic Caching:** Prevents hallucination overhead and massive LLM generation latencies by instantly serving repeated prompts via Upstash Redis.
- **Dynamic Postgres Sync Engine:** AppForge intercepts the generated UI AST and dynamically executes runtime DDL (`CREATE TABLE/ALTER`) on a Supabase database instance to provision identical backend architecture on the fly.
- **Background Event Brokerage:** Every publish action instantly fires asynchronous fire-and-forget payloads into Upstash Kafka for decoupled business intelligence analytics.
- **Production-grade Global Edge Routing:** Clerk auth middleware secures the entire platform across 300+ Edge nodes, dynamically locking out unauthenticated bots from modifying global states.
- **Smart Quota Sandboxing:** Guests natively experience the system instantly up to a localized maximum ceiling before being seamlessly captured into the Authentication funnel.

---

## Architecture

At a high level, AppForge operates within a hybrid SSR (Server-Side Rendered) matrix leveraging the Next.js Edge runtime, Supabase Data proxies, and an Event-Driven architecture cluster.

```text
                  ┌──────────────────────┐
                  │    AppForge Client   │
                  │  (Copilot / Builder) │
                  └─────────┬────────────┘
         Ask AI / Save      │
       (HTTP / Next.js RPC) │
                            ▼
                  ┌──────────────────────┐
                  │ Next.js App Router   │
                  │ (Server Actions & API)│
                  │ + Clerk Middleware   │
                  └────┬──────┬──────┬───┘
          Event Pub    │      │ Cache│      Auth / RPC
          ┌────────────┘      │      └────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌────────────────┐ ┌───────────────────┐
│  Upstash Kafka   │ │ Upstash Redis  │ │ Supabase Postgres │
│  (Topic Streams) │ │ (Semantic Mem) │ │ (Schema + Apps)   │
└──────────────────┘ └────────┬───────┘ └───────────────────┘
                              │
                    ┌─────────┴────────┐
                    │ LLM Providers    │
                    │ (Groq / Gemini)  │
                    └──────────────────┘
```

---

## Architecture by Component

### Copilot Core Pipeline (`app/api/copilot/route.ts`)
- **Responsibility:** Ingest incoming user intents, securely rate-limit their IP, intercept against the Semantic Cache, and broker prompt executions out to the external GPU provider.
- **Dependencies:** `@ai-sdk/groq`, `@ai-sdk/google`, `@upstash/redis`, `@upstash/ratelimit`.
- **Inputs:** Natural Language text chunks.
- **Outputs:** Strictly bounded Text-stream representing stringified nested Zod JSON Arrays.
- **Failure Modes:** Explicit hardware fallbacks (Fail Groq -> Fail Gemini Key 1 -> Fail Gemini Key 2 -> Graceful UI Exception Error message). 

### Dynamic Schema Engine (`actions/schema.ts` & `sql/rpc_ddl.sql`)
- **Responsibility:** Recursively scrape the nested JSON metadata component tree on save/publish to automatically create respective Postgres `tables` natively reflecting the UI layout fields. 
- **Dependencies:** `@supabase/ssr`, `lib/insforge-server`.
- **Important Implementation Details:** Uses `execute_app_ddl` via Supabase RPC to securely execute runtime data-definition languages while shielding the central registry tables from malicious DROPs or mutations.

### Analytics Decoupler (`lib/event-queue.ts`)
- **Responsibility:** Fire-and-forget payload drops triggered upon structural commits.
- **Dependencies:** `@upstash/kafka`.
- **Failure Modes:** Deliberate "Try/Catch with Empty Throw." Downstream Kafka anomalies will never break the primary HTTP transaction loop on the user facing client.

---

## Repository Structure

```text
appforge/
├── .github/workflows/          # CI/CD Pipeline (Docker/TypeScript verification)
├── actions/                    # Server Actions (Next.js RPC mutations)
│   ├── apps.ts                 # Core persistence layer for drafts / publishing
│   └── schema.ts               # Core database sync logic parsing AST to SQL
├── app/                        # Next.js 15 App Router Endpoints
│   ├── api/copilot/            # Edge-deployed Serverless AI Streams
│   ├── builder/                # Dynamic Canvas Editor workspace
│   ├── dashboard/              # User account registry
│   └── templates/              # Base static layouts for new projects
├── components/                 # React UI Primitives & Registry Components
│   ├── builder/                # Core complex UI blocks (ConfigEditor, CopilotPanel)
│   ├── dashboard/              # AppGrid, App deletion flows
│   └── ui/                     # Shadcn granular micro-components
├── lib/                        # Singletons and Client Instantiators (Upstash, Supabase)
├── registry/                   # Central Web Component Engine definitions (JSON -> React)
├── sql/                        # Raw Database DDL definitions
├── middleware.ts               # Root Clerk Auth Edge intercepts for Vercel
├── docker-compose.yml          # Container configuration
├── Dockerfile                  # Multi-stage optimized application container
└── next.config.ts              # Contains Sentry tunneling definitions
```

---

## Tech Stack

| Layer          | Technology | Purpose |
| -------------- | ---------- | ------- |
| **Frontend**       | React 19 / Next 15 | Implements server-side streamed application components and hybrid Server Actions. |
| **Styling**        | Tailwind 4 / Shadcn | Deterministic un-bloated functional styling framework. |
| **Backend**        | Next.js App Router | Edge-capable API runtime. |
| **Database**       | Supabase (PostgreSQL) | Stores central application JSON configurations and handles Dynamic App instances. |
| **Authentication** | Clerk B2B | Provides JWT-mediated state control natively wired directly into Next.js middleware. |
| **Queue**          | Upstash Kafka | Low-latency serverless event brokering for analytical webhooks. |
| **Cache/RateLimit**| Upstash Redis | Hard prevents API exhaustion and speeds up identical query latencies globally. |
| **Generative AI**  | AI SDK Core | Standardized multi-model fallback streaming execution (Groq, Gemini). |
| **Observability**  | Sentry | Full cycle Next.js Error Monitoring locally and globally. |
| **Infrastructure** | Vercel / Docker | Highly distributed edge platforms + container isolation. |

---

## Why These Technologies?

### Confirmed Decisions
* **Next.js & Server Actions:** Completely eliminates the need to build, maintain, and type RESTful boilerplate controllers. Enables seamless frontend/backend component state transitions.
* **Upstash Serverless vs Redis Cloud:** Since Vercel executes serverlessly natively on edge regions, maintaining a dedicated socket against traditional Redis drains connection pools identically into a freeze. Upstash connects cleanly via standardized HTTP REST interfaces.
* **Groq vs OpenAI:** AppForge processes enormous dual-prompt AST generation logic. Groq runs Llama 3 models on LPUs outputting `~700 tokens per second`, drastically dropping generation latency under the UI hydration barrier.

### Inferred Decisions *(Evaluate/TODO)*
* **Client Side Validation State (Zustand):** Currently state seems heavily constrained to React Contexts and local `useState` props, avoiding heavy global Redux/Zustand payloads since Next.js inherently handles server-side transitions via RSC.

---

## Core Application Flows

### AI Layout Generation
```text
User presses "Ask AI" via CopilotPanel
  ↓
/api/copilot API Route extracts Prompt
  ↓
Upstash Ratelimit evaluated using 'x-forwarded-for' (IP Address)
  ↓
Cache Lookup via Upstash Redis (`copilot_cache:<prompt>`)
  ↓ (If Miss)
AI SDK issues system prompt to Groq (LPU)
  ↓
Result is appended back directly into Redis (TTL 7days)
  ↓
ReadableStream passes raw text into CopilotPanel
  ↓
Regex strips filler Markdown; JSON parses into valid JSON
  ↓
UI Registry maps JSON blocks visually into Shadcn elements instantly.
```

---

## Data Flow

* **Entry:** Data enters through natural language input in `CopilotPanel.tsx` or raw JSON manipulation in the `ConfigEditor.tsx`.
* **Transformation:** Client-side validation is rigorously processed through the `registry/*` tree to ensure dynamic layouts correctly match required prop boundaries.
* **Persistence:** `handleSave` triggers a Next.js Server Action (`saveAppConfig`), injecting the raw AST tree strictly into the Supabase Postgres `apps(config)` table.
* **Database DDL Orchestrator:** On saving or publishing, the payload undergoes secondary loop analysis where identical SQL relations are physically constructed via `execute_app_ddl` to handle the app's structural storage.

---

## Database Architecture

- **Technology**: PostgreSQL (managed by Supabase).
- **Core Entities**:
  - `apps`: Primary mapping of `id`, `name`, `config` (JSONB) and `published_config` (JSONB). Indexed internally via Clerk-compliant string `user_id`.
  - `app_schemas`: Relational map referencing the custom tables built dynamically during AST injection via `syncAppSchema`.
  - `validation_logs`: Standard error pipeline sink checking application component syntax validity per save.
- **Transactions & RLS**: 
  - Row Level Security (RLS) is strictly enforced upon the DB layer. 
  - However, in production, we actively bypass native token inspection directly injecting the `SUPABASE_SERVICE_ROLE_KEY` inside `createInsforgeServer()`, shifting the exact Identity & Security authority physically onto the Next.js Server Action logic (via Clerk `auth()`), which guarantees safe decoupled multi-tenant capabilities.
- **Initialization**: DB initialization instructions exist explicitly under `sql/schema.sql` and `sql/rpc_ddl.sql`.

---

## Authentication & Authorization

Authentication is natively enforced using **Clerk**.

- **Mechanism:** Short-lived JWT Session logic brokered directly onto browser cookies.
- **Root Middleware:** `middleware.ts` runs directly on the Vercel Edge. Unauthenticated users are hard-bounced back to the identity provider logic on all system modifications unless matched against the `createRouteMatcher` public list (`/builder/demo`, etc).
- **Graceful Quota Locking:** Guests attempting sandbox usage are structurally blocked at 2 interactions (monitored globally via heavily decoupled localStorage + Server Rate Limiting parameters).

---

## Configuration & Environment Variables

| Variable | Required | Example | Description |
| -------- | -------: | ------- | ----------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | `pk_test_...` | Public frontend client verifier required by Clerk SDK |
| `CLERK_SECRET_KEY` | Yes | `sk_test_...` | Private token verifier required by Clerk Backend Context |
| `NEXT_PUBLIC_INSFORGE_URL` | Yes | `https://xxxx.supabase.co` | Endpoint connection strings to your specific Postgres Instance |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | Yes | `eyJhbG..` | Limited Postgres Anonymous interaction token |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | `eyJhbG..` | SuperAdmin Role bypassing internal Postgres Policies remotely |
| `GROQ_API_KEY` | Yes | `gsk_xxxx` | Model connection keys serving primary LPU text inferences. |
| `GEMINI_API_KEY` | Yes | `AIza...` | Tier 1 failover key explicitly triggered when Groq rate limits. |
| `GEMINI_API_KEY_2` | Optional | `AIza...` | Tier 2 failover key ensuring zero-downtime structural capacity. |
| `UPSTASH_REDIS_REST_URL` | Yes | `https://xx.upstash.io` | Connection URL for REST API Serverless KV fetching. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | `AXXX...` | Security token allowing API validation to the DB cache tier. |
| `UPSTASH_KAFKA_REST_URL` | Yes | `https://xx.upstash.io` | Connection URL serving background telemetry logic. |
| `UPSTASH_KAFKA_REST_USERNAME` | Yes | `default` | Security cluster identifier verifying event payloads. |
| `UPSTASH_KAFKA_REST_PASSWORD` | Yes | `XXXX...` | Security hash authorizing push topics. |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | `https://xx@sentry.io/xx`| Application telemetry monitoring pipeline sink configurations |
| `ADMIN_BYPASS_KEY` | Optional | `super_secret_string` | Testing parameter to circumnavigate explicit production server checks. |

*(All secrets are kept secure within `.env.local` locally and mapped securely out into the Vercel variables GUI in prod.)*

---

## Installation & Local Development

### Quick Start
AppForge assumes you possess a compatible runtime environment comprising `Node.js 18+`. 

```bash
# 1. Pull the codebase
git clone https://github.com/vpn-cli/appforge.git
cd appforge

# 2. Extract dependencies
npm install --legacy-peer-deps

# 3. Apply your keys (Create .env.local via duplicating the configuration section rules)
touch .env.local

# 4. Initiate the runtime sandbox
npm run dev
```

### Database Seeding
Ensure you physically initialize the Supabase architecture first:
1. Copy the contents of `sql/schema.sql` completely into your Supabase SQL Editor and execute.
2. Ensure you initialize the `execute_app_ddl` structural abstraction via `sql/rpc_ddl.sql`.

---

## Running the Application

AppForge is functionally agnostic between standard bare-metal execution and Next.js static cluster generations.

```bash
# Local Live Editing Mode (localhost:3000)
npm run dev

# Explicit Production Emulation Build (Compiles SSR statically)
npm run build
npm run start
```

---

## Docker

AppForge includes a rigorously verified Next.js multi-stage Docker build pipeline suitable strictly for container orchestration logic if Vercel Edge topologies are not preferred.

### Development & Orchestration Workflow

```bash
# Generate the multi-stage image statically
docker build -t appforge/app:latest .

# Deploy the node standalone application 
docker run -p 3000:3000 --env-file .env.local appforge/app:latest
```

The underlying Dockerfile implements the `output: "standalone"` trace-builder reducing the default heavy Node modules payload heavily. 

*Known Limitation (Docker)*: Edge runtime API routes (`app/api/copilot/route.ts`) function equivalently under `docker`, however executing it completely baremetal within Node may sacrifice some localized Vercel networking optimizations.

---

## CI/CD & Testing

**CI Provider:** GitHub Actions (`.github/workflows/production.yml`)

The enterprise pipeline heavily restricts branches. It is comprised strictly of dual-jobs resolving concurrently only to `.yml` triggered branches:
1. **Linting and Source Verification**: Compiles a headless `npx tsc --noEmit` and applies explicit `eslint --fix` constraints ensuring perfect structural typings.
2. **Container Build Verification**: Forces validation that `appforge:latest` correctly boots `sleep 10` processes within isolation cleanly.

*(No traditional component/unit testing platforms (Mocha/Jest) are currently coupled to the runtime flow natively. Typescript compilation checks are utilized as the sole deterministic integration logic).*

---

## Security & Error Handling

- **Service Account Context Boundaries:** No Postgres interaction runs directly from the front-end unless explicit Row Level Security explicitly ignores the `INSERT`. The application explicitly isolates database actions into Edge-routed RPC calls executing behind `SUPABASE_SERVICE_ROLE_KEY`, meaning that 99.9% of security logic intercepts natively against Clerk's Next.js authorization barrier. 
- **Graceful Fault Lines:** Malformed AI JSON logic natively injects right into React logic. To prevent full application White Screen deaths, component elements generated inside the canvas run internally trapped inside isolated native Custom React `ErrorBoundaries`.

---

## Observability

- **Sentry Integration:** Comprehensive real-time runtime monitoring is strictly integrated using `@sentry/nextjs`. Next.js traces are securely wrapped throughout `instrumentation.ts` globally, monitoring exception pipelines symmetrically on Server APIs, client edges, and standard SSR render flows.
- **Sentry Tunnel Router:** `next.config.ts` incorporates heavily un-detectable `tunnelRoute: /monitoring` overrides pushing localized errors straight through standard HTTP pipes specifically subverting overzealous ad-blockers inside browser DOMs.

---

## Debugging Guide

### Unauthorized Save Bounces
- **Cause:** Clerk Edge tokens mismatching Next.js Server actions caching. 
- **Verify:** Ensure `middleware.ts` is named correctly in the root folder. Use the explicit `/builder/demo` exception within `createRouteMatcher` to guarantee routing matches accurately.

### AI Generation Empty Blocks
- **Cause:** Upstash Rate Limit lockouts overriding normal operations.
- **Verify:** Open browser networking tools; look specifically at identical `429 Too Many Requests` API sink boundaries triggered inside `CopilotPanel.tsx`. 

### Container Network Boot Blocks
- **Cause:** Disconnecting or modifying `execute_app_ddl` logic structurally blocks remote runtime instantiators. 
- **Verify:** Audit `sql/schema.sql` and run `SELECT * FROM app_schemas` using the Supabase remote debug query UI.

---

## Known Limitations / TODO
- **TODO / Verify (React Testing Layer):** There is currently no active e2e testing interface. Adding `Playwright` to strictly verify DOM layout alignment output from generic JSON structures would guarantee a vastly more secure build layer.
- **TODO / Verify:** AI Provider Failover Logic is extremely simplistic. Migrating to a complex load-balancer tracking API quota exhaustions heavily per key natively rather than sequential cascading fallbacks.
- **Functional Limitation (Publishing):** Guests cannot natively host simulated domains in full isolation. They require immediate `auth.protect()` transitions.

---

## License

This project executes under proprietary distribution configurations natively unless fully stated otherwise. 

*(Project requires explicit Vercel usage terms assuming Next.js standalone execution logic if utilized commercially).*
