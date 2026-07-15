# Build diary

## 2026-07-13 — The atlas finally has weather, not a weather personality

Turned the very good rainy-night concept into an actual year-round product: rain, heat, haze, road strain, and quiet days all get their own visual language. The baseline and the live signals are kept in separate lanes, because a dramatic interface is allowed to be moody but the numbers are not allowed to become theatre. Also replaced the starter-project archaeology with a real Next.js/Netlify build, a review queue, tests, and an actual map of Delhi/NCR. Civilisation survives another merge.

## 2026-07-14 — The map has been issued glasses

Removed the whole-canvas blur that was making a vector map look like it had been photographed through soup. Weather and air now tick every five minutes, while the heavier evidence trawl keeps its two-hour rhythm. GDELT also has an official IMD alert feed beside it now, because one source is a lead; several independent sources are a system.

## 2026-07-14 — Open the firehose

The prototype no longer makes headlines wait politely in an admin vestibule. Hindustan Times, NDTV, The Indian Express, The Hindu, and NDMA/SACHET now join the five-minute source sweep, while GDELT and IMD keep the broader two-hour trawl. Every lead appears automatically with its source link; the app labels automation honestly and leaves the newspaper's actual reporting with the newspaper. Nine tests passed, and `/admin` has left the building.

## 2026-07-14 — News is not a map pin

The firehose briefly believed that every Delhi headline deserved cartographic immortality. It has since received adult supervision: a story now needs a current risk mechanism, a real venue or neighbourhood, coordinates, and event-level deduplication. The women-aid scheme went home; SCI International Hospital, Jantar Mantar, Mayur Vihar Phase 3, Tilak Nagar and the actual hazards stayed. Sixteen tests now stand between the risk atlas and becoming a very dramatic RSS reader.

## 2026-07-14 — The micromort has been told to stay in its lane

Events now explain what the risk actually is, how serious the product thinks it is, why, whether it is still unfolding, and when it should politely vanish. Live Risk Pressure gets its own transparent 0–100 lane, while the 0.87 µmort reference remains gloriously unimpressed by rain, protests, and our opinions. Twenty-eight tests passed, desktop and mobile survived inspection, and an electrical hazard is no longer introduced as traffic with a straight face.

## 2026-07-14 — Production has received the memo

The schema, classifiers, frontend and refresh jobs are now live instead of merely looking confident on a laptop. Legacy hospital and Yamuna stories were re-taught their proper risk types, the live API held the micromort baseline steady, and current Delhi heat plus spectacularly rude air produced an inspectable 48/100 pressure score. GDELT brought a 429 to the launch party and Netlify brought a credit warning, because apparently every deployment requires two small bureaucratic goblins.

## 2026-07-14 — The cron has left the building

Netlify can keep the pretty frontend, but it no longer gets to hold the data pipeline hostage with a tiny credit meter. The five-minute and two-hour refreshes now live beside the database as Supabase Edge Functions, summoned by Postgres Cron with their keys tucked into Vault. GitHub Actions was politely rejected after doing the maths: 8,640 private runner-minutes a month is not a free scheduler, it is a bill wearing an octocat costume.

## 2026-07-14 — The map went to Cupertino, briefly

Every important surface now behaves like one glass system instead of a committee of unrelated beige rectangles. The popup has been widened, taught to wrap, and told not to hide behind the event rail. Live blips finally glow like they mean it, while recent high-risk incidents get a hollow coral aura at their actual coordinates. The text is darker by day, brighter by night, and no longer playing camouflage with the map. Even the 390-pixel layout has stopped stacking cards on top of each other like a panicked waiter.

## 2026-07-14 — The duplicate cron has been evicted

The credits returned, the cleanup deploy went through, and Netlify has officially been relieved of its two accidental moonlighting jobs. Both old refresh endpoints now answer with a crisp 404, while Supabase Cron continues doing the actual work at five-minute and two-hour intervals. Netlify serves glass; Supabase collects risk; everyone has finally read the org chart.

## 2026-07-14 — The baseline card has stopped eating the headline

Short desktop windows were letting the baseline card climb into the title like it paid rent there. The two left-side cards now form a tidy row beneath the header when vertical space is scarce, while normal desktops keep their original stack. Twenty-two pixels of breathing room: not glamorous, but extremely visible when missing.

## 2026-07-14 — The tidy row was, in fact, a barricade

The first overlap fix solved the headline by parking Live Risk Pressure directly on top of the map’s clickable center, which is an impressively literal way to reduce risk visibility. The row is gone. Short desktops now scroll, the cards stay in their narrow left lane, and a real Mayur Vihar blip click—not a hopeful screenshot—opens its popup.
