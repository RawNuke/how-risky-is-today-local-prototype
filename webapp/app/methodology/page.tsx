import type { Metadata } from "next";
import { SubpageShell } from "@/components/subpage-shell";

export const metadata: Metadata = { title: "Methodology" };

export default function MethodologyPage() {
  return (
    <SubpageShell
      eyebrow="METHOD · VERSION 0.2"
      title="Known. Estimated. Missing."
      intro="This internal artifact maps recent, location-specific risk events. News is supporting evidence, not a generic content feed, and it never changes the separate mortality baseline."
    >
      <section className="method-grid">
        <article id="baseline">
          <span>01</span>
          <h2>Official baseline</h2>
          <p>
            One micromort is a one-in-a-million chance of death for a specified exposure and population. The 0.87 µmort fixture is the worked conversion of an annual 31.7-per-100,000 reference rate into an average day. It is not a personal forecast or an exact measure for today, and it remains marked as reconciliation-pending until the exact official table, numerator, denominator and geography definition pass the source audit.
          </p>
        </article>
        <article id="coverage">
          <span>02</span>
          <h2>Recent signal coverage</h2>
          <p>
            Newspaper RSS, GDELT, IMD CAP and NDMA/SACHET are scanned automatically. A story appears only when the system finds both a relevant risk mechanism and a specific Delhi/NCR venue or neighbourhood that can be plotted.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Live Risk Pressure</h2>
          <p>
            Live Risk Pressure is a transparent product indicator built from current precipitation, apparent heat, air quality, and the severity and freshness of active events. It can also recognise compounding conditions, such as rain occurring alongside a road closure or flood event. It describes relative pressure in the current conditions; it is not a probability of death and never adjusts the 0.87 µmort baseline.
          </p>
        </article>
        <article>
          <span>04</span>
          <h2>Event intelligence</h2>
          <p>
            Each accepted event is assigned a risk type, a plain-English consequence, and a severity from low through guarded, elevated, high and severe. The displayed reason is intended to make that assessment inspectable. These labels are product interpretation, not official emergency classifications.
          </p>
        </article>
        <article>
          <span>05</span>
          <h2>Live and static events</h2>
          <p>
            Ongoing conditions such as severe weather, flooding, protests and closures can be marked live and remain visible only while their expiry window is current. One-off incidents are static and may remain in the public index for up to seven days before expiring. A pulsing map point means ongoing; a still point means a one-off report.
          </p>
        </article>
        <article>
          <span>06</span>
          <h2>Update rhythm</h2>
          <p>
            Delhi weather, air quality, newspaper RSS and official alerts refresh every five minutes. A broader GDELT discovery run remains every two hours. Source URLs are deduplicated; irrelevant and unlocated stories are removed before the browser receives them.
          </p>
        </article>
      </section>
    </SubpageShell>
  );
}
