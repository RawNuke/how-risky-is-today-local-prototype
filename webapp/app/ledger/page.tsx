import type { Metadata } from "next";
import { SubpageShell } from "@/components/subpage-shell";

export const metadata: Metadata = { title: "Accountability ledger" };

const ledgerRows = [
  { role: "Road-owning agency", status: "Unknown", items: 2, publicRecord: "No public action recorded" },
  { role: "Local civic authority", status: "Reported", items: 1, publicRecord: "Authority response reported" },
  { role: "Electrical utility", status: "Disputed", items: 1, publicRecord: "Role disputed in source" },
];

export default function LedgerPage() {
  return (
    <SubpageShell
      eyebrow="PUBLIC ACCOUNTABILITY LEDGER"
      title="Responsibility needs public evidence."
      intro="An authority appears only when identified journalism, an official statement, or a public jurisdiction or ownership record supports the connection. The ledger records the source basis and publicly reported action; it does not ask a private administrator to decide truth."
    >
      <section className="ledger-table" aria-label="Evidence-based authority roles">
        <div className="index-head">
          <span>AUTHORITY ROLE</span><span>ATTRIBUTION</span><span>ITEMS</span><span>PUBLIC RECORD</span>
        </div>
        {ledgerRows.map((row) => (
          <article key={row.role}>
            <strong>{row.role}</strong>
            <span>{row.status}</span>
            <span>{row.items}</span>
            <p>{row.publicRecord}</p>
          </article>
        ))}
      </section>
    </SubpageShell>
  );
}
