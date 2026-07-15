import {
  LIVE_EVENT_DEFAULT_AGE_MS,
  STATIC_EVENT_MAX_AGE_MS,
  type EventBehavior,
  type RiskSeverity,
  type RiskType,
} from "./risk-engine.ts";

export type FilteredCategory = "weather" | "air" | "heat" | "road" | "civic";
export type { EventBehavior, RiskType } from "./risk-engine.ts";
export type FilteredSeverity = RiskSeverity;

export interface LocatedRiskSignal {
  category: FilteredCategory;
  severity: FilteredSeverity;
  severityReason: string;
  riskType: RiskType;
  riskExplanation: string;
  behavior: EventBehavior;
  mechanism: string;
  location: string;
  longitude: number;
  latitude: number;
  locationConfidence: "venue" | "neighbourhood";
}

type GazetteerEntry = {
  names: string[];
  label: string;
  longitude: number;
  latitude: number;
  confidence: LocatedRiskSignal["locationConfidence"];
};

// Small, inspectable Delhi/NCR gazetteer. Exact venues beat broad neighbourhoods.
// New locations can be added without changing the classification logic.
const GAZETTEER = ([
  { names: ["SCI International Hospital"], label: "SCI International Hospital, Greater Kailash I", longitude: 77.2340192, latitude: 28.5498848, confidence: "venue" },
  { names: ["Jantar Mantar"], label: "Jantar Mantar", longitude: 77.2166166, latitude: 28.6271791, confidence: "venue" },
  { names: ["Mayur Vihar Phase 3", "Mayur Vihar Phase III"], label: "Mayur Vihar Phase 3", longitude: 77.3259814, latitude: 28.6018747, confidence: "neighbourhood" },
  { names: ["Ramlila Maidan"], label: "Ramlila Maidan", longitude: 77.2326, latitude: 28.6415, confidence: "venue" },
  { names: ["India Gate"], label: "India Gate", longitude: 77.2295, latitude: 28.6129, confidence: "venue" },
  { names: ["Red Fort", "Lal Qila"], label: "Red Fort", longitude: 77.2410, latitude: 28.6562, confidence: "venue" },
  { names: ["Connaught Place", "Rajiv Chowk"], label: "Connaught Place", longitude: 77.2167, latitude: 28.6315, confidence: "neighbourhood" },
  { names: ["ITO"], label: "ITO", longitude: 77.2425, latitude: 28.6289, confidence: "neighbourhood" },
  { names: ["Pragati Maidan"], label: "Pragati Maidan", longitude: 77.2435, latitude: 28.6187, confidence: "venue" },
  { names: ["AIIMS Delhi", "AIIMS"], label: "AIIMS New Delhi", longitude: 77.2100, latitude: 28.5672, confidence: "venue" },
  { names: ["RML Hospital", "Ram Manohar Lohia Hospital"], label: "RML Hospital", longitude: 77.1990, latitude: 28.6251, confidence: "venue" },
  { names: ["Safdarjung Hospital"], label: "Safdarjung Hospital", longitude: 77.2045, latitude: 28.5672, confidence: "venue" },
  { names: ["LNJP Hospital", "Lok Nayak Hospital"], label: "LNJP Hospital", longitude: 77.2372, latitude: 28.6389, confidence: "venue" },
  { names: ["GTB Hospital", "Guru Teg Bahadur Hospital"], label: "GTB Hospital", longitude: 77.3077, latitude: 28.6840, confidence: "venue" },
  { names: ["Kashmere Gate"], label: "Kashmere Gate", longitude: 77.2280, latitude: 28.6675, confidence: "neighbourhood" },
  { names: ["Sarai Kale Khan"], label: "Sarai Kale Khan", longitude: 77.2575, latitude: 28.5897, confidence: "neighbourhood" },
  { names: ["Chandni Chowk"], label: "Chandni Chowk", longitude: 77.2303, latitude: 28.6506, confidence: "neighbourhood" },
  { names: ["GB Road", "Garstin Bastion Road"], label: "G.B. Road", longitude: 77.2219, latitude: 28.6452, confidence: "neighbourhood" },
  { names: ["Pitampura"], label: "Pitampura", longitude: 77.1312, latitude: 28.6942, confidence: "neighbourhood" },
  { names: ["Shalimar Bagh"], label: "Shalimar Bagh", longitude: 77.1646, latitude: 28.7175, confidence: "neighbourhood" },
  { names: ["Rohini"], label: "Rohini", longitude: 77.1025, latitude: 28.7495, confidence: "neighbourhood" },
  { names: ["Dwarka"], label: "Dwarka", longitude: 77.0460, latitude: 28.5921, confidence: "neighbourhood" },
  { names: ["Saket"], label: "Saket", longitude: 77.2167, latitude: 28.5244, confidence: "neighbourhood" },
  { names: ["Greater Kailash"], label: "Greater Kailash", longitude: 77.2381, latitude: 28.5494, confidence: "neighbourhood" },
  { names: ["Hauz Khas"], label: "Hauz Khas", longitude: 77.2001, latitude: 28.5494, confidence: "neighbourhood" },
  { names: ["Vasant Kunj"], label: "Vasant Kunj", longitude: 77.1591, latitude: 28.5293, confidence: "neighbourhood" },
  { names: ["Lajpat Nagar"], label: "Lajpat Nagar", longitude: 77.2431, latitude: 28.5677, confidence: "neighbourhood" },
  { names: ["Karol Bagh"], label: "Karol Bagh", longitude: 77.1909, latitude: 28.6519, confidence: "neighbourhood" },
  { names: ["Janakpuri"], label: "Janakpuri", longitude: 77.0878, latitude: 28.6219, confidence: "neighbourhood" },
  { names: ["Rajouri Garden"], label: "Rajouri Garden", longitude: 77.1193, latitude: 28.6469, confidence: "neighbourhood" },
  { names: ["Tilak Nagar"], label: "Tilak Nagar", longitude: 77.0964820, latitude: 28.6365265, confidence: "neighbourhood" },
  { names: ["Okhla"], label: "Okhla", longitude: 77.2796, latitude: 28.5355, confidence: "neighbourhood" },
  { names: ["Kalkaji"], label: "Kalkaji", longitude: 77.2560, latitude: 28.5358, confidence: "neighbourhood" },
  { names: ["Mehrauli"], label: "Mehrauli", longitude: 77.1817, latitude: 28.5245, confidence: "neighbourhood" },
  { names: ["Najafgarh"], label: "Najafgarh", longitude: 76.9850, latitude: 28.6092, confidence: "neighbourhood" },
  { names: ["Shahdara"], label: "Shahdara", longitude: 77.2897, latitude: 28.6733, confidence: "neighbourhood" },
  { names: ["Seelampur"], label: "Seelampur", longitude: 77.2698, latitude: 28.6697, confidence: "neighbourhood" },
  { names: ["Burari"], label: "Burari", longitude: 77.1959, latitude: 28.7532, confidence: "neighbourhood" },
  { names: ["Narela"], label: "Narela", longitude: 77.0918, latitude: 28.8527, confidence: "neighbourhood" },
  { names: ["Gurugram", "Gurgaon"], label: "Central Gurugram", longitude: 77.0266, latitude: 28.4595, confidence: "neighbourhood" },
  { names: ["Noida Sector 62", "Sector 62 Noida"], label: "Noida Sector 62", longitude: 77.3650, latitude: 28.6270, confidence: "neighbourhood" },
  { names: ["Noida"], label: "Central Noida", longitude: 77.3910, latitude: 28.5355, confidence: "neighbourhood" },
  { names: ["Ghaziabad"], label: "Central Ghaziabad", longitude: 77.4538, latitude: 28.6692, confidence: "neighbourhood" },
  { names: ["Faridabad"], label: "Central Faridabad", longitude: 77.3178, latitude: 28.4089, confidence: "neighbourhood" },
  { names: ["Yamuna floodplain", "Yamuna floodplains", "Yamuna River", "river Yamuna", "Yamuna"], label: "Yamuna river and floodplain", longitude: 77.2631, latitude: 28.6608, confidence: "neighbourhood" },
  { names: ["Old Railway Bridge", "Loha Pul"], label: "Old Railway Bridge, Yamuna", longitude: 77.2497, latitude: 28.6618, confidence: "venue" },
] satisfies GazetteerEntry[]).sort(
  (a, b) => Math.max(...b.names.map((name) => name.length)) - Math.max(...a.names.map((name) => name.length)),
);

const ROAD_RISK = /\b(accident|collision|crash|pile[ -]?up|traffic jam|congestion|gridlock|road(?:s)? closed|road closure|diversion|waterlog(?:ging|ged)?|pothole|cave[ -]?in|vehicle overturn|derailment|bridge damage)\b/i;
const CROWD_RISK = /\b(protest|rally|march|demonstration|hunger strike|procession|bandh|crowd|demolition|encroachment drive)\b/i;
const SAFETY_RISK = /\b(assault|clash|violence|fire|blaze|collapse|electrocut(?:ion|ed)?|shoot(?:ing|out)?|stabb(?:ing|ed)|murder|killed|dead|death|drown(?:ing|ed)?|blast|explosion|stampede|body|bodies)\b/i;
const INSTITUTION_RISK = /\b(hospital|clinic|ivf|school|college|university|mall|market)\b/i;
const INSTITUTION_FAILURE = /\b(negligence|scam|fraud|deception|fir|stillbirth|death|dead|killed|assault|fire|collapse|gone wrong|unsafe)\b/i;
const WEATHER_RISK = /\b(red alert|orange alert|heavy rain|thunderstorm|lightning|flood(?:ing|ed)?|heatwave|heat wave|dense fog|severe weather)\b/i;
const AIR_RISK = /\b(severe air|hazardous air|air quality emergency|toxic smog|aqi (?:[3-9]\d\d|[5-9]\d))\b/i;
const IRRELEVANT = /\b(personality rights|aid scheme|welfare scheme|inflation|cinephile|film guide|electoral roll|court plea|copyright|celebrity|sports rights)\b/i;
const NON_EVENT = /\b(court allows|dispose (?:of )?(?:the )?remains|audit(?:or|ors|ing)?|rules notified|issues sops|standard operating procedure|plot foiled|case came together|2020 riots|rights commission|anniversary|retrospective)\b/i;
const LIVE_LANGUAGE = /\b(ongoing|continuing|continues|underway|active|current|today|now|rising|swollen|warning|alert|closure|closed|diversion|congestion|gridlock|waterlog(?:ging|ged)?|flood(?:ing|ed)?|heavy rain|thunderstorm|heatwave|heat wave|dense fog|severe air|hazardous air|toxic smog)\b/i;
const LIFE_SAFETY = /\b(drown(?:ing|ed)?|electrocut(?:ion|ed)?|stampede|building collapse|major fire|fatal|killed|dead|death|body|bodies|blast|explosion|shoot(?:ing|out)?|stabb(?:ing|ed)|murder|Yamuna|river|flood(?:ing|ed)?)\b/i;

function riskClassification(text: string) {
  const currentYear = new Date().getUTCFullYear();
  const hasHistoricalYear = [...text.matchAll(/\b(19\d{2}|20\d{2})\b/g)]
    .some((match) => Number(match[1]) < currentYear - 1);
  if (hasHistoricalYear) return null;
  if (NON_EVENT.test(text)) return null;
  if (IRRELEVANT.test(text) && !ROAD_RISK.test(text) && !CROWD_RISK.test(text) && !SAFETY_RISK.test(text)) return null;
  if (INSTITUTION_RISK.test(text) && INSTITUTION_FAILURE.test(text)) {
    return {
      category: "civic" as const,
      mechanism: "institutional safety concern",
      riskType: "institutional-safety" as const,
      behavior: "static" as const,
    };
  }
  if (WEATHER_RISK.test(text)) return {
    category: "weather" as const,
    mechanism: "weather hazard",
    riskType: LIFE_SAFETY.test(text) ? "life-safety" as const : "environmental-exposure" as const,
    behavior: "live" as const,
  };
  if (AIR_RISK.test(text)) return {
    category: "air" as const,
    mechanism: "air-quality hazard",
    riskType: "environmental-exposure" as const,
    behavior: "live" as const,
  };
  if (CROWD_RISK.test(text)) return {
    category: "road" as const,
    mechanism: "crowd or protest disruption",
    riskType: "traffic-disruption" as const,
    behavior: LIVE_LANGUAGE.test(text) ? "live" as const : "static" as const,
  };
  if (ROAD_RISK.test(text)) return {
    category: "road" as const,
    mechanism: "transport disruption",
    riskType: LIFE_SAFETY.test(text) ? "life-safety" as const : "traffic-disruption" as const,
    behavior: LIVE_LANGUAGE.test(text) ? "live" as const : "static" as const,
  };
  if (SAFETY_RISK.test(text)) return {
    category: "civic" as const,
    mechanism: "public-safety incident",
    riskType: LIFE_SAFETY.test(text) ? "life-safety" as const : "public-safety" as const,
    behavior: LIVE_LANGUAGE.test(text) ? "live" as const : "static" as const,
  };
  return null;
}

function severityFor(text: string): Pick<LocatedRiskSignal, "severity" | "severityReason"> {
  if (/\b(mass casualty|multiple deaths|stampede|catastrophic|major explosion)\b/i.test(text)) {
    return { severity: "severe", severityReason: "The report indicates multiple casualties or a potentially catastrophic event." };
  }
  if (/\b(killed|dead|death|fatal|drown(?:ing|ed)?|building collapse|major fire|blast|explosion|shoot(?:ing|out)?|stabb(?:ing|ed))\b/i.test(text)) {
    return { severity: "high", severityReason: "The report indicates a fatality or an immediate threat to life safety." };
  }
  if (/\b(assault|clash|fire|collision|accident|protest|rally|hunger strike|waterlog(?:ging|ged)?|flood(?:ing|ed)?|red alert|hazardous air|fraud|scam|stillbirth)\b/i.test(text)) {
    return { severity: "elevated", severityReason: "The reported conditions could materially affect safety or local movement." };
  }
  if (/\b(closure|closed|diversion|congestion|gridlock|orange alert|dense fog|heavy rain|thunderstorm|heatwave|heat wave|severe air)\b/i.test(text)) {
    return { severity: "guarded", severityReason: "The report warrants caution, but does not indicate a major immediate impact." };
  }
  return { severity: "low", severityReason: "The report describes a localized risk with limited indicated impact." };
}

function explanationFor(riskType: RiskType, mechanism: string, location: string) {
  if (mechanism === "institutional safety concern") {
    return `This one-off incident raises a localized safety concern at ${location}; it does not indicate an ongoing citywide threat.`;
  }
  if (mechanism === "crowd or protest disruption") {
    return `Road closures, diversions, crowds and congestion may affect movement around ${location}.`;
  }
  if (riskType === "life-safety" && /Yamuna|river|floodplain/i.test(location)) {
    return `Flooding, strong currents or unstable banks may create life-safety exposure near ${location} and nearby low-lying areas.`;
  }
  if (riskType === "life-safety") {
    return `The reported incident may pose a direct threat to life safety around ${location}.`;
  }
  if (riskType === "traffic-disruption") {
    return `Blocked routes, diversions or slow traffic may affect people travelling around ${location}.`;
  }
  if (riskType === "environmental-exposure") {
    return `Current conditions may increase weather or air-quality exposure around ${location}.`;
  }
  return `The reported incident may create a localized public-safety concern around ${location}.`;
}

function locationIn(text: string) {
  const lower = text.toLocaleLowerCase("en-IN");
  let best: { entry: GazetteerEntry; index: number } | null = null;
  for (const entry of GAZETTEER) {
    for (const name of entry.names) {
      const index = lower.indexOf(name.toLocaleLowerCase("en-IN"));
      if (index >= 0 && (!best || index < best.index)) best = { entry, index };
    }
  }
  return best?.entry ?? null;
}

export function looksPotentiallyRelevant(text: string) {
  return riskClassification(text) !== null;
}

export function filterLocatedRiskSignal(primaryText: string, locationContext = primaryText): LocatedRiskSignal | null {
  const classification = riskClassification(primaryText);
  if (!classification) return null;
  const location = locationIn(`${primaryText} ${locationContext}`);
  if (!location) return null;

  const severity = severityFor(primaryText);
  return {
    ...classification,
    ...severity,
    riskExplanation: explanationFor(classification.riskType, classification.mechanism, location.label),
    location: location.label,
    longitude: location.longitude,
    latitude: location.latitude,
    locationConfidence: location.confidence,
  };
}

/**
 * Live signals must keep being observed by a refresh. Static incidents are
 * retained for at most seven days from the publisher timestamp.
 */
export function signalExpiresAt(
  behavior: EventBehavior,
  occurredAt: string | null | undefined,
  observedAt = new Date(),
) {
  if (behavior === "live") return new Date(observedAt.getTime() + LIVE_EVENT_DEFAULT_AGE_MS).toISOString();
  const occurred = occurredAt ? new Date(occurredAt) : observedAt;
  const base = Number.isNaN(occurred.getTime()) ? observedAt : occurred;
  return new Date(base.getTime() + STATIC_EVENT_MAX_AGE_MS).toISOString();
}

export function decodePublisherText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\\u([\da-f]{4})/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\\n|\\r|\\t/g, " ")
    .replace(/\\"/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function publisherContext(html: string) {
  const descriptionMatch = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i)
    ?? html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/i);
  const bodyMatch = html.match(/"articleBody"\s*:\s*("(?:\\.|[^"\\])*")/i);
  let articleBody = "";
  if (bodyMatch) {
    try {
      articleBody = JSON.parse(bodyMatch[1]) as string;
    } catch {
      articleBody = bodyMatch[1].slice(1, -1);
    }
  }
  return decodePublisherText(`${descriptionMatch?.[1] ?? ""} ${articleBody}`).slice(0, 12000);
}
