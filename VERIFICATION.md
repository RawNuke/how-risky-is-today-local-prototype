# Local snapshot verification

**Verified:** 15 July 2026

**Command:** `npm run check` from `webapp/`

The clean local-repository copy completed:

- ESLint with no reported errors;
- 28 automated tests with 28 passes and 0 failures;
- TypeScript checking during the Next.js production build; and
- a successful optimized production build.

Verified application routes:

- `/`
- `/api/risk`
- `/incidents`
- `/ledger`
- `/methodology`

The check was performed without adding production credentials to the repository. Build output and installed dependencies are intentionally excluded from Git through `.gitignore`.
