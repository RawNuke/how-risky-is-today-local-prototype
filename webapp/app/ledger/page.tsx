import type { Metadata } from "next";
import { SubpageShell } from "@/components/subpage-shell";

export const metadata: Metadata = { title: "Accountability ledger" };

const ledgerRows = [
  { role: "Road-owning agency", status: "Unknown", items: 2, followUp: "Evidence required" },
  { role: "Local civic authority", status: "Reported", items: 1, followUp: "Response requested" },
  { role: "Electrical utility", status: "Disputed", items: 1, followUp: "Attribution review" },
];

export default function LedgerPage() {
  return (
    <SubpageShell
      eyebrow="PUBLIC ACCOUNTABILITY LEDGER"
      title="Responsibility needs evidence."
      intro="Authorities appear only with a stated role, an attribution status and a traceable evidence basis. A default mapping is never treated as fact."
    >
      <section className="ledger-table" aria-label="Evidence-based authority roles">
        <div className="index-head">
          <span>AUTHORITY ROLE</span><span>ATTRIBUTION</span><span>ITEMS</span><span>NEXT ACTION</span>
        </div>
        {ledgerRows.map((row) => (
          <article key={row.role}>
            <strong>{row.role}</strong>
            <span>{row.status}</span>
            <span>{row.items}</span>
            <p>{row.followUp}</p>
          </article>
        ))}
      </section>
    </SubpageShell>
  );
}
