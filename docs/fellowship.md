# Fellowship submission dossier and Word-document brief

## Project: *How Risky Is Today? — A Public-Interest Risk and Accountability Atlas for Delhi-NCR*

**Live prototype:** https://how-risky-is-today-delhi.netlify.app  
**Project owner and policy researcher:** Raunaq Sharma  
**Purpose of this file:** This is the authoritative content and instruction document for preparing a polished fellowship artifact in Microsoft Word. It combines the project's policy vision, development story, current functionality, intellectual contribution, limitations, suggested evidence, and detailed writing instructions.

---

## 1. Instructions to Claude: read this before writing anything

Use this document to prepare a compelling, accessible fellowship submission about *How Risky Is Today?* The final artifact should be a **policy-design case study and concept note**, not a software report and not a conventional startup pitch.

The applicant is a **policy researcher, not a software engineer**. The fellowship reviewers are expected to care primarily about:

- the quality and originality of the idea;
- the public-policy problem being addressed;
- the applicant's reasoning and vision;
- the evolution of the concept in response to evidence and ethical concerns;
- the ability to translate a policy idea into a functioning prototype;
- the project's possible public value;
- the applicant's intellectual ownership, judgment, persistence, and capacity to learn.

Do not organize the document around programming languages, databases, deployment infrastructure, or code. Technical details may appear briefly when they demonstrate feasibility, but they must remain subordinate to the policy story.

The recommended final form is:

- a **6–8 page main paper**, approximately 2,500–3,500 words;
- written in clear, confident first-person prose where appropriate;
- created in Word and exported to PDF for submission;
- supplemented by 3–5 carefully selected and captioned prototype screenshots;
- linked prominently to the live prototype;
- followed, if space permits, by a short evidence appendix that is not counted as part of the main narrative.

The final paper should read as though the applicant is saying:

> I identified an underexamined public problem, developed a responsible way of framing it, tested that framing through a functioning prototype, revised the concept when the evidence did not support stronger claims, and now want to develop it into a more rigorous public-interest research and accountability tool.

Do not present the applicant as having personally written every line of code. Do not diminish the applicant by describing the project as something an AI “made for him,” either. The accurate framing is that the applicant originated the policy concept, defined the desired experience and guardrails, made the substantive decisions, evaluated iterations, and used AI-assisted development tools to turn the concept into a working prototype. This is best described as **policy-led, AI-assisted prototyping**.

### Non-negotiable accuracy rules for the final document

1. Do not call the prototype an official warning system, an emergency service, or a personal mortality calculator.
2. Do not say that it predicts whether a particular person will die today.
3. Do not imply that news reports form a complete incident registry.
4. Do not imply that the current 0.87 micromort reference has completed its official source audit. It remains a worked reference conversion whose exact official table, year, geography, numerator, and denominator require final reconciliation.
5. Do not call the 0–100 Live Risk Pressure score an official threshold or a probability of death. It is an inspectable product indicator.
6. Do not state that an institution is responsible for a particular incident unless the evidence supports that attribution. The project's intended accountability model distinguishes reported, alleged, confirmed, disputed, and unknown responsibility.
7. Do not invent statistics, sources, user numbers, partnerships, impact, interviews, or government adoption.
8. Treat automated event matches as source-linked leads that can be incomplete, delayed, duplicated, or wrong.
9. If using any numerical claim from the early project research, independently verify its source before retaining it in the final fellowship paper.
10. Do not overwhelm the reader with implementation chronology or technical jargon. Every paragraph should advance the policy argument, the design rationale, or the applicant's development story.

---

## 2. Recommended title, subtitle, and one-line description

### Recommended title

**How Risky Is Today? Designing a Public-Interest Risk and Accountability Atlas for Delhi-NCR**

### Optional subtitle

**A policy-led prototype for making routine urban hazards visible, contextual, and institutionally traceable**

### One-line description

*How Risky Is Today?* is an experimental Delhi-NCR risk atlas that places a stable mortality reference, current environmental conditions, and recent location-specific hazard signals in one public-facing interface—while keeping those forms of evidence clearly separate and traceable.

### Short fellowship description

This project investigates a simple but difficult public-policy question: how can routine urban dangers be communicated in a way that is understandable to ordinary people without producing false precision or sensationalism? The prototype combines a carefully caveated mortality reference with current weather, air quality, official alerts, and location-specific news signals. It also explores how preventable hazards might be connected to the institutions responsible for prevention, response, or remediation. The result is not an official risk forecast; it is a policy-design experiment in public risk communication, evidence transparency, and civic accountability.

---

## 3. The applicant's original vision

The project began with dissatisfaction about how the public perceives and discusses danger. Dramatic and violent events receive concentrated attention, while routine and often preventable risks—road crashes, unsafe infrastructure, exposed electrical systems, open drains and manholes, flooding, fires, and other civic hazards—can become normalized as background conditions of urban life.

The original insight was not simply that these hazards exist. It was that public understanding of risk is shaped by the **visibility and emotional intensity of events**, rather than only by their frequency, scale, preventability, or institutional causes. A spectacular event can dominate public attention, while recurring hazards may be treated as isolated accidents even when they reveal a persistent governance failure.

The applicant's vision was therefore to create a public-facing product that could answer three connected questions:

1. **What does ordinary, everyday risk look like when expressed in understandable terms?**
2. **What is happening around Delhi-NCR now that may affect safety or movement?**
3. **When a hazard is preventable, what institution had a relevant duty, and what evidence exists about its response?**

The ambition was to move beyond a conventional news map. A news map shows that something happened. This project asks a more structured set of questions:

- What is the risk mechanism?
- Where is the exposure located?
- Who or what activity might be affected?
- Is the event ongoing or historical?
- What is known, estimated, or still missing?
- Is there a plausible institutional responsibility?
- What evidence would be needed to make that responsibility public fairly?

This is why the prototype combines risk communication with accountability. The atlas is intended to help users see routine hazards not only as unfortunate events but, where evidence permits, as outcomes connected to infrastructure, administrative responsibility, public duties, and remediation.

The project is Delhi-NCR-first by design. A geographically bounded pilot makes it possible to confront the real challenges of inconsistent data, overlapping jurisdictions, different government agencies, incomplete news coverage, and neighbourhood-level location matching. The long-term idea could be extended elsewhere, but the prototype does not pretend that scaling is merely a matter of adding more cities.

---

## 4. The public-policy problem

### 4.1 Routine risk is often invisible

People do not experience policy through datasets. They experience it through a flooded route, a dangerous intersection, a broken streetlight, an exposed cable, a fire, an unsafe building, or a disruption that changes how they can move through the city. Yet official statistics are usually retrospective and aggregated, while immediate information is scattered across news reports, alerts, and agency communications.

This creates a communication gap. Annual statistics can show the overall scale of harm but are too abstract to describe current conditions. News can show current events but is selective, uneven, and driven by newsworthiness. Weather and air-quality feeds describe environmental conditions but do not by themselves explain institutional or mobility consequences. None of these sources should be treated as interchangeable.

### 4.2 Public fear and policy priority can diverge

Risk perception is shaped by familiarity, control, vividness, and media attention. A familiar daily danger can seem normal, while a rare and dramatic danger may seem omnipresent. This matters for policy because public pressure, administrative attention, and resource allocation can follow what is visible rather than what is recurrent or preventable.

The project does not claim to solve that imbalance with a single score. Instead, it explores how design can make routine hazards more legible while also showing the uncertainty behind every claim.

### 4.3 Urban accountability is fragmented

Delhi-NCR presents an unusually difficult accountability environment. Roads, drains, power distribution, policing, land, building regulation, public transport, highways, and disaster response may involve different authorities. Even the apparently simple question “who was responsible?” can require establishing asset ownership, contractor roles, official findings, jurisdiction, and whether an allegation has been confirmed or disputed.

A responsible accountability tool therefore cannot automatically assign blame based only on the category of an incident. It must distinguish:

- the institution that owns or maintains an asset;
- the institution responsible for regulation or enforcement;
- a private contractor, utility, organizer, or property owner;
- the institution responsible for emergency response;
- reported or alleged responsibility;
- officially confirmed responsibility;
- disputed or still-unknown responsibility.

The prototype's accountability ledger is an early demonstration of this vision. Its central principle is: **responsibility needs evidence**.

### 4.4 Data that looks precise may still be misleading

The project's early concept considered district-, age-, sex-, and activity-specific daily mortality estimates adjusted by recent events. During review, this was judged more precise than the available evidence could support. Official sources do not necessarily provide every required cross-tabulation or exposure denominator, and a sample of news reports cannot be treated as a complete surveillance system.

This realization materially changed the product. Instead of forcing all information into one personalized mortality number, the current prototype separates:

1. a stable mortality reference;
2. current environmental conditions;
3. recent source-linked risk events; and
4. a separate current-conditions indicator called Live Risk Pressure.

That change is a crucial part of the fellowship story. The applicant did not merely build the first idea. He revised the concept when the evidence showed that a stronger claim would be irresponsible.

---

## 5. The central conceptual contribution

The project's main contribution is a **layered model of risk communication**. It does not collapse fundamentally different evidence into one apparently authoritative number.

### Layer 1: A stable mortality reference

The prototype currently displays `0.87 micromorts per average day` as a worked reference conversion. One micromort represents a one-in-a-million risk of death for a specified population or exposure. The unit can make very small risks more comprehensible, but it must be explained carefully.

In the prototype, this reference is:

- a conversion of an annual rate into an average-day unit;
- not a prediction of deaths today;
- not a personalized forecast;
- not silently altered by weather or headlines;
- explicitly marked as requiring final source reconciliation.

The long-term research objective is to replace the worked reference with a fully reconciled Delhi-specific official baseline whose source table, numerator, denominator, year, geography, grain, and limitations are documented.

### Layer 2: Live environmental conditions

The atlas displays current Delhi conditions including:

- temperature and apparent heat;
- precipitation and rain;
- cloud cover;
- wind;
- air quality;
- daylight or nighttime conditions.

These conditions change the map's context and atmosphere. Rain, haze, heat, road strain, and quieter conditions are represented visually, helping the interface feel connected to the city as it exists at that moment. However, the environmental readings do not silently change the stable micromort reference.

### Layer 3: Located risk events

The system scans a set of news and official-alert sources for recent events. A story is eligible to appear only if it has both:

- a plausible current risk mechanism, such as a collision, closure, congestion, waterlogging, severe weather, fire, assault, drowning, protest disruption, or institutional safety failure; and
- a plotable Delhi-NCR venue or neighbourhood.

Generic political commentary, cultural coverage, schemes, retrospectives, administrative follow-ups, and unlocated stories are intentionally excluded. Relevance is more important than making the map appear busy.

Every displayed event retains its publisher attribution and direct source link. Each event may include:

- a risk type;
- a plain-language explanation of the possible consequence;
- an interpreted severity level;
- the reason for that severity;
- whether the event is ongoing (`live`) or a one-off report (`static`);
- its location and age;
- its original source.

These records remain automated leads, not independently verified facts. The interface tells users to open the original source when relying on a specific claim.

### Layer 4: Live Risk Pressure

Live Risk Pressure is a separate 0–100 product indicator that summarizes current conditions. It draws on current precipitation, apparent heat, air quality, the severity and freshness of active events, and explicit interactions such as rain occurring alongside a flood or road-disruption signal.

Its purpose is to answer a modest question: **how much current risk pressure appears to be present in the information available to the system?**

It is not:

- a probability of death;
- an official emergency classification;
- an actuarial score;
- a replacement for agency alerts;
- a modification of the stable mortality reference.

The indicator is inspectable so that users can understand why it is elevated rather than being asked to trust a mysterious score.

### Layer 5: The accountability ledger

The ledger is the project's longer-term policy centerpiece. It is intended to organize preventable or potentially preventable events by the institutions that had a relevant role, while preserving the evidentiary status of any attribution.

The prototype currently demonstrates the structure through authority roles, attribution status, item counts, and follow-up actions. It should not yet be presented as a comprehensive or fully researched register of institutional negligence.

The envisioned mature ledger would preserve:

- the incident and its source evidence;
- the authority and its precise role;
- whether responsibility is reported, alleged, officially confirmed, disputed, or unknown;
- the official response, if any;
- FIR, compensation, remediation, or investigation status;
- a correction and review history.

The policy principle is that accountability must be traceable and revisable. The system should make institutional responsibility more visible without turning assumptions into accusations.

---

## 6. What the functioning prototype currently does

As of 14 July 2026, the project has a functioning browser-based prototype available at:

**https://how-risky-is-today-delhi.netlify.app**

The prototype is best understood as an experimental public-interest presentation artifact. It demonstrates that the policy concept can be translated into an operational interface, but it is not ready to be relied on as a public safety service.

### 6.1 Interactive Delhi-NCR atlas

The main interface provides an interactive map of Delhi-NCR. Users can:

- view recent location-specific event markers;
- click markers to open event details;
- read a source-linked event rail;
- distinguish ongoing events from one-off reports;
- see current environmental context;
- view separate baseline and Live Risk Pressure explanations;
- navigate to the event index, accountability ledger, and methodology.

The interface is responsive on desktop and mobile. It changes between daylight and nighttime presentation and uses reduced-motion and reduced-transparency fallbacks for accessibility preferences.

### 6.2 Automated environmental and event refreshes

The prototype has a recurring data pipeline. Current weather, air quality, selected newspaper feeds, and official alerts are refreshed frequently, while a broader discovery process runs less frequently. The active source set includes selected Delhi reporting and official alert feeds, with GDELT used for wider discovery.

The final fellowship paper does not need to describe the scheduling or infrastructure in depth. The policy-relevant point is that this is not a static mock-up: it can ingest current information and update the public interface automatically.

### 6.3 Risk-and-location filtering

The system applies deterministic filtering to prevent the atlas from becoming a generic feed of Delhi news. It looks for both a risk mechanism and a location that can be plotted. It also performs source-URL and event-level deduplication and can inspect article metadata for locations absent from a headline.

This illustrates an important design choice: an impressive quantity of points is not the objective. A smaller number of explainable, relevant points is more valuable than visually dense but misleading coverage.

### 6.4 Expiry and event behaviour

Ongoing conditions such as severe weather, waterlogging, protests, or closures can be marked as live and remain visible only while their expiry window is current. One-off incidents are treated as static and expire from the public view after a limited period. This helps prevent an old event from continuing to look like a present danger.

### 6.5 Source transparency

Every event links to its source. The prototype displays limited headline-level metadata rather than reproducing full articles. This supports traceability while recognizing that the original publisher remains the source of the reporting.

### 6.6 Methodology in the interface

The methodology page is organized around the phrase **“Known. Estimated. Missing.”** It explains:

- what a micromort means and does not mean;
- the status of the stable reference;
- what sources are scanned;
- how Live Risk Pressure is interpreted;
- how event severity and behaviour are assigned;
- how often information is refreshed;
- where uncertainty remains.

This is not ancillary documentation. The methodology is part of the public product because uncertainty should be visible where the claims are presented.

### 6.7 Verification already conducted

The working prototype has undergone automated and visual checks. At the current project checkpoint:

- 28 automated risk-intelligence tests passed;
- code-quality checks passed;
- a production build completed successfully;
- desktop and mobile layouts were visually inspected;
- popup behaviour, text wrapping, map interactions, and short-screen layouts were tested;
- the live application and methodology route returned successfully in production;
- production data-refresh functions were confirmed to write to the database, including graceful partial operation when a discovery source was rate-limited.

Do not devote significant space to these facts in the main paper. A concise sentence can show that the artifact is functional and tested. More detail may be placed in the appendix.

---

## 7. How the idea evolved—and why that evolution matters

The development process is one of the strongest parts of the fellowship narrative. It demonstrates policy judgment, willingness to revise, and the difference between building an attractive interface and making a defensible public claim.

### Stage 1: The initial question

The project began with the question of whether everyday mortality risk could be made more understandable through a daily risk index for Delhi-NCR. The early concept used micromorts because a one-in-a-million unit can help people compare risks that are otherwise difficult to comprehend.

### Stage 2: An accountability layer

The idea developed beyond abstract risk communication. The applicant wanted the product to identify preventable hazards and make visible which public authority, utility, contractor, or institution had a relevant role. This transformed the concept from a personal-risk interface into a civic-accountability project.

### Stage 3: A more ambitious personalized formula

An early plan considered combining official rates, geography, demographic characteristics, activities, seasonal effects, and recent verified incidents into a single daily score.

This was conceptually attractive but evidentially weak. The required official datasets do not necessarily support all combinations of district, age, sex, cause, and activity. Fatality shares do not provide exposure-normalized travel risk. News reports are not a complete or stable sample of all incidents. Capping a news-derived adjustment would limit its size but would not make it statistically valid.

### Stage 4: The evidence review

The project was therefore reviewed against a stricter standard:

- Does the source actually support the level of precision displayed?
- Is the numerator compatible with the denominator?
- Is the geographic definition consistent?
- Is a news sample being mistaken for a registry?
- Does an authority attribution have an evidence basis?
- Does the interface make uncertainty visible?

This review resulted in a major conceptual correction.

### Stage 5: Separation instead of false synthesis

The current prototype separates the stable mortality reference from live environmental and event information. It also separates Live Risk Pressure from the mortality unit. This avoids presenting a single impressive-looking number that conceals incompatible evidence.

The project retains its ambition, but expresses it more honestly. That is a policy achievement: the applicant chose a less sensational product because it was more defensible.

### Stage 6: From static concept to operating prototype

The concept was then translated into a live, responsive atlas capable of refreshing conditions, discovering source-linked events, filtering for relevance and location, explaining risk interpretation, and demonstrating the accountability ledger structure.

The applicant used iterative AI-assisted development to do this. He provided the policy direction, evaluated outputs, identified misleading or undesirable behaviour, refined the concept, and required evidence, accessibility, and source-transparency safeguards. This process allowed a non-coder to test a policy intervention in working form rather than leaving it as an abstract proposal.

---

## 8. The applicant's role and intellectual ownership

The final fellowship document should make the applicant's contribution clear without exaggerating technical authorship.

The applicant:

- identified the underlying public-policy problem;
- proposed the use of a comprehensible risk unit;
- chose Delhi-NCR as the pilot geography;
- introduced the institutional-accountability dimension;
- defined the requirement that official statistics, environmental readings, and news-derived signals remain distinguishable;
- insisted that claims be traceable to their sources;
- reviewed whether the proposed measurement model was supported by the data;
- accepted and directed a substantial correction away from false personalization;
- specified what the interface should help a member of the public understand;
- evaluated repeated visual and functional iterations;
- used the prototype to test whether the idea could work in practice;
- maintained the long-term vision while narrowing present claims to what the evidence could support.

The development tools assisted with implementation, testing, and iteration. They did not originate the policy question or make the substantive choices independently. A good description is:

> I used AI-assisted development as a research and prototyping instrument. I defined the policy problem, designed the conceptual model and public safeguards, reviewed the evidence, directed the implementation, and repeatedly tested whether the resulting product communicated the intended idea responsibly.

Avoid defensive language about not being a coder. The more useful point is that the applicant crossed disciplinary boundaries and learned how to convert a policy hypothesis into a testable artifact.

---

## 9. Policy significance

### 9.1 Risk communication

The project tests whether small, abstract risks can be made understandable without pretending to know more than the evidence allows. Its layered design offers a possible alternative to both dry statistical dashboards and sensational real-time feeds.

### 9.2 Civic accountability

By linking preventable hazards to evidence about institutional roles, the project could help transform isolated incidents into a structured record of recurring failures, official responses, and remediation.

### 9.3 Public reasoning

The interface encourages users to ask what is known, what is estimated, what is missing, and where a claim came from. That is a form of public-data literacy, not merely information display.

### 9.4 Administrative learning

With stronger data and partnerships, the tool could help reveal repeated locations, risk mechanisms, unresolved responsibilities, source blind spots, and patterns in agency response. These are potential future uses, not current validated outcomes.

### 9.5 A replicable policy-prototyping method

The project also demonstrates a broader method: a policy researcher can use AI-assisted tools to rapidly make an idea concrete, expose hidden assumptions, revise the measurement model, and communicate the proposal to users and decision-makers before seeking the resources for a larger study.

---

## 10. Theory of change

The final paper may present the project's theory of change in a concise table or diagram.

| Stage | Project contribution | Intended effect |
|---|---|---|
| Inputs | Official mortality data, environmental readings, official alerts, source-linked reporting, jurisdiction and authority information | Bring fragmented evidence into a traceable structure |
| Activities | Reconcile rates, discover and filter events, map locations, classify current risk mechanisms, document authority roles and evidence status | Convert scattered information into an understandable public view |
| Immediate outputs | Stable baseline reference, current-condition context, located hazard signals, transparent methodology, accountability ledger | Make routine hazards and evidentiary uncertainty visible |
| Near-term outcomes | Better public understanding, more informed questions, easier tracing of recurring hazards and responsible institutions | Improve the quality of civic discussion and scrutiny |
| Long-term ambition | A validated, versioned, correction-friendly urban risk and accountability observatory | Support prevention, institutional learning, and evidence-based accountability |

The causal claims should remain modest. A prototype can demonstrate an approach; it cannot yet demonstrate changes in public behaviour, government performance, mortality, or resource allocation.

---

## 11. Ethical and methodological guardrails

These guardrails are central to the project's identity and should appear in the main fellowship paper.

### 11.1 No personal prophecy

The project must never tell a person that it knows their individual chance of dying today. Any mortality figure is a population-level reference expressed as an average day.

### 11.2 Separate unlike evidence

Official retrospective statistics, real-time environmental observations, official alerts, and reported events have different strengths and weaknesses. They must not be blended invisibly.

### 11.3 Source every public claim

Rates require exact source provenance. Events retain publisher links. Authority attribution requires an evidence basis and status.

### 11.4 Display uncertainty at the point of use

Limitations should not be hidden in a footnote. The interface should explain what a number or signal does and does not represent.

### 11.5 Avoid automated blame

AI or deterministic rules may suggest a category or possible authority, but they should not publish negligence or institutional responsibility as established fact.

### 11.6 Make correction possible

Automated systems make errors. A mature version should preserve review history, attribution changes, correction dates, source updates, and the reason for substantive edits.

### 11.7 Prefer relevance over visual abundance

An empty or sparse map can be more honest than a dense map of weakly relevant headlines. The system should exclude material that lacks a current risk mechanism or plotable location.

### 11.8 Respect the boundary between information and emergency advice

The atlas is an experimental communication artifact. Users should continue to rely on official emergency and agency channels for warnings, instructions, and immediate assistance.

---

## 12. Known limitations to acknowledge openly

The final document should not hide the following limitations:

1. **Baseline source reconciliation is incomplete.** The current 0.87 micromort reference requires confirmation against an exact official source table and compatible Delhi numerator and denominator.
2. **Automated event coverage is incomplete.** The system sees only the sources it scans and the stories those sources publish.
3. **Automated classification can be wrong.** A story may be misclassified, assigned an imprecise location, duplicated, or missed.
4. **The location gazetteer is limited.** It is intentionally inspectable but does not represent complete Delhi-NCR geocoding.
5. **Source availability varies.** A source such as GDELT may temporarily rate-limit requests; the system can continue partially, but coverage changes.
6. **Severity is interpretive.** The prototype's severity bands are product interpretations, not official emergency categories.
7. **Live Risk Pressure is experimental.** It has not been statistically validated as a predictor of mortality or harm.
8. **The accountability ledger is at an early stage.** Its current entries demonstrate a structure, not a comprehensive or adjudicated record of negligence.
9. **No impact evaluation has yet been conducted.** The project has not established that the interface changes behaviour, administrative response, or public outcomes.
10. **Publisher and operational questions remain.** A broader public or commercial release would require a fuller review of source terms, permissions, moderation, correction, security, and ongoing stewardship.

These limitations should be framed as the next research agenda, not as reasons the prototype lacks value. The purpose of a prototype is to expose what must be researched and governed before scale.

---

## 13. Future research and development agenda

### Priority 1: Reconcile the official mortality baseline

- Identify the exact official table or tables supporting the Delhi-wide acute external-cause rate.
- Record the numerator, denominator, geography, year, grain, and publication date.
- Document what breakdowns are and are not supported.
- Remove or clearly label any fixture until reconciliation passes.

### Priority 2: Develop an evidence-based accountability dataset

- Separate source articles from incidents.
- Allow multiple sources to support one incident.
- Record multiple institutions and distinct roles where necessary.
- Track reported, alleged, confirmed, disputed, and unknown attribution.
- Record official response, remediation, compensation, investigation, and corrections.

### Priority 3: Improve local coverage

- Evaluate reliable smaller Delhi-NCR publications and civic or transport sources.
- Measure source health, geographic bias, language bias, duplicate rates, and review burden.
- Add feeds only after confirming that they work and that their use is appropriate.

### Priority 4: Add human review and governance for public use

- Establish a review protocol for incident publication and authority attribution.
- Create a visible corrections process.
- Define retention periods and standards for sensitive incidents.
- Develop clear editorial and moderation responsibility.

### Priority 5: Validate the current-conditions indicator

- Test whether the components and weights are understandable and useful.
- Compare the indicator with official incident or disruption series where available.
- Avoid making predictive claims until validation supports them.

### Priority 6: Conduct user and stakeholder research

- Test comprehension with Delhi residents.
- Interview journalists, civic groups, public-health experts, disaster-risk researchers, transport researchers, and relevant officials.
- Examine whether users distinguish the stable baseline from current signals.
- Test whether the interface improves understanding or instead increases anxiety.

### Priority 7: Evaluate responsible expansion

- Determine whether the model transfers to another city only after establishing a repeatable source audit, jurisdiction map, correction system, and stewardship model.
- Treat each city as a separate evidence and governance problem rather than a cosmetic map expansion.

---

## 14. Recommended structure for the final Word/PDF artifact

Claude should use the following structure unless the fellowship supplies a more specific format.

### Cover page

- Title and optional subtitle.
- Applicant's name.
- One-sentence description.
- A strong screenshot of the live atlas.
- Clickable prototype URL and QR code.
- Small label: “Experimental policy prototype; not an official warning service.”

### Page 1: Executive summary

Open with the public problem and the applicant's central insight, not with software. Explain the project in approximately 250–350 words. End by stating what the live prototype demonstrates and what the fellowship would help develop next.

### Pages 2–3: Problem and vision

Explain:

- the invisibility of routine preventable hazards;
- the mismatch between annual statistics and current scattered information;
- the need to communicate risk without false precision;
- the connection between public risk and institutional accountability;
- why Delhi-NCR is a meaningful pilot geography.

Include the three core questions from Section 3.

### Pages 3–4: The proposed model

Explain the layers:

1. stable mortality reference;
2. environmental conditions;
3. located risk events;
4. Live Risk Pressure;
5. accountability ledger.

Use a simple diagram. The most important visual relationship is that the mortality baseline remains separate from current signals and Live Risk Pressure.

### Pages 4–5: From idea to functioning prototype

Describe the project's evolution from a daily risk concept to a more responsible, layered system. Explain the correction away from unsupported personalization. Present AI-assisted development as a prototyping method directed by the applicant.

Add 2–3 annotated screenshots. Captions should explain the policy purpose of each screen rather than its visual styling.

### Page 6: Policy value and theory of change

Explain the possible value for risk communication, civic scrutiny, public-data literacy, and administrative learning. Keep claims prospective. A compact theory-of-change table may be included.

### Page 7: Limitations and research agenda

Demonstrate maturity by clearly stating what is unfinished. Highlight baseline reconciliation, news-sample limitations, attribution governance, user research, and validation.

### Page 8: Conclusion and fellowship fit

End with the applicant's broader motivation: using policy research, responsible data communication, and rapid prototyping to make neglected public problems visible and actionable. Connect the fellowship to the next phase without inventing the fellowship's values. If the application provides selection criteria, revise this section to address them directly.

### Optional appendix

- Prototype feature table.
- Evidence and methodology guardrails.
- Short development timeline.
- Current functionality versus future work.
- Test and verification summary.
- Selected internal-file references.
- Full clickable prototype URL and QR code again.

---

## 15. Recommended figures and screenshots

The final document should include only visuals that help a reviewer understand the idea quickly.

### Figure 1: Main atlas view

Show the interactive map, stable baseline, Live Risk Pressure, and recent event rail together.

**Suggested caption:**  
*The prototype separates a stable mortality reference from current environmental and event pressure. Located events retain source links and are displayed as current signals rather than as a hidden adjustment to the mortality baseline.*

### Figure 2: Event detail or popup

Show a selected event with its location, risk type, severity explanation, timing, and source link.

**Suggested caption:**  
*An event is presented only when the system identifies both a relevant risk mechanism and a plotable Delhi-NCR location. The interpretation is inspectable and links back to the original publisher.*

### Figure 3: Methodology page

Show the “Known. Estimated. Missing.” page.

**Suggested caption:**  
*Methodological uncertainty is treated as part of the public interface. The prototype explains what the baseline, current signals, and product-defined pressure score do—and do not—mean.*

### Figure 4: Accountability ledger

Show the evidence-status approach to institutional responsibility.

**Suggested caption:**  
*The proposed accountability layer records authority roles and attribution status rather than treating a default institutional mapping as proof of responsibility.*

### Figure 5: Conceptual architecture

Create a clean, non-technical diagram:

```text
OFFICIAL ANNUAL DATA ──> STABLE MORTALITY REFERENCE

WEATHER + AIR + ALERTS + SOURCE-LINKED EVENTS ──> CURRENT CONDITIONS
                                                    │
                                                    └──> LIVE RISK PRESSURE

REVIEWED INCIDENT EVIDENCE + JURISDICTION ──> ACCOUNTABILITY LEDGER
```

Add a visible note: **These layers inform one interface but are not treated as equivalent evidence.**

Do not include code screenshots, database dashboards, terminal windows, deployment logs, or large architecture diagrams in the main paper.

---

## 16. What internal project material should and should not be shared

The reviewer should not receive the entire working folder. It contains old plans, technical implementation material, quality-assurance evidence, local tooling, and working notes that are useful for development but distracting in a fellowship review.

### Suitable material for a curated appendix or supplementary folder

- the final fellowship PDF;
- selected screenshots of the functioning prototype;
- a PDF copy of the final methodology summary;
- a one-page theory of change;
- a one-page project timeline;
- a concise “current versus future” feature table;
- a short verification note;
- the live prototype link;
- optionally, a sanitized public project overview.

### Material that should not be included by default

- raw source-code folders;
- environment-variable files or database configuration;
- internal deployment identifiers and logs;
- obsolete implementation plans;
- the candid build diary;
- dozens of repetitive QA screenshots;
- raw database migrations;
- internal source-health or security details;
- any credential, token, private URL, or sensitive operational information.

### Existing project files and their proper use

| Existing material | Use when drafting | Share with reviewers? |
|---|---|---|
| Root `README.md` | Current factual source of truth about prototype status | No; extract relevant facts into the paper |
| `PROJECT.md` | Original concept and early research history | No; it contains superseded assumptions and unfinished source claims |
| `PLAN-REVIEW.md` | Evidence of how the concept was corrected | Usually no; narrate the correction in the paper |
| `webapp/app/methodology/page.tsx` | Source for current methodology wording | No; show the public methodology page instead |
| `design-qa/` and `webapp/qa-evidence/` | Select 2–4 strong screenshots | Only selected, captioned images |
| `rants.md` | Internal development chronology and context | No |
| Application source code | Proof that a real implementation exists | Only if specifically requested by the fellowship |

If the fellowship accepts only one artifact, submit the PDF. The PDF should contain the live prototype link. If supplementary links are allowed, link to a small read-only evidence folder rather than the raw project directory.

---

## 17. Suggested “current versus future” table

| Dimension | What the prototype currently demonstrates | What a mature version requires |
|---|---|---|
| Mortality reference | A clearly separated worked micromort conversion | Exact Delhi official-source reconciliation and versioned provenance |
| Environment | Current weather and air-quality context | Source monitoring, long-term archive, and clearer uncertainty |
| Event discovery | Automated source-linked Delhi-NCR risk leads | Measured coverage, multilingual/local sources, and human review governance |
| Location | Inspectable neighbourhood and venue matching | More complete geocoding and systematic location confidence |
| Severity | Explainable product-defined bands | Validation with experts, users, and official event series |
| Live Risk Pressure | Transparent current-conditions indicator | Empirical validation and user-comprehension testing |
| Accountability | Demonstration of roles and attribution status | Evidence-backed incident-authority records and correction workflow |
| Public value | Working proof of concept | User research and impact evaluation |

---

## 18. Suggested development timeline

Keep this high-level. The objective is to show intellectual progression, not a list of technical tasks.

1. **Problem identification:** explored the mismatch between public fear, routine urban hazards, and the visibility of preventable risks.
2. **Concept formation:** proposed a Delhi-NCR daily risk interface using micromorts and an accountability layer.
3. **Evidence and feasibility review:** examined official data, live reporting sources, jurisdictional complexity, and the limits of personalization.
4. **Conceptual correction:** separated stable mortality reference, environmental context, event signals, and current-condition pressure.
5. **Prototype development:** used AI-assisted implementation to build an interactive, source-linked atlas.
6. **Iteration and testing:** refined relevance filters, location matching, event behaviour, accessibility, mobile presentation, methodology, and system reliability.
7. **Next research phase:** reconcile the official baseline, develop human review and accountability governance, expand source coverage responsibly, and test the interface with users and domain experts.

---

## 19. Recommended tone and narrative style

The final paper should be:

- intellectually ambitious but empirically modest;
- personal enough to show motivation and ownership;
- clear enough for a non-technical reviewer;
- candid about limitations;
- confident without calling the prototype revolutionary;
- policy-centered rather than startup-centered;
- specific about what was built;
- careful to distinguish demonstration from validated impact.

Prefer language such as:

- “I wanted to investigate…”
- “The prototype tests whether…”
- “The evidence review showed…”
- “I revised the model because…”
- “The current artifact demonstrates…”
- “A mature version would require…”
- “The purpose is not to predict an individual's fate, but to…”
- “The project treats uncertainty as part of the interface rather than as a footnote.”

Avoid language such as:

- “I built an AI that knows how dangerous today is.”
- “The app calculates your exact death risk.”
- “Real-time data proves…”
- “The system holds negligent agencies accountable” as an already-achieved outcome.
- “The algorithm objectively determines severity.”
- “This will save lives” without evidence.
- “AI created the whole project.”
- “I coded the full stack myself” if that is not accurate.

---

## 20. Suggested opening narrative

Claude may adapt the following opening rather than copying it mechanically:

> The dangers that dominate public attention are not always the dangers that most consistently shape everyday life. In Delhi-NCR, a flooded road, an exposed electrical cable, an unsafe intersection, a fire-code failure, or an open drain may appear in the news as a separate incident and then disappear. Official statistics, meanwhile, may document the aggregate harm only months or years later. I began *How Risky Is Today?* by asking whether these disconnected forms of evidence could be made understandable in one public interface—and whether doing so could make preventable risk more institutionally visible.
>
> The first version of the idea was deliberately provocative: express ordinary daily risk through micromorts, a one-in-a-million unit, and relate it to current conditions. Building the prototype forced a more important question: what can the evidence actually support? Official mortality data, weather observations, news reports, and institutional attribution are not equivalent. Combining them into one personalized number would create an appearance of precision that the underlying data could not justify. The project therefore evolved into a layered risk and accountability atlas that keeps these forms of evidence separate while allowing a user to examine them together.

---

## 21. Suggested concluding direction

Claude may adapt the following conclusion:

> *How Risky Is Today?* is not a finished public-warning system, and its value does not depend on pretending that it is. It is a working policy prototype that has already performed an important function: it made an abstract idea concrete enough to test, criticize, and improve. It revealed the limits of available mortality data, the incompleteness of news as surveillance, the evidentiary difficulty of attributing institutional responsibility, and the need to display uncertainty as part of the product itself.
>
> My goal is to develop this experiment into a more rigorous public-interest framework for communicating routine urban risk and documenting preventable harm. The next phase requires deeper source reconciliation, stakeholder and user research, editorial governance, and an evidence-based accountability dataset. The fellowship would allow me to bring together policy research, risk communication, responsible data design, and rapid prototyping to determine not only what such a tool can display, but what it can responsibly claim and how it might contribute to better public reasoning and institutional scrutiny.

Do not state that the fellowship will provide these opportunities unless its actual description supports that claim. Customize the last paragraph to the fellowship's published criteria once those criteria are available.

---

## 22. Final drafting prompt for Claude

The user can paste the following prompt into Claude together with this file:

> Read `fellowship.md` completely and treat it as the authoritative project dossier and writing brief. Prepare a polished Microsoft Word fellowship artifact about *How Risky Is Today? — A Public-Interest Risk and Accountability Atlas for Delhi-NCR*.
>
> Write a 6–8 page, approximately 2,500–3,500 word policy-design case study in an intelligent but accessible style. The audience is a fellowship selection committee interested in the applicant's idea, reasoning, vision, initiative, and ability to translate policy thinking into a working prototype. The applicant is a policy researcher, not a coder, so do not organize the paper around software. Present the project as policy-led, AI-assisted prototyping: the applicant originated and directed the concept, evidence rules, product decisions, review, and iteration, while AI-assisted tools helped implement and test the prototype.
>
> Use the structure recommended in `fellowship.md`: executive summary; problem and vision; layered intervention; evolution from idea to prototype; applicant's role; policy significance and theory of change; limitations and future research; conclusion and fellowship fit. Include a cover page, a clickable live-prototype link, a QR code, 3–5 carefully selected screenshots with policy-focused captions, and an optional concise appendix.
>
> Preserve all accuracy rules and caveats in `fellowship.md`. In particular, do not describe the project as an official warning service or personal mortality calculator; do not treat the 0.87 micromort reference as fully source-reconciled; do not treat Live Risk Pressure as an official or actuarial score; do not treat automated news leads as complete or independently verified; and do not claim institutional responsibility without evidence.
>
> Make the evolution of the concept a strength. Explain that the initial personalized daily-risk ambition was revised after an evidence review showed that the available data could not support that precision. Emphasize that separating the stable baseline, current conditions, event signals, and accountability evidence reflects responsible policy judgment.
>
> Do not invent statistics, citations, partnerships, users, impacts, or fellowship criteria. Flag any fact that still requires verification. Use restrained technical detail only to establish that the prototype is functional and capable of updating current information. Produce polished prose, not bullet-heavy notes. Add a short list of any missing details or sources that should be supplied before the document is considered final.

---

## 23. Final pre-submission checklist

Before submitting the Word/PDF artifact, confirm that:

- [ ] The live prototype URL opens without requiring a login.
- [ ] The URL is clickable and also represented as a QR code.
- [ ] The applicant's name and project title are correct.
- [ ] The opening makes the policy problem clear within the first two paragraphs.
- [ ] The applicant's intellectual contribution is unmistakable.
- [ ] AI assistance is described accurately and confidently.
- [ ] The document does not read like a technical README.
- [ ] The micromort reference is labeled as reconciliation-pending.
- [ ] Live Risk Pressure is described as an experimental product indicator.
- [ ] Automated event signals are not called a complete incident database.
- [ ] Institutional responsibility is framed as evidence-based and status-sensitive.
- [ ] Every numerical claim has been independently checked against its source.
- [ ] No obsolete early-plan claim has been presented as current functionality.
- [ ] Screenshots are current, legible, and captioned.
- [ ] No credentials, private configuration, or sensitive operational information appears.
- [ ] The limitations section is substantive rather than ceremonial.
- [ ] Future plans are described as intentions, not completed achievements.
- [ ] The final section is customized to the fellowship's actual selection criteria.
- [ ] The PDF is visually checked after export from Word.
- [ ] The artifact can be reviewed comfortably in roughly the time required to read a standard academic paper.

---

## 24. Core message to preserve

If the final document preserves only one idea, it should be this:

> *How Risky Is Today?* is an attempt to make routine urban risk visible without making uncertainty disappear. Its innovation is not merely putting live information on a map. It is the decision to show official baselines, current conditions, source-linked events, and institutional accountability together while being explicit that they are different forms of evidence. The functioning prototype demonstrates both the potential of the idea and the research, governance, and validation required to develop it responsibly.

