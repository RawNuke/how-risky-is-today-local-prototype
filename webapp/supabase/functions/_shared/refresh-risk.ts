import { createClient } from "@supabase/supabase-js";
import { chooseScene } from "../../../lib/risk-engine.ts";
import {
  filterLocatedRiskSignal,
  looksPotentiallyRelevant,
  publisherContext,
  signalExpiresAt,
} from "../../../lib/risk-signal-filter.ts";

const DELHI = { latitude: 28.6139, longitude: 77.209 };

type GdeltArticle = {
  url?: unknown;
  title?: unknown;
  domain?: unknown;
  seendate?: unknown;
  [key: string]: unknown;
};

type DiscoveredSource = {
  source_url: string;
  title: string;
  domain: string | null;
  published_at: string | null;
  raw_payload: Record<string, unknown>;
};

const IMD_CAP_FEED = "https://cap-sources.s3.amazonaws.com/in-imd-en/rss.xml";

async function json(url: string, timeoutMs = 7000, retries = 2) {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (response.ok) return response.json();
      lastError = new Error(`${new URL(url).hostname} returned ${response.status}`);
      if (response.status !== 429 && response.status < 500) throw lastError;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error(`${new URL(url).hostname} request failed`);
}

async function text(url: string, timeoutMs = 7000) {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  return response.text();
}

function twoHoursFrom(date: Date) {
  return new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString();
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const fields = ["message", "details", "hint", "code", "status", "statusText"]
      .flatMap((field) => {
        const value = Reflect.get(error, field);
        return value ? [`${field}=${String(value)}`] : [];
      });
    if (fields.length) return fields.join("; ");
  }
  try {
    const serialized = JSON.stringify(error);
    return serialized && serialized !== "{}" ? serialized : "empty error response";
  } catch {
    return String(error);
  }
}

function environmentValue(name: string) {
  const nodeValue = typeof process === "undefined" ? undefined : process.env[name];
  const deno = (globalThis as typeof globalThis & {
    Deno?: { env: { get: (key: string) => string | undefined } };
  }).Deno;
  return nodeValue ?? deno?.env.get(name);
}

function assertNoError(stage: string, error: unknown) {
  if (error) throw new Error(`${stage}: ${errorMessage(error)}`);
}

function gdeltDate(value: unknown) {
  if (!value) return null;
  const raw = String(value);
  const normalized = raw.replace(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
    "$1-$2-$3T$4:$5:$6Z",
  );
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function decodeXml(value: string) {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim();
}

function xmlTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function parsedDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseImdFeed(xml: string): DiscoveredSource[] {
  const ncrTerms = /\b(delhi|new delhi|national capital|ncr|gurugram|gurgaon|noida|ghaziabad|faridabad|haryana|west uttar pradesh)\b/i;
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map((match) => {
      const item = match[1];
      const title = xmlTag(item, "title");
      const sourceUrl = xmlTag(item, "link");
      const description = xmlTag(item, "description");
      const author = xmlTag(item, "author");
      const publishedAt = parsedDate(xmlTag(item, "pubDate"));
      return {
        source_url: sourceUrl,
        title,
        domain: "imd.gov.in",
        published_at: publishedAt,
        raw_payload: {
          feed: "IMD CAP",
          description,
          author,
          publishedAt,
        },
        searchText: `${title} ${description}`,
      };
    })
    .filter((source) => source.source_url && source.title && ncrTerms.test(source.searchText))
    .slice(0, 15)
    .map((source) => ({
      source_url: source.source_url,
      title: source.title,
      domain: source.domain,
      published_at: source.published_at,
      raw_payload: source.raw_payload,
    }));
}

async function articleText(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "How-Risky-Is-Today-Internal-Prototype/0.3",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(6500),
  });
  if (!response.ok) throw new Error(`${new URL(url).hostname} article returned ${response.status}`);
  return publisherContext(await response.text());
}

function chunks<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size));
}

async function probeSupabase(url: string, serviceKey: string) {
  try {
    const response = await fetch(`${url}/rest/v1/signals?select=id&limit=1`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      signal: AbortSignal.timeout(7000),
    });
    const body = await response.text();
    let safeBody = body.slice(0, 300).replaceAll(serviceKey, "[redacted]");
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      safeBody = [parsed.message, parsed.error, parsed.code]
        .filter(Boolean)
        .map(String)
        .join("; ") || safeBody;
    } catch {
      // A short, redacted non-JSON response is still useful diagnostic evidence.
    }
    return `HTTP ${response.status}${safeBody ? `: ${safeBody}` : ""}`;
  } catch (error) {
    return `request failed: ${errorMessage(error)}`;
  }
}

export async function refreshRisk() {
  const started = new Date();
  const runId = `risk-${started.toISOString().slice(0, 13).replaceAll(":", "-")}`;
  const weatherParams = new URLSearchParams({
    latitude: String(DELHI.latitude), longitude: String(DELHI.longitude),
    current: "temperature_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,weather_code,is_day",
    timezone: "Asia/Kolkata",
  });
  const airParams = new URLSearchParams({
    latitude: String(DELHI.latitude), longitude: String(DELHI.longitude),
    current: "us_aqi,pm2_5", domains: "cams_global", timezone: "Asia/Kolkata",
  });
  const gdeltParams = new URLSearchParams({
    query: '(Delhi OR "New Delhi" OR Gurugram OR Gurgaon OR Noida OR Ghaziabad OR Faridabad)',
    mode: "ArtList",
    maxrecords: "100",
    format: "json",
    sort: "DateDesc",
    timespan: "24h",
  });

  const [weatherPayload, airPayload, gdeltResult, imdResult] = await Promise.all([
    json(`https://api.open-meteo.com/v1/forecast?${weatherParams}`),
    json(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`),
    json(`https://api.gdeltproject.org/api/v2/doc/doc?${gdeltParams}`, 18000, 0)
      .then((payload) => ({ payload, error: null }))
      .catch((error) => {
        const message = errorMessage(error);
        console.warn(JSON.stringify({ feed: "gdelt", status: "degraded", message }));
        return { payload: { articles: [] }, error: message };
      }),
    text(IMD_CAP_FEED, 9000)
      .then((payload) => ({ payload, error: null }))
      .catch((error) => {
        const message = errorMessage(error);
        console.warn(JSON.stringify({ feed: "imd-cap", status: "degraded", message }));
        return { payload: "", error: message };
      }),
  ]);
  const gdeltPayload = gdeltResult.payload;

  const weather = {
    temperatureC: Number(weatherPayload.current?.temperature_2m ?? 0),
    apparentTemperatureC: Number(weatherPayload.current?.apparent_temperature ?? 0),
    precipitationMm: Number(weatherPayload.current?.precipitation ?? 0),
    cloudCover: Number(weatherPayload.current?.cloud_cover ?? 0),
    windKph: Number(weatherPayload.current?.wind_speed_10m ?? 0),
    weatherCode: Number(weatherPayload.current?.weather_code ?? 0),
    isDay: Number(weatherPayload.current?.is_day ?? 0) === 1,
  };
  const air = {
    usAqi: Number.isFinite(Number(airPayload.current?.us_aqi)) ? Number(airPayload.current.us_aqi) : null,
    pm25: Number.isFinite(Number(airPayload.current?.pm2_5)) ? Number(airPayload.current.pm2_5) : null,
  };
  const scene = chooseScene({ ...weather, usAqi: air.usAqi, roadSignalCount: 0 });

  const url = (environmentValue("SUPABASE_URL") ?? environmentValue("NEXT_PUBLIC_SUPABASE_URL"))?.trim();
  const serviceKey = environmentValue("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !serviceKey) {
    console.log(JSON.stringify({ runId, scene, status: "feeds-ok-storage-not-configured" }));
    return;
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const articles: GdeltArticle[] = Array.isArray(gdeltPayload.articles)
    ? gdeltPayload.articles.slice(0, 100)
    : [];
  const gdeltSources: DiscoveredSource[] = articles
    .filter((article) => article?.url && article?.title)
    .map((article) => ({
      source_url: String(article.url),
      title: String(article.title),
      domain: article.domain ? String(article.domain) : null,
      published_at: gdeltDate(article.seendate),
      raw_payload: { ...article, feed: "GDELT" },
    }));
  const imdSources = parseImdFeed(imdResult.payload);
  const sources = [...new Map(
    [...gdeltSources, ...imdSources].map((source) => [source.source_url, source]),
  ).values()];

  const potentialSources = sources
    .filter((source) => looksPotentiallyRelevant(
      `${source.title} ${String(source.raw_payload.description ?? "")}`,
    ))
    .slice(0, 24);
  const enriched = await Promise.all(potentialSources.map(async (source) => {
    const feedContext = String(source.raw_payload.description ?? "");
    if (source.domain === "imd.gov.in") {
      return { source, articleContext: feedContext, articleError: null };
    }
    try {
      return { source, articleContext: await articleText(source.source_url), articleError: null };
    } catch (error) {
      return { source, articleContext: feedContext, articleError: errorMessage(error) };
    }
  }));
  const locatedCandidates = enriched.flatMap((item) => {
    const decision = filterLocatedRiskSignal(
      `${item.source.title} ${String(item.source.raw_payload.description ?? "")}`,
      item.articleContext,
    );
    return decision ? [{ ...item, decision }] : [];
  });
  const seenEvents = new Set<string>();
  const locatedSources = locatedCandidates
    .sort((a, b) => new Date(b.source.published_at ?? 0).getTime() - new Date(a.source.published_at ?? 0).getTime())
    .filter((item) => {
      const key = `${item.decision.location.toLowerCase()}::${item.decision.mechanism}`;
      if (seenEvents.has(key)) return false;
      seenEvents.add(key);
      return true;
    });

  for (const sourceUrls of chunks(sources.map((source) => source.source_url), 50)) {
    const { error: rejectError } = await supabase
      .from("signals")
      .update({ status: "rejected" })
      .in("source_url", sourceUrls);
    assertNoError("hide non-risk discovery headlines", rejectError);
  }

  if (locatedSources.length) {
    const savedSourceRows = locatedSources.map(({ source, articleContext, articleError, decision }) => ({
      ...source,
      raw_payload: {
        ...source.raw_payload,
        articleContext: articleContext.slice(0, 3000),
        articleError,
        riskMechanism: decision.mechanism,
        riskType: decision.riskType,
        riskExplanation: decision.riskExplanation,
        severityReason: decision.severityReason,
        eventBehavior: decision.behavior,
        location: decision.location,
        locationConfidence: decision.locationConfidence,
      },
    }));
    const { data: savedSources, error: sourceError } = await supabase
      .from("source_articles")
      .upsert(savedSourceRows, { onConflict: "source_url" })
      .select("id,source_url");
    assertNoError("save source articles", sourceError);

    const sourceIds = new Map(
      (savedSources ?? []).map((source) => [String(source.source_url), String(source.id)]),
    );
    const candidates = locatedSources.map(({ source, decision }) => ({
      source_article_id: sourceIds.get(source.source_url) ?? null,
      title: source.title,
      summary: decision.riskExplanation,
      category: decision.category,
      risk_type: decision.riskType,
      risk_explanation: decision.riskExplanation,
      place: decision.location,
      longitude: decision.longitude,
      latitude: decision.latitude,
      severity: decision.severity,
      severity_reason: decision.severityReason,
      event_behavior: decision.behavior,
      last_observed_at: started.toISOString(),
      expires_at: signalExpiresAt(decision.behavior, source.published_at, started),
      status: "pending",
      source_url: source.source_url,
      occurred_at: source.published_at,
    }));
    const { error: signalError } = await supabase
      .from("signals")
      .upsert(candidates, { onConflict: "source_url" });
    assertNoError("save automated source leads", signalError);
  }

  const recentCutoff = new Date(started.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const [leadCountResult, roadCountResult] = await Promise.all([
    supabase
      .from("signals")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "verified"])
      .gt("expires_at", started.toISOString())
      .gte("occurred_at", recentCutoff),
    supabase
      .from("signals")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "verified"])
      .gt("expires_at", started.toISOString())
      .eq("category", "road")
      .gte("occurred_at", recentCutoff),
  ]);
  if (leadCountResult.error || roadCountResult.error) {
    const probe = await probeSupabase(url, serviceKey);
    throw new Error(`count automated leads: ${errorMessage(leadCountResult.error ?? roadCountResult.error)}; ${probe}`);
  }
  const finalScene = chooseScene({
    ...weather,
    usAqi: air.usAqi,
    roadSignalCount: roadCountResult.count ?? 0,
  });

  const { error } = await supabase.from("risk_snapshots").upsert({
    run_id: runId,
    generated_at: started.toISOString(),
    next_review_at: twoHoursFrom(started),
    scene: finalScene,
    weather,
    air,
    verified_signal_count: leadCountResult.count ?? 0,
    processing_status: gdeltResult.error || imdResult.error ? "partial" : "complete",
  }, { onConflict: "run_id" });
  assertNoError("save risk snapshot", error);

  console.log(JSON.stringify({
    runId,
    scene: finalScene,
    sourcesConsidered: sources.length,
    potentialRiskItems: potentialSources.length,
    locatedRiskLeads: locatedSources.length,
    sources: { gdelt: gdeltSources.length, imd: imdSources.length },
    status: gdeltResult.error || imdResult.error ? "partial" : "complete",
  }));
}
