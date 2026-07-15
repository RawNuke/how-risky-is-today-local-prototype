import { createClient } from "@supabase/supabase-js";
import type { InspectableRiskSignal, RiskSignal } from "@/lib/risk-engine";

interface PublicSignalRow {
  id: string;
  title: string;
  summary: string;
  category: RiskSignal["category"];
  risk_type: NonNullable<RiskSignal["riskType"]>;
  risk_explanation: string;
  place: string;
  longitude: number | null;
  latitude: number | null;
  severity: RiskSignal["severity"];
  severity_reason: string;
  event_behavior: NonNullable<RiskSignal["behavior"]>;
  source_url: string;
  occurred_at: string | null;
  reviewed_at: string | null;
  expires_at: string;
  status?: "pending" | "verified";
}

function sourceName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source link";
  }
}

export function hasPublicDataConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

function mapRows(rows: PublicSignalRow[]): InspectableRiskSignal[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    riskType: row.risk_type,
    riskExplanation: row.risk_explanation,
    location: row.place,
    sourceName: sourceName(row.source_url),
    sourceUrl: row.source_url,
    occurredAt: row.occurred_at ?? row.reviewed_at ?? new Date(0).toISOString(),
    coordinates:
      typeof row.longitude === "number" && typeof row.latitude === "number"
        ? [row.longitude, row.latitude]
        : null,
    severity: row.severity,
    severityReason: row.severity_reason,
    behavior: row.event_behavior,
    expiresAt: row.expires_at,
    status: row.status === "verified" ? "verified" : "automated",
  }));
}

export async function getSignalFirehose(): Promise<InspectableRiskSignal[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const query = serviceKey
    ? supabase
        .from("signals")
        .select("id,title,summary,category,risk_type,risk_explanation,place,longitude,latitude,severity,severity_reason,event_behavior,source_url,occurred_at,reviewed_at,expires_at,status")
        .in("status", ["pending", "verified"])
        .gt("expires_at", new Date().toISOString())
        .not("longitude", "is", null)
        .not("latitude", "is", null)
    : supabase
        .from("public_verified_signals")
        .select("id,title,summary,category,risk_type,risk_explanation,place,longitude,latitude,severity,severity_reason,event_behavior,source_url,occurred_at,reviewed_at,expires_at")
        .not("longitude", "is", null)
        .not("latitude", "is", null);

  const { data, error } = await query
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) throw error;
  return mapRows((data ?? []) as PublicSignalRow[]);
}
