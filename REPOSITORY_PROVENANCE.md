# Repository provenance

## What this Git repository establishes

This repository records a curated local-project snapshot made on **15 July 2026**. Its first commit preserves the exact files included at that point and allows a reviewer to inspect subsequent changes through normal Git history.

The committed material includes earlier project files whose contents and local filesystem metadata document a development sequence, including:

- `docs/PROJECT.md` — original concept file dated 13 July 2026;
- `docs/PLAN-REVIEW.md` — methodological review dated 13 July 2026;
- `docs/rants.md` — dated development diary covering 13–14 July 2026;
- application, tests and data-ingestion source developed across 13–14 July 2026;
- visual QA evidence captured on 14 July 2026;
- `docs/fellowship.md` — fellowship dossier prepared on 14 July 2026; and
- the completed report and local-repository packaging prepared on 15 July 2026.

## What it does not establish

The parent working folder did not contain an earlier project-level Git history. Its `webapp/` subfolder contained an empty Git initialization with **no commits**. This repository therefore does **not** retroactively prove that historical commits existed on 13 or 14 July, and no artificial backdated commits have been created.

Git author identity comes from the creator's existing local Git configuration. A commit name or email is not, by itself, conclusive legal proof of authorship.

## How to inspect the snapshot

```bash
git log --date=iso --stat
git show --summary
git status
```

For a durable external record, upload the repository ZIP or Git bundle without modifying it, retain Google Drive ownership and version history, and preserve any independently dated notes, correspondence or application drafts that predate the repository snapshot.
