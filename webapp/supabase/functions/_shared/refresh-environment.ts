import { createClient } from "@supabase/supabase-js";
import { chooseScene } from "../../../lib/risk-engine.ts";
import { parseRss } from "../../../lib/rss.ts";
import {
  filterLocatedRiskSignal,
  looksPotentiallyRelevant,
  publisherContext,
  signalExpiresAt,
} from "../../../lib/risk-signal-filter.ts";

const DELHI = { latitude: 28.6139, longitude: 77.209 };
const NCR_TERMS = /\b(delhi|new delhi|ncr|gurugram|gurgaon|noida|ghaziabad|faridabad|haryana)\b|दिल्ली|गुरुग्राम|गाज़ियाबाद|नोएडा|फरीदाबाद|हरियाणा/i;

const RSS_FEEDS = [
  {
    name: "Hindustan Times · Delhi",
    domain: "hindustantimes.com",
    url: "https://www.hindustantimes.com/feeds/rss/cities/delhi-news/rssfeed.xml",
    delhiScoped: true,
  },
  {
    name: "NDTV · Cities",
    domain: "ndtv.com",
    url: "https://feeds.feedburner.com/ndtvnews-cities-news",
    delhiScoped: false,
  },
  {
    name: "The Indian Express · Delhi",
    domain: "indianexpress.com",
    url: "https://indianexpress.com/section/cities/delhi/feed/",
    delhiScoped: true,
  },
  {
    name: "The Hindu · Delhi",
    domain: "thehindu.com",
    url: "https://www.thehindu.com/news/cities/Delhi/feeder/default.rss",
    delhiScoped: true,
  },
  {
    name: "NDMA / SACHET · India CAP",
    domain: "sachet.ndma.gov.in",
    url: "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml",
    delhiScoped: false,
  },
] as const;

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  try {
    const serialized = JSON.stringify(error);
    return serialized && serialized !== "{}" ? serialized : String(error);
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

async function json(url: string) {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(7000) });
      if (response.ok) return response.json();
      lastError = new Error(`${new URL(url).hostname} returned ${response.status}`);
      if (response.status !== 429 && response.status < 500) throw lastError;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError ?? new Error(`${new URL(url).hostname} request failed`);
}

async function text(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "How-Risky-Is-Today-Internal-Prototype/0.2" },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`${new URL(url).hostname} returned ${response.status}`);
  return response.text();
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

function fiveMinutesFrom(date: Date) {
  return new Date(date.getTime() + 5 * 60 * 1000).toISOString();
}

export async function refreshEnvironment() {
  const started = new Date();
  const runId = `environment-${started.toISOString().slice(0, 16).replaceAll(":", "-")}`;
  const weatherParams = new URLSearchParams({
    latitude: String(DELHI.latitude),
    longitude: String(DELHI.longitude),
    current: "temperature_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,weather_code,is_day",
    timezone: "Asia/Kolkata",
  });
  const airParams = new URLSearchParams({
    latitude: String(DELHI.latitude),
    longitude: String(DELHI.longitude),
    current: "us_aqi,pm2_5",
    domains: "cams_global",
    timezone: "Asia/Kolkata",
  });

  const [weatherPayload, airPayload, feedResults] = await Promise.all([
    json(`https://api.open-meteo.com/v1/forecast?${weatherParams}`),
    json(`https://air-quality-api.open-meteo.com/v1/air-quality?${airParams}`),
    Promise.all(RSS_FEEDS.map(async (feed) => {
      try {
        const xml = await text(feed.url);
        return { feed, items: parseRss(xml), error: null };
      } catch (error) {
        const message = errorMessage(error);
        console.warn(JSON.stringify({ feed: feed.name, status: "degraded", message }));
        return { feed, items: [], error: message };
      }
    })),
  ]);

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
    usAqi: Number.isFinite(Number(airPayload.current?.us_aqi))
      ? Number(airPayload.current.us_aqi)
      : null,
    pm25: Number.isFinite(Number(airPayload.current?.pm2_5))
      ? Number(airPayload.current.pm2_5)
      : null,
  };

  const url = (environmentValue("SUPABASE_URL") ?? environmentValue("NEXT_PUBLIC_SUPABASE_URL"))?.trim();
  const serviceKey = environmentValue("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const initialScene = chooseScene({ ...weather, usAqi: air.usAqi, roadSignalCount: 0 });

  if (!url || !serviceKey) {
    console.log(JSON.stringify({ runId, scene: initialScene, status: "feeds-ok-storage-not-configured" }));
    return;
  }

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  const feedCutoff = started.getTime() - 48 * 60 * 60 * 1000;
  const feedItems = feedResults.flatMap(({ feed, items }) => items
    .filter((item) => feed.delhiScoped || NCR_TERMS.test(`${item.title} ${item.description}`))
    .filter((item) => !item.publishedAt || new Date(item.publishedAt).getTime() >= feedCutoff)
    .slice(0, 40)
    .map((item) => ({
      source_url: item.url,
      title: item.title,
      domain: feed.domain,
      published_at: item.publishedAt,
      rss_description: item.description,
      feed_name: feed.name,
      feed_url: feed.url,
    })));

  const potentialItems = feedItems
    .filter((source) => looksPotentiallyRelevant(`${source.title} ${source.rss_description}`))
    .slice(0, 24);
  const enriched = await Promise.all(potentialItems.map(async (source) => {
    try {
      return { source, article_context: await articleText(source.source_url), article_error: null };
    } catch (error) {
      return { source, article_context: "", article_error: errorMessage(error) };
    }
  }));
  const locatedCandidates = enriched.flatMap((item) => {
    const primaryContext = `${item.source.title} ${item.source.rss_description}`;
    const decision = filterLocatedRiskSignal(primaryContext, item.article_context);
    return decision ? [{ ...item, decision }] : [];
  });
  const seenEvents = new Set<string>();
  const locatedLeads = locatedCandidates
    .sort((a, b) => new Date(b.source.published_at ?? 0).getTime() - new Date(a.source.published_at ?? 0).getTime())
    .filter((item) => {
      const key = `${item.decision.location.toLowerCase()}::${item.decision.mechanism}`;
      if (seenEvents.has(key)) return false;
      seenEvents.add(key);
      return true;
    });

  // Re-evaluate the current source window on every run. Anything without both a
  // risk mechanism and a precise location is hidden from the map and firehose.
  for (const sourceUrls of chunks([...new Set(feedItems.map((item) => item.source_url))], 50)) {
    const { error: rejectError } = await supabase
      .from("signals")
      .update({ status: "rejected" })
      .in("source_url", sourceUrls);
    if (rejectError) throw new Error(`hide non-risk headlines: ${errorMessage(rejectError)}`);
  }
  const { error: unlocatedError } = await supabase
    .from("signals")
    .update({ status: "rejected" })
    .in("status", ["pending", "verified"])
    .or("longitude.is.null,latitude.is.null");
  if (unlocatedError) throw new Error(`hide unlocated headlines: ${errorMessage(unlocatedError)}`);

  if (locatedLeads.length) {
    const sources = locatedLeads.map(({ source, article_context, article_error, decision }) => ({
      source_url: source.source_url,
      title: source.title,
      domain: source.domain,
      published_at: source.published_at,
      raw_payload: {
        feed: source.feed_name,
        feedUrl: source.feed_url,
        rssDescription: source.rss_description,
        articleContext: article_context.slice(0, 3000),
        articleError: article_error,
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
      .upsert(sources, { onConflict: "source_url" })
      .select("id,source_url");
    if (sourceError) throw new Error(`save RSS headlines: ${errorMessage(sourceError)}`);

    const sourceIds = new Map(
      (savedSources ?? []).map((source) => [String(source.source_url), String(source.id)]),
    );
    const leads = locatedLeads.map(({ source, decision }) => ({
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
      .upsert(leads, { onConflict: "source_url" });
    if (signalError) throw new Error(`save RSS firehose: ${errorMessage(signalError)}`);
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
  if (leadCountResult.error) throw new Error(`count source leads: ${errorMessage(leadCountResult.error)}`);
  if (roadCountResult.error) throw new Error(`count road leads: ${errorMessage(roadCountResult.error)}`);
  const scene = chooseScene({
    ...weather,
    usAqi: air.usAqi,
    roadSignalCount: roadCountResult.count ?? 0,
  });
  const processingStatus = feedResults.some(({ error }) => Boolean(error))
    ? "partial"
    : "complete";

  const { error: snapshotError } = await supabase.from("risk_snapshots").upsert({
    run_id: runId,
    generated_at: started.toISOString(),
    next_review_at: fiveMinutesFrom(started),
    scene,
    weather,
    air,
    verified_signal_count: leadCountResult.count ?? 0,
    processing_status: processingStatus,
  }, { onConflict: "run_id" });
  if (snapshotError) throw new Error(`save environment snapshot: ${errorMessage(snapshotError)}`);

  const retentionCutoff = new Date(started.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { error: retentionError } = await supabase
    .from("risk_snapshots")
    .delete()
    .like("run_id", "environment-%")
    .lt("generated_at", retentionCutoff);
  if (retentionError) {
    console.warn(JSON.stringify({ runId, cleanup: "degraded", message: errorMessage(retentionError) }));
  }

  console.log(JSON.stringify({
    runId,
    scene,
    rssItemsConsidered: feedItems.length,
    potentialRiskItems: potentialItems.length,
    locatedRiskLeads: locatedLeads.length,
    rssSources: feedResults.map(({ feed, items, error }) => ({
      name: feed.name,
      items: items.length,
      status: error ? "degraded" : "complete",
    })),
    status: processingStatus,
  }));
}
