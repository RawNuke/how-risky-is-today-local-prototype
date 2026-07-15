import type { Metadata } from "next";
import { SubpageShell } from "@/components/subpage-shell";
import { getSignalFirehose, hasPublicDataConfig } from "@/lib/public-data";

export const metadata: Metadata = { title: "Located risk events" };
export const dynamic = "force-dynamic";

function eventAge(occurredAt: string) {
  const hours = Math.max(0, Math.round((Date.now() - new Date(occurredAt).getTime()) / 3_600_000));
  if (hours < 1) return "<1 hour";
  if (hours < 24) return `${hours} hours`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export default async function IncidentsPage() {
  const connected = hasPublicDataConfig();
  const signals = connected ? await getSignalFirehose().catch(() => []) : [];

  return (
    <SubpageShell
      eyebrow="LOCATED RISK EVENT INDEX"
      title="What may affect movement or safety."
      intro="Only recent events with a relevant risk mechanism and a plotable Delhi/NCR location appear here. Every event links back to its original source."
    >
      <section className="signal-index" aria-label="Recent automated news and alert leads">
        <div className="index-head">
          <span>TYPE</span><span>PLACE</span><span>AGE</span><span>STATUS</span>
        </div>
        {signals.map((signal) => (
          <article key={signal.id}>
            <div>
              <i className={`severity-${signal.severity}`} />{" "}
              <strong>
                <a href={signal.sourceUrl} target="_blank" rel="noreferrer">
                  {signal.title}
                </a>
              </strong>
            </div>
            <p>{signal.location}</p>
            <time dateTime={signal.occurredAt}>{eventAge(signal.occurredAt)}</time>
            <span>{signal.behavior === "live" ? "LIVE" : "STATIC"}</span>
            <p className="index-summary">
              <strong>{signal.riskType.replaceAll("-", " ")}</strong> · {signal.severity}
              <br />
              {signal.riskExplanation}
              <br />
              <span>{signal.severityReason}</span>{" "}
              <a href={signal.sourceUrl} target="_blank" rel="noreferrer">
                Open {signal.sourceName}
              </a>
            </p>
          </article>
        ))}
        {signals.length === 0 ? (
          <p className="honesty-note">No automated Delhi/NCR leads have arrived yet.</p>
        ) : null}
      </section>
      <p className="honesty-note">
        Internal prototype feed. Headlines can be incomplete, duplicated, delayed or wrong; use the source link when presenting a specific claim.
      </p>
    </SubpageShell>
  );
}
