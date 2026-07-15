# Build "How Risky Is Today?" as a real web app (Delhi-NCR Daily Risk Index)

**Status:** approved plan, awaiting implementation (drafted 13 July 2026, owner reviewing)
**Supersedes:** the Airtable + Make.com + Softr/Glide stack in `PROJECT.md` §2 — schema, sources, formula, and guardrails carry over unchanged
**Decisions locked in this plan:** database = Supabase; app name = "How Risky Is Today?"

## Context

The project (fully specified in `PROJECT.md`) is a civic-accountability web app that reports each day's acute external-cause death risk in Delhi-NCR in **micromorts**, decomposed and traceable, and names the responsible authority for man-made hazards. The original stack was no-code (Airtable + Make.com + Softr/Glide) because the owner is a non-coder. The owner has now switched execution to a **coded web app built by Claude Code**, with the owner reviewing. PROJECT.md explicitly anticipated this: *"If a later phase moves from the no-code stack to real code, the schema, sources, and formula in this document carry over unchanged."*

**What changes:** Airtable → Supabase Postgres; Make.com → a Next.js API route on a daily cron; Softr/Glide → Next.js pages. The existing Airtable base (`Delhi-NCR Risk Engine`, one table imported) is retired; all seed data re-imports from PROJECT.md's CSV appendices.

**What does NOT change (locked in PROJECT.md §2, plus user answers today):**
- Scope (Delhi-NCR pilot), metric (micromorts, hybrid live-adjusted, bounded ±50% cap / 14-day decay), goal (accountability), no X/Twitter, GDELT+RSS with human review gate, no sub-city geography rows, environmental causes out of the daily headline.
- The 7-table schema semantics, the two-layer data architecture (Layer A official / Layer B news), the §7 risk formula, and the §1 honesty guardrails.
- **User decisions today:** Database = **Supabase** (free Postgres, spreadsheet-style editor the owner can browse like Airtable). App name = **"How Risky Is Today?"**

**Environment:** macOS, Node v26.4.0, npm 11.17.0, git 2.50.1 present. Working dir `~/Desktop/Life Expectancy` (not a git repo; contains only README.md + PROJECT.md).

## Owner's role (non-coder) — everything else is done by Claude

1. **Phase 0 (~5 min):** create a free Supabase account + project, paste the project URL / anon key / service-role key / DB connection string into chat; pick an admin password.
2. **Ongoing (~minutes/day):** review Pending incidents at `/admin` — flip to Verified / Rejected / Duplicate.
3. **Phase 5 (~15 min):** create free GitHub + Vercel accounts and click through the connect/deploy screens (guided).
4. **Optional:** create an Anthropic API key to enable auto-classification of news candidates (< $1/month at this volume; app works without it — fields are filled manually during review instead).

## Architecture

One Next.js app (TypeScript, App Router, Tailwind) in a new `webapp/` subfolder — its own **private** git repo (keeps PROJECT.md out of the public codebase).

```
webapp/
├── app/
│   ├── page.tsx                  # Screen 1 "Your day": profile picker → decomposed score
│   ├── incidents/page.tsx        # Screen 2: recent VERIFIED incidents (Layer B, labeled)
│   ├── ledger/page.tsx           # Screen 3: negligence ledger by responsible authority
│   ├── methodology/page.tsx      # Screen 4: guardrails, sources, glossary, formula
│   ├── admin/page.tsx            # Review queue + "Run ingest now" (password-gated)
│   └── api/
│       ├── ingest/route.ts       # GDELT + RSS → filter → dedup → (AI classify) → Pending rows
│       └── admin/…               # verify/reject/edit actions
├── lib/
│   ├── db.ts                     # Supabase client (server-side, service role)
│   ├── score.ts                  # §7 formula: baseline × activity × seasonal + bounded adj
│   └── ingest/{gdelt,rss,filter,classify,dedup}.ts
├── db/migrations/001_schema.sql  # 7 tables
├── db/seed/*.csv                 # Appendices A–F extracted from PROJECT.md
├── scripts/{migrate,seed,reconcile}.ts   # run via node against DATABASE_URL
└── .env.local                    # SUPABASE_*, ADMIN_PASSWORD, CRON_SECRET, [ANTHROPIC_API_KEY]
```

**Schema mapping (Airtable → Postgres):** same 7 tables (`geography`, `responsible_authority`, `cause_taxonomy`, `reference_rates`, `activity_modifiers`, `incidents`, `daily_risk_snapshots`); "Link to another record" → foreign keys; single-selects → text + CHECK constraints; Airtable formula fields → Postgres **generated columns** (`micromorts_per_day = rate_per_100k_per_year / 100000.0 * 1000000.0 / 365.0`); `incidents.dedup_key` UNIQUE (`YYYY-MM-DD_<area-slug>_<cause-slug>`).

**Score engine (`lib/score.ts`)** — per §7, per cause where `in_daily_headline`:
- Base rate lookup, most-specific match first: (geography, age_band, sex) → (geography, All, All) → Delhi (NCT) city row. Geographies with no Layer A rate render as "no official baseline yet" — never a fabricated number.
- × activity multiplier (from `activity_modifiers`, default 1) × seasonal multiplier (monsoon window 15 Jun–15 Sep on flagged causes; starter ×2 flagged as STARTER until calibrated).
- - Bounded live adjustment: Verified incidents only, same geography + cause, last 14 days, linear decay `(14 − days_ago)/14`; deaths → implied local daily µmorts via geography population; **capped at ±50% of that cause's baseline** (defaults confirmable per §11).
- Returns a decomposition array — every UI number shows its parts (guardrail §1.4).

**Ingestion (`/api/ingest`, protected by CRON_SECRET; triggered by Vercel cron 1×/day and an admin button):** GET the GDELT DOC 2.0 query from §4.2 + 2–3 Delhi RSS feeds (exact feed URLs verified during Phase 2) → keyword filter (NCR place names + cause terms) → dedup on `dedup_key` and `source_url` → if `ANTHROPIC_API_KEY` present, classify with Claude Haiku using the §6 prompt (strict JSON, never invent casualty counts) → insert rows as `verification_status = 'Pending'`. **Only Verified rows ever touch the score.**

**Honesty guardrails become UI acceptance criteria:** base-rate wording ("people like you, here, doing this — not a prophecy"); Layer A vs Layer B visually distinct with unverified labeling; decomposition always visible; every incident and rate shows its source URL; no STARTER/approx-verify values user-facing at launch.

## Phases

### Phase 0 — Scaffold, schema, seed
- `npx create-next-app` in `webapp/` (TS, Tailwind, App Router); `git init`; minimal deps (`@supabase/supabase-js`, `postgres` for migrations, `rss-parser`).
- Owner creates Supabase project → keys into `.env.local`.
- Write + run `001_schema.sql` (7 tables, FKs, CHECKs, generated columns, UNIQUE dedup_key).
- Extract Appendices A–D from PROJECT.md into `db/seed/*.csv`; `scripts/seed.ts` loads them (A: 20 causes, B: 16 authorities, C: 16 geographies, D: 9 activity modifiers) + the 2 EXAMPLE national reference rates from Appendix E as pipeline placeholders.
- **Done when:** all 7 tables exist in Supabase with linked rows visible in its table editor; owner can browse them.

### Phase 1 — Layer A backbone (research + data, runs alongside Phases 2–4)
- Verify all 16 `geography.population_estimate` values against Census/official projections → flip `population_status` to `verified`.
- Pull NCRB ADSI 2023 Delhi tables + OpenCity Delhi crash data (URLs in §4.1); extract per-cause Delhi rates → populate `reference_rates` (source + year + URL on every row); delete the EXAMPLE rows.
- Calibrate `activity_modifiers` from MoRTH road-user shares; remove STARTER flags.
- **Done when:** `scripts/reconcile.ts` passes — computed all-cause Delhi µmorts/day ≈ source total deaths ÷ verified population ÷ 365.

### Phase 2 — Live feed + review gate
- Build `/api/ingest` per architecture above; verify 2–3 working Delhi RSS feeds; tune the GDELT query.
- Build `/admin`: password gate (env var + cookie); Pending queue with editable fields (cause, geography, sub_location, deaths, injuries, preventable, authority) and Verified/Rejected/Duplicate buttons; "Run ingest now"; counts by status + precision metric (relevant ÷ total candidates).
- Test with a real pull; then run ~1 week to tune filters (tuning continues after launch).
- **Done when:** a real Delhi incident lands as a Pending candidate with correct fields, and flipping statuses demonstrably controls what counts.

### Phase 3 — The score
- Implement `lib/score.ts` (formula, cap, decay, seasonal window, decomposition, rate-lookup fallbacks) + unit tests with hand-computed cases (e.g. 31.7/100k/yr → 0.87 µmort/day worked check from §7).
- Daily snapshot writer for 2–3 profile archetypes into `daily_risk_snapshots` (same cron).
- **Done when:** §10 checks 3–4 pass (review gate changes score; adjustment never exceeds cap; parts sum to total).

### Phase 4 — Public front-end (4 screens per §8)
- "Your day": district/age/sex/activity pickers → big µmort number, "~N× an average day", full decomposition with per-part source labels.
- "Recent verified incidents": Verified only, labeled news-derived, linking to sources.
- "Negligence ledger" (advocacy centerpiece): verified preventable deaths grouped by authority with `accountability_status` breakdown.
- "Methodology": guardrails, sources, glossary.
- Mobile-first (primary audience is on phones); verified in the browser pane at each step.
- **Done when:** sample readout matches §8's shape and every number decomposes on screen.

### Phase 5 — Deploy + handoff docs
- Push private repo to owner's new GitHub; connect Vercel (Hobby, free); env vars into Vercel; `vercel.json` cron → `/api/ingest` daily (Hobby allows daily crons; the daily hit also keeps the free Supabase project from pausing). Ships at `<name>.vercel.app`; custom domain optional later.
- Full §10 verification checklist end-to-end on production, including the ground-truth spot check (a known 2024–25 Delhi monsoon electrocution attributed to DISCOM).
- Update `README.md` + `PROJECT.md` (stack section, status, ops runbook: how the owner reviews incidents, re-runs ingest, and does the annual Layer A refresh) — these stay the canonical handoff docs.

## Verification
- **Per phase:** run dev server, walk each screen in the browser pane; owner reviews visually.
- **End-to-end (§10):** (1) backbone reconciles via `scripts/reconcile.ts`; (2) live pull lands candidates; (3) review gate: approve 2–3, reject 1 → only approved rows move the score; (4) approve a same-district cluster → score rises but stops at the cap, decomposition shows parts; (5) ground-truth spot check; (6) honesty audit — every rate row has source+URL, nothing user-facing carries STARTER/approx-verify flags.
- **Unit tests** for `score.ts` (formula arithmetic, cap, decay, fallback matching).

## Costs
$0 recurring: GitHub free, Vercel Hobby free, Supabase free (500 MB ≫ needed), GDELT free, RSS free. Optional: Anthropic API key for auto-classification (< $1/month at 1 run/day × ~25 items, Haiku); custom domain (~$10–12/yr) only if wanted later.
