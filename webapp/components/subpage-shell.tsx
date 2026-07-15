import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";

export function SubpageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="subpage">
      <header className="subpage-header">
        <Link href="/" className="back-link">
          <ArrowLeft size={16} /> LIVE ATLAS
        </Link>
        <nav aria-label="Public pages">
          <Link href="/incidents">SIGNALS</Link>
          <Link href="/ledger">LEDGER</Link>
          <Link href="/methodology">METHOD</Link>
        </nav>
      </header>
      <section className="subpage-hero">
        <p>{eyebrow}</p>
        <h1>{title}</h1>
        <div>
          <p>{intro}</p>
          <Link href="/methodology#coverage">
            COVERAGE & LIMITS <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>
      <div className="subpage-content">{children}</div>
    </main>
  );
}
