# How Risky Is Today? — Local Prototype Repository

**Project creator and policy lead:** Raunaq Sharma

**Live prototype:** https://how-risky-is-today-delhi.netlify.app

**Repository snapshot created:** 15 July 2026

This repository is a self-contained local snapshot of **How Risky Is Today?**, an experimental Delhi/NCR civic-risk atlas. It was assembled so a fellowship reviewer can inspect the idea, run the public interface locally, read the policy and methodological development trail, and examine selected quality-assurance evidence.

## Local repository versus live system

This repository is the **local prototype and source snapshot**. It contains the interface, risk-signal logic, tests, database migrations, scheduled-function source, project documents, and selected visual evidence.

The live version is a separate deployed system:

| Component | Live system | This local repository |
|---|---|---|
| Public interface | Hosted on Netlify | Runs at `http://localhost:3000` |
| Database | Supabase Postgres | No production database is bundled |
| Scheduled collection | Supabase Edge Functions, Cron and Vault | Function source is included; schedules do not run locally by default |
| Current events and conditions | Read from the live data pipeline | Falls back to clearly marked prototype fixtures when no environment variables are supplied |
| Secrets | Stored in Netlify/Supabase | Intentionally excluded |

The local version therefore demonstrates the product, design, evidence model and implementation. It is not a copy of the production database and should not be expected to reproduce the live site's current event list without separately configured Supabase credentials.

## Run the prototype

On a Mac, double-click **`Start Local Prototype.command`**. On the first run it installs the packages, then starts the application. Open:

`http://localhost:3000`

Alternatively:

```bash
cd webapp
npm install
npm run dev
```

Node.js 24 LTS is recommended. The repository also includes `.nvmrc`.

## Verify the implementation

From `webapp/`:

```bash
npm run check
```

This runs linting, the risk-engine and risk-intelligence tests, and a production build.

## What to inspect

- `docs/PROJECT.md` — the original policy concept and early architecture.
- `docs/PLAN-REVIEW.md` — the evidence and measurement review that narrowed unsupported claims.
- `docs/fellowship.md` — the fellowship-oriented project dossier.
- `docs/rants.md` — a dated development diary recording major design and implementation changes.
- `webapp/` — the runnable application, tests, migrations and ingestion-function source.
- `evidence/current-interface/` — desktop, mobile and event-interaction captures.
- `evidence/development/` — concept-to-implementation comparison, a recorded QA correction and an ingestion audit.
- `report/` — the complete fellowship project report.
- `AUTHORSHIP_AND_AI_ASSISTANCE.md` — a candid allocation of authorship and AI-assisted work.
- `LOCAL_VS_LIVE.md` — a more detailed explanation of the local/live boundary.
- `REPOSITORY_PROVENANCE.md` — what the Git history can and cannot establish.

## Accountability-ledger principle

The proposed ledger is not an administrator review queue and does not position the project creator or an AI system as the source of truth. A deployed record should show:

1. the authority named in identified reporting, an official statement, or a public jurisdiction/ownership record;
2. the evidence basis for showing that authority;
3. the action publicly reported; and
4. when necessary, the bounded status **“no public action recorded as of the last source check.”**

Reported responsibility, legal liability and an adjudicated finding are not interchangeable.

## Data and security note

This repository contains no production secret keys, database passwords or private environment files. `.env.example` lists configuration names only. Do not add real credentials before sharing the repository.

## Scope

This remains an experimental policy prototype. It is not an official warning service, a complete incident registry, a legal finding of responsibility, or a personal mortality calculator.
