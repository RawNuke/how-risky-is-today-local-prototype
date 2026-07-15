# PROJECT.md — Daily Risk Index, Delhi-NCR
### Complete implementation plan (self-contained — no other context needed)

**Last updated:** 13 July 2026
**Owner:** Raunaq (no coding experience; prefers no-code tools; plain-language explanations)
**Execution mode:** fast-track — an AI assistant executes the build steps; the owner reviews. The click-by-click teaching approach is deliberately paused. If a later phase moves from the no-code stack to real code, the schema, sources, and formula in this document carry over unchanged.

---

## 1. The concept

**One-liner:** a web app that tells you, every morning, how dangerous it is to simply step out in Delhi-NCR today — and names the people responsible when that danger is man-made.

### The problem it attacks
Human fear is calibrated by headlines, not by what actually kills people. India, NCRB ADSI 2023:

| Cause | Deaths/year | vs murder |
|---|---|---|
| All accidents | **444,104** | ~16× |
| Road crashes alone | **~174,000** | ~6× |
| Murder | **~28,000** | 1× (the thing we fear most) |

The routine (potholes, speeding buses, live wires in flooded streets) kills at ~16× the rate of the dramatic (murder). The app makes the invisible routine risk visible, personal, and **traceable to the authority that failed to prevent it**.

### The metric
**Micromorts.** 1 micromort = a 1-in-a-million chance of dying today (Ronald Howard, Stanford decision analysis). Not "life expectancy" — that is expected years remaining, driven by disease and age. This app computes **acute, external-cause risk per day**, conditioned on:
- **where you are** (district),
- **who you are** (age band, sex),
- **what you're doing** (two-wheeler vs metro vs staying home).

Illustrative national scale: ~0.85 µmort/day from all accidents, ~0.33 from roads, ~0.05 from murder. Delhi-specific values replace these once Layer A data is loaded.

### The accountability twist
Every incident and cause carries a `responsible_authority` and a `preventable` flag:

```
Open manhole death       → Delhi Jal Board
Electrocution in flood   → DISCOM (BSES/Tata Power-DDL)
Pothole crash            → MCD / PWD
Building collapse        → MCD / DDA
Crowd stampede           → Delhi Police / organiser
```

The database doubles as a public negligence ledger. Delhi reality (2024–25 reporting): 20+ electrocution deaths in 50 incidents since 2024; 7,678 potholes reported with ~half unfixed by Apr 2025; 1,160 road accidents in the 1 May–15 Jul 2025 monsoon window; 26 open-manhole complaints unresolved.

### Honesty guardrails (non-negotiable, designed in)
1. The app reports a **base rate for "people like you, here, doing this"** — never a personal prophecy. UI language must reflect this.
2. Official (Layer A) and news-derived (Layer B) data are always visually distinct; live items are labeled unverified/recent until reviewed.
3. The live adjustment to the score is **bounded and time-decayed** — one dramatic headline can never multiply the number.
4. Every number **decomposes** in the UI: "baseline 0.9 + monsoon 0.2 + 3 verified electrocutions in your district this week 0.15 = 1.25 µmort."
5. Every incident keeps its `source_url` — advocacy claims must be traceable.
6. No fabricated statistics, ever. Rates enter `Reference_Rates` only with a named source, year, and URL.

---

## 2. Locked decisions (do not re-open)

| Decision | Choice | Why |
|---|---|---|
| Scope | **Delhi-NCR pilot** (NCT-Delhi first) | Feasibility; complete dataset to validate before scaling to India |
| Metric | **Micromorts, hybrid live-adjusted** | Official base rate nudged by recent *verified* incidents, bounded |
| Primary goal | **Accountability / advocacy** | Spotlight preventable, negligence-attributable deaths |
| Stack | **No-code: Airtable + Make.com + Softr/Glide** | Owner is a non-coder and must be able to operate it |
| X/Twitter | **Excluded** | 2026 pay-per-use pricing (~$0.005/read, $0.20/post-with-URL); no viable free tier; GDELT covers the need for free |
| Live feed | **GDELT DOC 2.0 API + targeted RSS**, human-reviewed | Free, geocoded, 15-min updates; review gate keeps it honest and within row limits |
| Airtable free-tier limits | 1,000 rows/base, 100 automation runs/mo, 1,000 API calls/mo | Live feed stays curated/low-volume; scale path = move `Incidents` to NocoDB/Baserow |
| Geography granularity | **No sub-city divisions** for Noida/Gurugram/Faridabad/Ghaziabad. Official data (NCRB, Delhi Police) doesn't publish deaths-by-cause at sector level — subdividing would create empty rows with fake precision. Sector-level detail lives only in `Incidents` as a free-text `sub_location` field, never as formal `Geography` rows. | Precision must match the data |
| Environmental causes | Air pollution & heat tracked in the taxonomy but **excluded from the daily headline** (`in_daily_headline = No`) | Chronic, not acute; separate module later |

---

## 3. Current status (start here)

- ✅ Airtable base **`Delhi-NCR Risk Engine`** exists (free plan, owner's account).
- ✅ Table `Cause_Taxonomy` imported from seed data (Appendix A) — ~20 rows.
- ⏳ **Next action:** Phase 0 step 2 — import the remaining three seed tables (Appendices B, C, D), then link tables per the schema (§5).

---

## 4. Data architecture — two layers, kept separate

```
LAYER A — ACTUARIAL BACKBONE                LAYER B — LIVE INCIDENT FEED
(official, annual, trusted)                 (news-derived, 15-min, noisy)

NCRB ADSI / Crime in India                  GDELT DOC 2.0 API (geocoded news)
Delhi Traffic Police (via OpenCity)         Delhi-outlet RSS feeds
MoRTH Road Accidents in India               Official handles (police/DDMA feeds)
SRS / Census life tables                          │
      │                                           ▼
      │  manual CSV import,                 Make.com scenario: filter → AI-classify
      │  once per annual release            → write CANDIDATE rows (Pending)
      │                                           │
      │                                     Human review in Airtable:
      │                                     Verified / Rejected / Duplicate
      ▼                                           ▼
┌────────────────────────────────────────────────────────────────┐
│  DAILY SCORE = baseline × activity × season + bounded live adj │
└────────────────────────────────────────────────────────────────┘
```

### 4.1 Layer A sources

| Source | Gives us | Access | Cadence |
|---|---|---|---|
| NCRB **ADSI 2023** | Accidental deaths by cause, Delhi-level | https://www.data.gov.in/catalog/accidental-deaths-suicides-india-adsi-2023 and https://data.opencity.in/dataset/accidental-deaths-and-suicides-in-india-2023 | Annual, ~2-yr lag |
| NCRB **Crime in India** | Murder/assault rates, Delhi | https://crime-in-india.github.io/cities/Delhi/ (machine-readable) and https://www.ncrb.gov.in | Annual |
| **Delhi Traffic Police** crashes | Road crashes & fatalities 2014–2023; accident-prone locations | https://data.opencity.in/dataset/delhi-road-crashes-data and https://data.opencity.in/dataset/delhi-accident-prone-areas | Annual |
| **MoRTH** Road Accidents in India | Crash detail by road-user type (calibrates activity multipliers) | Annual report, morth.nic.in (PDF/CSV) | Annual |
| **SRS / Census** | Baseline mortality by age/sex; district populations | Registrar General of India; censusindia.gov.in | Periodic |
| data.gov.in API | Programmatic pulls where available | Free API key from account page at data.gov.in | — |

### 4.2 Layer B sources

| Source | Access | Notes |
|---|---|---|
| **GDELT DOC 2.0** | Free HTTP/JSON, no key. Base: `https://api.gdeltproject.org/api/v2/doc/doc` | Starting query (tune at build time): `?query=(pothole OR manhole OR electrocution OR "wall collapse" OR stampede OR drowned OR "road accident") (Delhi OR Noida OR Gurugram OR Ghaziabad OR Faridabad) sourcecountry:IN&mode=artlist&format=json&timespan=1d&maxrecords=25` |
| **RSS** — Delhi city desks | e.g. Times of India Delhi, Hindustan Times Delhi, The Patriot, The Tribune Delhi | Exact feed URLs to be verified at build time; prefer 2–3 reliable feeds over many |
| Official feeds | Delhi Police / Delhi Traffic Police / DDMA announcements | Via RSS or page-watch; **no social-media scraping** |

---

## 5. Database schema — Airtable base `Delhi-NCR Risk Engine`, 7 tables

`→ Table` = Airtable **"Link to another record"** field. Build order: Geography, Responsible_Authority, Cause_Taxonomy first (lookups), then the rest.

### 5.1 Geography
| Field | Type | Notes |
|---|---|---|
| area_name | Text (primary) | "South-West Delhi", "Gurugram" |
| sub_region | Single select | NCT-Delhi / Haryana-NCR / UP-NCR / Rajasthan-NCR |
| level | Single select | City / District |
| population_estimate | Number | see status field |
| population_status | Single select | approx-verify / verified — **all seed rows are approx-verify; must be verified against Census/projections before rates are computed** (population is the denominator) |
| notes | Long text | |

### 5.2 Cause_Taxonomy
| Field | Type | Notes |
|---|---|---|
| cause_name | Text (primary) | |
| super_category | Single select | Road / Crime / Civic-Negligence / Other-Accident / Environmental |
| default_preventable | Checkbox | |
| in_daily_headline | Checkbox | Environmental rows = unchecked |
| typical_authority | → Responsible_Authority | |
| notes | Long text | |

### 5.3 Responsible_Authority
| Field | Type | Notes |
|---|---|---|
| authority_name | Text (primary) | |
| abbrev | Text | |
| jurisdiction | Single select | Delhi / Haryana-NCR / UP-NCR / Central / Multi |
| covers | Long text | |

### 5.4 Reference_Rates (Layer A backbone)
| Field | Type | Notes |
|---|---|---|
| label | Text (primary) | e.g. "Road-2wheeler / Delhi / M / 18-35" |
| cause | → Cause_Taxonomy | |
| geography | → Geography | |
| age_band | Single select | All / 0-17 / 18-35 / 36-60 / 60+ |
| sex | Single select | All / Male / Female |
| rate_per_100k_per_year | Number | from official source only |
| micromorts_per_day | Formula | `(rate_per_100k_per_year / 100000) * 1000000 / 365` |
| source | Text | e.g. "NCRB ADSI 2023" |
| source_year | Number | |
| source_url | URL | |
| notes | Long text | |

### 5.5 Activity_Modifiers
| Field | Type | Notes |
|---|---|---|
| activity | Text (primary) | |
| cause_affected | → Cause_Taxonomy | |
| multiplier_starter | Number | STARTER guesses — calibrate against MoRTH road-user shares before launch |
| justification | Long text | |

### 5.6 Incidents (Layer B live feed)
| Field | Type | Notes |
|---|---|---|
| headline | Text (primary) | |
| date | Date | when it happened |
| summary | Long text | |
| source_url | URL | always required |
| source_type | Single select | Official / News / Social |
| geography | → Geography | district/city level only |
| sub_location | Text | free text, e.g. "Sector 62, Noida" — per locked geography decision |
| cause | → Cause_Taxonomy | |
| deaths | Number | |
| injuries | Number | |
| preventable | Checkbox | |
| responsible_authority | → Responsible_Authority | |
| accountability_status | Single select | Unaddressed / FIR-filed / Compensation / Official-response / Unknown |
| verification_status | Single select | Pending / Verified / Rejected / Duplicate — **only Verified rows affect the score** |
| dedup_key | Text | `YYYY-MM-DD_<area-slug>_<cause-slug>` |
| date_ingested | Date | |

### 5.7 Daily_Risk_Snapshots (optional, for trends)
| Field | Type | Notes |
|---|---|---|
| snapshot_id | Text (primary) | date + geography + profile |
| date | Date | |
| geography | → Geography | |
| profile | Text | e.g. "M / 18-35 / two-wheeler" |
| baseline_micromorts | Number | |
| adjustment_micromorts | Number | |
| total_micromorts | Formula | `baseline_micromorts + adjustment_micromorts` |

---

## 6. Ingestion pipeline (Make.com, human-in-the-loop)

One scheduled Make.com scenario:

1. **Schedule:** 1–2 runs/day (budget note below).
2. **HTTP module:** GET the GDELT query (§4.2). **RSS modules:** 2–3 Delhi feeds.
3. **Filter:** keep items matching NCR place names + cause keywords; drop the rest before any AI call.
4. **AI classification module** (Claude/GPT). Prompt template:
   > You classify Indian news items for a civic-risk database. Given the headline, snippet, and URL, return strict JSON: `{"is_relevant": bool — a specific recent death/injury incident in Delhi-NCR, not policy/opinion/old news, "cause_name": one of [exact list from Cause_Taxonomy], "geography": one of [exact list from Geography], "sub_location": string or null, "deaths": int, "injuries": int, "preventable": bool, "responsible_authority": one of [exact list] or null, "summary": ≤40 words factual, "dedup_key": "YYYY-MM-DD_<area-slug>_<cause-slug>"}`. If not relevant return `{"is_relevant": false}`. Never invent casualty counts — use 0 if unstated.
5. **Dedup check:** search `Incidents` for the `dedup_key`; skip if present.
6. **Airtable create record:** write candidate row, `verification_status = Pending`.
7. **Human review** (in Airtable, grouped-by-status view): owner flips Pending → Verified / Rejected / Duplicate. Only Verified rows enter the score.

**Budget math (why 1–2 runs/day):** Airtable free = 1,000 API calls/mo (Make writes consume these); Make free ≈ 1,000 operations/mo and each processed article consumes several ops. 2 runs/day × ~10 candidate items keeps both within limits. If `Incidents` approaches 1,000 rows, migrate that one table to NocoDB or Baserow (open-source, no row cap) — the scale path, not a pilot concern.

---

## 7. The risk formula

```
DailyRisk(person, district, day)  [micromorts] =

  Σ over causes c where in_daily_headline:
      BaseRate(c, district, age_band, sex)          ← Reference_Rates.micromorts_per_day
    × ActivityMultiplier(activity, c)               ← Activity_Modifiers
    × SeasonalModifier(c, day)                      ← e.g. monsoon window 15 Jun–15 Sep
  + BoundedRecentAdjustment(district, last N days)
```

**BoundedRecentAdjustment — proposed defaults (confirm during build):**
- Window: verified incidents in the same district, last **14 days**, linear decay to zero at day 14.
- Contribution: convert incident deaths to an implied local rate, compare to baseline.
- **Cap: adjustment ≤ ±50% of that cause's baseline.** This is the mechanism that keeps "hybrid live-adjusted" honest.

**Seasonal defaults (confirm):** monsoon multiplier on electrocution, manhole/sewer falls, drowning, pothole crashes during 15 Jun–15 Sep; magnitude calibrated from Layer A monthly breakdowns where available, else starter ×2 flagged as such.

**Transparency requirement:** the output always shows its parts, e.g. *"Baseline 0.9 + monsoon 0.2 + 3 verified electrocution deaths in your district this week 0.15 = 1.25 µmort today."*

**Worked check (national, real numbers):** all-accident rate 31.7/100k/yr → 31.7/100000 × 1e6 / 365 ≈ **0.87 µmort/day**. Road rate 12.4/100k/yr → **0.34 µmort/day**.

**Roadmap:** v1 = this transparent arithmetic in Airtable formulas + Make. v2 = Poisson/Bayesian small-area estimates and fitted seasonality (requires code; out of pilot scope).

---

## 8. Front-end (later phase — brief)

- **Softr or Glide** on top of the Airtable base.
- Screens: (1) "Your day" — profile picker (district, age band, sex, activity) → decomposed micromort score; (2) "Recent verified incidents near you" — Layer B, clearly labeled; (3) **Negligence ledger** — verified preventable deaths grouped by `responsible_authority`, with `accountability_status` counts (the advocacy centerpiece); (4) About/methodology page stating the guardrails in §1.
- Sample readout (illustrative): *South-West Delhi, Tuesday in July. You: 28, male, two-wheeler commute. Today: ~3 µmorts (~3× an average day). Why: two-wheeler in rain (biggest factor) + 3 electrocution deaths in your district this week → DISCOM + monsoon multiplier.*

---

## 9. Phased task list

### Phase 0 — Schema (in progress)
- [x] Create Airtable base `Delhi-NCR Risk Engine`
- [x] Import `Cause_Taxonomy` (Appendix A)
- [ ] Import `Responsible_Authority`, `Geography`, `Activity_Modifiers` (Appendices B–D)
- [ ] Create empty `Reference_Rates`, `Incidents`, `Daily_Risk_Snapshots` per §5 (Appendices E–F show shapes)
- [ ] Set field types: single-selects, checkboxes, dates, URL fields
- [ ] Create linked-record fields per schema; connect `Cause_Taxonomy.typical_authority` → `Responsible_Authority`
- **Done when:** all 7 tables exist, links resolve (dropdowns show imported rows)

### Phase 1 — Layer A backbone
- [ ] Verify `Geography.population_estimate` values against Census/official projections; flip status to `verified`
- [ ] Download ADSI 2023 Delhi tables + OpenCity Delhi crash data; extract per-cause Delhi rates
- [ ] Populate `Reference_Rates` (source + year + URL on every row); `micromorts_per_day` formula computes
- [ ] Calibrate `Activity_Modifiers` from MoRTH road-user shares; replace STARTER flags
- **Done when:** reconciliation test passes — computed all-cause Delhi µmorts/day ≈ (total deaths ÷ Delhi population ÷ 365) from the source documents

### Phase 2 — Layer B live feed
- [ ] Verify 2–3 Delhi RSS feed URLs; finalize GDELT query
- [ ] Build the Make.com scenario per §6 (schedule → fetch → filter → AI classify → dedup → Airtable Pending row)
- [ ] Create the review view in Airtable (grouped by `verification_status`)
- [ ] Run live for ~1 week; measure precision (relevant candidates ÷ total candidates); tune filters
- **Done when:** a real Delhi incident from the week appears as a candidate with correct AI-filled cause, casualties, and authority; review gate demonstrably controls what counts

### Phase 3 — The score
- [ ] Implement §7 in Airtable formulas/rollups (+ Make where needed), including the cap and decay
- [ ] Confirm cap/decay defaults (±50%, 14 days) or adjust
- [ ] Generate `Daily_Risk_Snapshots` daily for 2–3 profile archetypes
- **Done when:** verification checklist (§10) fully passes

### Phase 4 — Front-end (separate effort, spec in §8)

---

## 10. Verification checklist (end-to-end, no code required)

1. **Backbone reconciles:** all-cause Delhi µmorts/day from `Reference_Rates` matches (source total deaths ÷ verified population ÷ 365) within rounding.
2. **Live pull works:** one Make run for "Delhi pothole/electrocution, last 7 days" lands candidate rows with AI-filled fields.
3. **Review gate works:** approve 2–3, reject 1 → only approved rows change the score.
4. **Adjustment is bounded:** approve a cluster of same-district incidents → score rises but never beyond the cap; decomposition displays the parts.
5. **Ground-truth spot check:** a known reported death (e.g. a 2024–25 Delhi monsoon electrocution) is captured and attributed to the correct authority.
6. **Honesty audit:** every `Reference_Rates` row has source+URL; no STARTER/approx-verify flags remain in anything user-facing.

---

## 11. Open items (decide during build — not blockers)

- Exact NCR footprint for v1: NCT-Delhi only first, or include Gurugram/Noida/Ghaziabad/Faridabad city rows from day one (rows exist in seed data either way).
- Final cap and decay-window values for the live adjustment (defaults: ±50%, 14 days).
- Seasonal multiplier magnitudes once Layer A monthly data is inspected.
- Later: a separate **chronic module** for Delhi air pollution (major accountability story; excluded from the daily headline by design).
- App name. Candidates: **"Aaj Kitna Risk?"** (localised, sticky), "Step-Out Index", "Roz ka Risk", "The Survival Index — Delhi-NCR", "MicroMort Delhi".

---

# Appendices — seed data (save each block as a `.csv` and import)

## Appendix A — cause_taxonomy.csv *(already imported ✅)*

```csv
cause_name,super_category,default_preventable,in_daily_headline,typical_authority,notes
Two-wheeler crash,Road,No,Yes,Delhi Traffic Police,Riders are the single largest share of road deaths
Pedestrian hit,Road,No,Yes,Delhi Traffic Police,Pedestrians heavily over-represented in fatalities
Car/taxi crash,Road,No,Yes,Delhi Traffic Police,
Bus/heavy-vehicle crash,Road,No,Yes,Delhi Traffic Police,
Cyclist hit,Road,No,Yes,Delhi Traffic Police,
Pothole-related crash,Road,Yes,Yes,MCD,Road-surface defect; negligence angle
Open manhole/sewer fall,Civic-Negligence,Yes,Yes,Delhi Jal Board,Worsens during monsoon waterlogging
Electrocution (waterlogging/exposed wire),Civic-Negligence,Yes,Yes,DISCOM,20+ deaths in 50 incidents since 2024
Building/wall collapse,Civic-Negligence,Yes,Yes,MCD,Often unsafe/illegal construction
Fire (code violation),Civic-Negligence,Yes,Yes,Delhi Fire Service,
Stampede/crowd crush,Civic-Negligence,Yes,Yes,Delhi Police,Event/crowd management failure
Tree/branch fall,Civic-Negligence,Yes,Yes,MCD,
Drowning (drain/unfenced waterbody),Civic-Negligence,Yes,Yes,Delhi Jal Board,
Sewer-cleaning death (manual scavenging),Civic-Negligence,Yes,Yes,Delhi Jal Board,Illegal practice; contractor accountability
Homicide/murder,Crime,No,Yes,Delhi Police,Far rarer than road deaths
Assault causing death,Crime,No,Yes,Delhi Police,
Fall from height,Other-Accident,No,Yes,,
Accidental electrocution (non-civic),Other-Accident,No,Yes,,
Air pollution (chronic),Environmental,Yes,No,DPCC,Chronic not acute; tracked separately not in daily headline
Heatwave/cold exposure,Environmental,Yes,No,DDMA,Seasonal; borderline acute
```

## Appendix B — responsible_authority.csv

```csv
authority_name,abbrev,jurisdiction,covers
Municipal Corporation of Delhi,MCD,Delhi,Local roads & potholes; drains; building safety; trees; sanitation
Public Works Department Delhi,PWD,Delhi,Major roads & flyovers; street lighting
Delhi Jal Board,DJB,Delhi,Water supply; sewers & manholes; drainage
Delhi Development Authority,DDA,Delhi,Land use; construction approvals; public land
Delhi Traffic Police,DTP,Delhi,Traffic enforcement; signals; road-safety
Delhi Police,DP,Delhi,Crime; public order; crowd management
BSES Rajdhani / BSES Yamuna / Tata Power-DDL,DISCOM,Delhi,Electricity distribution; exposed wiring; pole safety
Delhi Fire Service,DFS,Delhi,Fire safety; building fire clearances
Delhi Disaster Management Authority,DDMA,Delhi,Disasters; heatwave/flood response
Transport Department Delhi,TD,Delhi,Bus/commercial permits; vehicle fitness
National Highways Authority of India,NHAI,Central,National highways passing through NCR
Forest Department Delhi,FD,Delhi,Trees on public land
Delhi Pollution Control Committee,DPCC,Delhi,Air & environmental pollution
Gurugram Metropolitan Development Authority,GMDA,Haryana-NCR,Infrastructure in Gurugram
New Okhla Industrial Development Authority,Noida Authority,UP-NCR,Infrastructure in Noida/Greater Noida
Ghaziabad Development Authority,GDA,UP-NCR,Infrastructure in Ghaziabad
```

## Appendix C — geography.csv
*(populations are rough placeholders — `approx-verify` — verify before computing rates; no sub-city rows per locked decision)*

```csv
area_name,sub_region,level,population_estimate,population_status,notes
Delhi (NCT),NCT-Delhi,City,20000000,approx-verify,Whole National Capital Territory; use for first reconciliation check
New Delhi district,NCT-Delhi,District,150000,approx-verify,Small govt/administrative core
Central Delhi,NCT-Delhi,District,600000,approx-verify,
North Delhi,NCT-Delhi,District,900000,approx-verify,
South Delhi,NCT-Delhi,District,2800000,approx-verify,
East Delhi,NCT-Delhi,District,1700000,approx-verify,
West Delhi,NCT-Delhi,District,2600000,approx-verify,
North-East Delhi,NCT-Delhi,District,2300000,approx-verify,Densely populated
North-West Delhi,NCT-Delhi,District,3700000,approx-verify,Most populous district
South-West Delhi,NCT-Delhi,District,2300000,approx-verify,
South-East Delhi,NCT-Delhi,District,1800000,approx-verify,Created 2012
Shahdara,NCT-Delhi,District,1800000,approx-verify,Created 2012
Gurugram,Haryana-NCR,City,1200000,approx-verify,Major NCR satellite
Faridabad,Haryana-NCR,City,1800000,approx-verify,
Noida (Gautam Buddh Nagar),UP-NCR,City,1700000,approx-verify,
Ghaziabad,UP-NCR,City,2400000,approx-verify,
```

## Appendix D — activity_modifiers.csv
*(all multipliers are STARTER guesses — calibrate against MoRTH road-user data in Phase 1)*

```csv
activity,cause_affected,multiplier_starter,justification
Ride two-wheeler,Two-wheeler crash,5,STARTER guess — two-wheeler riders are ~40-45% of road deaths; calibrate with MoRTH road-user data
Walk as pedestrian,Pedestrian hit,3,STARTER — pedestrians heavily over-represented in fatalities; calibrate
Cycle,Cyclist hit,2,STARTER — calibrate
Drive/ride in car,Car/taxi crash,1,STARTER — relatively protected; calibrate
Use bus,Bus/heavy-vehicle crash,0.5,STARTER — lower per-trip fatality risk; calibrate
Use metro,Two-wheeler crash,0.2,STARTER — removes road exposure; calibrate
Stay home,Two-wheeler crash,0.1,STARTER — minimal external road exposure; home accidents are a separate category
Out during monsoon evening,Electrocution (waterlogging/exposed wire),4,STARTER — seasonal spike in waterlogging electrocution & manhole falls; calibrate
Out during monsoon evening,Open manhole/sewer fall,4,STARTER — seasonal; calibrate
```

## Appendix E — reference_rates template
*(shape only; the two rows are REAL sourced national examples — replace with Delhi-specific rows in Phase 1)*

```csv
label,cause,geography,age_band,sex,rate_per_100k_per_year,source,source_year,source_url,notes
EXAMPLE — All-accidents / India / All,Two-wheeler crash,Delhi (NCT),All,All,31.7,NCRB ADSI 2023,2023,https://www.data.gov.in/catalog/accidental-deaths-suicides-india-adsi-2023,EXAMPLE ROW — national all-accident rate (444104 deaths / ~1.4B). Replace with Delhi-specific rows.
EXAMPLE — Road deaths / India / All,Two-wheeler crash,Delhi (NCT),All,All,12.4,NCRB ADSI 2023,2023,https://www.data.gov.in/catalog/accidental-deaths-suicides-india-adsi-2023,EXAMPLE ROW — national road-death rate (174000 deaths / ~1.4B). Replace with Delhi-specific rows from OpenCity crash data.
```

## Appendix F — incidents template
*(shape only; delete the example row after import)*

```csv
headline,date,summary,source_url,source_type,geography,sub_location,cause,deaths,injuries,preventable,responsible_authority,accountability_status,verification_status,dedup_key,date_ingested
EXAMPLE — replace this row,2025-07-10,Short factual summary of the incident goes here,https://example.com/article,News,Delhi (NCT),,Electrocution (waterlogging/exposed wire),1,0,true,BSES Rajdhani / BSES Yamuna / Tata Power-DDL,Unaddressed,Pending,2025-07-10_delhi_electrocution,2025-07-11
```

---

## Glossary

- **Micromort** — 1-in-a-million chance of death; the app's unit for daily risk.
- **Layer A** — official statistics backbone (NCRB, Delhi Traffic Police, MoRTH, SRS). Manual annual import. The trusted anchor.
- **Layer B** — live news feed (GDELT + RSS), AI-classified, human-reviewed before it counts.
- **NCRB ADSI** — *Accidental Deaths & Suicides in India*, the main official accident-cause dataset.
- **GDELT** — free global news-event API, geocoded, refreshed every 15 minutes.
- **Bounded adjustment** — the capped, time-decayed live-feed nudge to the baseline; prevents headline-driven spikes.
- **Cause_Taxonomy** — master cause list (Road / Crime / Civic-Negligence / Other-Accident / Environmental) with responsible authority and preventable flag.
- **Negligence ledger** — the public view of verified preventable deaths grouped by responsible authority; the advocacy centerpiece.
