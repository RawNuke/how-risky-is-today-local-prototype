# Local prototype and live deployment

## Local snapshot

The repository is designed to run without access to the production database. When Supabase environment variables are absent, the application uses its local fallback material so a reviewer can inspect the visual hierarchy, map interactions, methodology, incident presentation and risk-pressure explanation.

The local snapshot includes the source for the production data path, but it does not include:

- the production Supabase database;
- Supabase Vault values or invocation secrets;
- Netlify environment variables;
- current production rows;
- a continuously running ingestion schedule; or
- a guarantee that third-party feeds available to the live system will be reachable from another computer.

## Live deployment

The public interface is hosted at:

https://how-risky-is-today-delhi.netlify.app

The deployed architecture separates responsibilities:

- **Netlify** hosts the public Next.js interface.
- **Supabase Postgres** stores environmental snapshots, source articles and located risk signals.
- **Supabase Edge Functions** perform the environmental/RSS refresh and deeper discovery work.
- **Supabase Cron** invokes those functions at the configured intervals.
- **Supabase Vault** stores invocation credentials outside the repository.

The repository contains migrations and function source so the architecture can be reviewed, but it deliberately omits the credentials and production data required to operate the live system.

## Why the distinction matters

The live link demonstrates that the project has been deployed and operates as a public prototype. The local repository makes the underlying structure inspectable and reproducible without exposing production access. Together they are stronger evidence than either a static screenshot or a code dump alone.
