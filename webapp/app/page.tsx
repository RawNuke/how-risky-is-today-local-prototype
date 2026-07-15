import { RiskAtlas } from "@/components/risk-atlas";
import { fallbackSnapshot } from "@/lib/risk-engine";

export default function Home() {
  const generatedAt = new Date();
  const initialSnapshot = {
    ...fallbackSnapshot,
    signals: process.env.NEXT_PUBLIC_SUPABASE_URL ? [] : fallbackSnapshot.signals,
    generatedAt: generatedAt.toISOString(),
    nextReviewAt: new Date(generatedAt.getTime() + 5 * 60 * 1000).toISOString(),
  };
  return <RiskAtlas initialSnapshot={initialSnapshot} />;
}
