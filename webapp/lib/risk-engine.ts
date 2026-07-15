export type Scene = "rain" | "heat" | "haze" | "road" | "quiet";

export type RiskType =
  | "life-safety"
  | "traffic-disruption"
  | "environmental-exposure"
  | "public-safety"
  | "institutional-safety";

export type RiskSeverity = "low" | "guarded" | "elevated" | "high" | "severe";
export type SignalSeverity = RiskSeverity;
export type EventBehavior = "live" | "static";

export interface EventRiskIntelligence {
  riskType: RiskType;
  riskExplanation: string;
  severity: RiskSeverity;
  severityReason: string;
  behavior: EventBehavior;
  expiresAt: string;
}

export interface RiskSignal {
  id: string;
  category: "weather" | "air" | "heat" | "road" | "civic";
  title: string;
  location: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  occurredAt: string;
  coordinates: [number, number] | null;
  severity: RiskSeverity;
  status: "automated" | "verified";
  // Optional while legacy stored rows are upgraded. Snapshot output always has
  // these fields because withLiveReadings enriches every current signal.
  riskType?: RiskType;
  riskExplanation?: string;
  severityReason?: string;
  behavior?: EventBehavior;
  expiresAt?: string;
}

export type InspectableRiskSignal = RiskSignal & EventRiskIntelligence;

export interface WeatherReading {
  temperatureC: number;
  apparentTemperatureC: number;
  precipitationMm: number;
  cloudCover: number;
  windKph: number;
  weatherCode: number;
  isDay: boolean;
}

export interface AirReading {
  usAqi: number | null;
  pm25: number | null;
}

export type RiskPressureContributionKind = "environment" | "event" | "interaction";

export interface RiskPressureContribution {
  id: string;
  kind: RiskPressureContributionKind;
  label: string;
  points: number;
  reason: string;
}

export interface LiveRiskPressure {
  score: number;
  level: RiskSeverity;
  summary: string;
  activeEventCount: number;
  calculatedAt: string;
  inputs: {
    precipitationMm: number;
    apparentTemperatureC: number;
    usAqi: number | null;
    activeEventCount: number;
  };
  contributions: RiskPressureContribution[];
}

export interface RiskSnapshot {
  scene: Scene;
  generatedAt: string;
  nextReviewAt: string;
  freshnessHours: number;
  baseline: {
    micromortsPerAverageDay: number;
    annualRatePer100k: number;
    sourceYear: number;
    status: "reconciliation-pending" | "verified";
  };
  weather: WeatherReading;
  air: AirReading;
  signals: InspectableRiskSignal[];
  liveRiskPressure: LiveRiskPressure;
  coverageNote: string;
}

export interface SceneInputs {
  temperatureC: number;
  apparentTemperatureC?: number;
  precipitationMm: number;
  weatherCode: number;
  usAqi: number | null;
  roadSignalCount: number;
}

export const STATIC_EVENT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const LIVE_EVENT_DEFAULT_AGE_MS = 6 * 60 * 60 * 1000;

const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

const LIVE_TERMS = /\b(ongoing|continuing|active|in effect|warning|alert|rising|flooding|waterlog(?:ging|ged)?|closure|closed|diversion|congestion|gridlock|protest|rally|march|hunger strike|procession|heatwave|heat wave|smog)\b/i;
const INSTITUTION_TERMS = /\b(hospital|clinic|school|college|university|institution|ivf|care home)\b/i;
const LIFE_SAFETY_TERMS = /\b(drown(?:ing|ed)?|electrocut(?:ion|ed)?|stampede|building collapse|multiple deaths|mass casualty|fatal|killed|dead|death|yamuna|river level|rising water|flash flood)\b/i;
const PUBLIC_SAFETY_TERMS = /\b(assault|clash|violence|shoot(?:ing|out)?|stabb(?:ing|ed)|murder|fire|blaze|blast|explosion)\b/i;
const TRAFFIC_TERMS = /\b(accident|collision|crash|traffic|road|closure|closed|diversion|congestion|gridlock|protest|rally|march|procession|waterlog(?:ging|ged)?|pothole)\b/i;
const FLOOD_TERMS = /\b(yamuna|flood(?:ing|ed)?|rising water|river level|drown(?:ing|ed)?)\b/i;
const ROAD_INTERACTION_TERMS = /\b(protest|rally|march|procession|road closure|road closed|diversion|congestion|gridlock)\b/i;

export function isDelhiDaylight(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Kolkata",
    }).format(date),
  );
  return hour >= 6 && hour < 18;
}

export function annualRateToDailyMicromorts(ratePer100kPerYear: number) {
  if (!Number.isFinite(ratePer100kPerYear) || ratePer100kPerYear < 0) {
    throw new RangeError("Annual rate must be a non-negative finite number");
  }
  return (ratePer100kPerYear / 100000) * 1000000 / 365;
}

export function chooseScene(input: SceneInputs): Scene {
  if (input.precipitationMm >= 0.2 || RAIN_CODES.has(input.weatherCode)) {
    return "rain";
  }

  if (input.temperatureC >= 39 || (input.apparentTemperatureC ?? 0) >= 42) {
    return "heat";
  }

  if ((input.usAqi ?? 0) >= 151) {
    return "haze";
  }

  if (input.roadSignalCount >= 4) {
    return "road";
  }

  return "quiet";
}

export const sceneCopy: Record<Scene, { label: string; detail: string }> = {
  rain: {
    label: "Rain watch",
    detail: "Rainfall, waterlogging and wind layers are active whenever current conditions require them.",
  },
  heat: {
    label: "Heat stress",
    detail: "Temperature and apparent-heat layers are active.",
  },
  haze: {
    label: "Air-quality haze",
    detail: "Particulate and air-quality layers are active.",
  },
  road: {
    label: "Road strain",
    detail: "Verified road-safety signals are above the recent reference range.",
  },
  quiet: {
    label: "Quiet watch",
    detail: "No dominant automated hazard pattern is active.",
  },
};

function validDate(value: string | undefined) {
  if (!value) return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? new Date(milliseconds) : null;
}

function signalText(signal: Pick<RiskSignal, "title" | "summary">) {
  return `${signal.title} ${signal.summary}`;
}

function inferredRiskType(signal: RiskSignal): RiskType {
  const text = signalText(signal);
  if (INSTITUTION_TERMS.test(text)) return "institutional-safety";
  if (LIFE_SAFETY_TERMS.test(text)) return "life-safety";
  if (PUBLIC_SAFETY_TERMS.test(text)) return "public-safety";
  if (signal.category === "road" || TRAFFIC_TERMS.test(text)) return "traffic-disruption";
  if (["weather", "air", "heat"].includes(signal.category)) return "environmental-exposure";
  return "public-safety";
}

function inferredBehavior(signal: RiskSignal, riskType: RiskType): EventBehavior {
  const text = signalText(signal);
  if (signal.behavior) return signal.behavior;
  if (riskType === "institutional-safety") return "static";
  if (LIVE_TERMS.test(text)) return "live";
  if (["weather", "air", "heat"].includes(signal.category)) return "live";
  return "static";
}

function inferredExplanation(signal: RiskSignal, riskType: RiskType) {
  const place = signal.location;
  const text = signalText(signal);
  if (riskType === "institutional-safety") {
    return `This one-off report raises an institutional safety concern at ${place}; it is not treated as a citywide continuing threat.`;
  }
  if (riskType === "life-safety" && FLOOD_TERMS.test(text)) {
    return `Flooding or rising water may create life-safety exposure near ${place}, especially close to the river and low-lying areas.`;
  }
  if (riskType === "life-safety") {
    return `The reported hazard may expose people near ${place} to serious injury or loss of life.`;
  }
  if (riskType === "traffic-disruption" && /\b(protest|rally|march|hunger strike|procession)\b/i.test(text)) {
    return `Road closures, diversions, crowds and congestion may disrupt movement around ${place}.`;
  }
  if (riskType === "traffic-disruption") {
    return `Delays, diversions or unsafe road conditions may disrupt movement around ${place}.`;
  }
  if (riskType === "environmental-exposure") {
    return `Current conditions may increase weather, heat or air-quality exposure around ${place}.`;
  }
  return `The reported incident may create a local public-safety concern around ${place}.`;
}

function inferredSeverityReason(signal: RiskSignal) {
  const text = signalText(signal);
  if (signal.severity === "severe") {
    return /\b(multiple deaths|mass casualty|stampede|building collapse)\b/i.test(text)
      ? "Severe because the report indicates a mass-casualty or extreme life-safety hazard."
      : "Severe because the reported consequence presents an extreme local safety hazard.";
  }
  if (signal.severity === "high") {
    return "High because the reported mechanism can cause serious harm or major local disruption.";
  }
  if (signal.severity === "elevated") {
    return "Elevated because a credible local hazard or material disruption is reported.";
  }
  if (signal.severity === "guarded") {
    return "Guarded because the report indicates a limited but notable local risk mechanism.";
  }
  return "Low because the available report indicates limited consequence and geographic reach.";
}

export function eventExpiresAt(
  signal: RiskSignal,
  behavior: EventBehavior,
  referenceTime = new Date(),
) {
  const occurredAt = validDate(signal.occurredAt) ?? referenceTime;
  const derived = new Date(
    occurredAt.getTime()
      + (behavior === "live" ? LIVE_EVENT_DEFAULT_AGE_MS : STATIC_EVENT_MAX_AGE_MS),
  );
  const supplied = validDate(signal.expiresAt);

  if (!supplied) return derived.toISOString();
  if (behavior === "static") {
    return new Date(Math.min(supplied.getTime(), derived.getTime())).toISOString();
  }
  return supplied.toISOString();
}

export function deriveEventRiskIntelligence(
  signal: RiskSignal,
  referenceTime = new Date(),
): InspectableRiskSignal {
  const riskType = signal.riskType ?? inferredRiskType(signal);
  const behavior = inferredBehavior(signal, riskType);
  return {
    ...signal,
    riskType,
    riskExplanation: signal.riskExplanation?.trim() || inferredExplanation(signal, riskType),
    severityReason: signal.severityReason?.trim() || inferredSeverityReason(signal),
    behavior,
    expiresAt: eventExpiresAt(signal, behavior, referenceTime),
  };
}

export function isRiskSignalCurrent(signal: RiskSignal, referenceTime = new Date()) {
  const enriched = deriveEventRiskIntelligence(signal, referenceTime);
  return Date.parse(enriched.expiresAt) > referenceTime.getTime();
}

export function enrichCurrentRiskSignals(signals: RiskSignal[], referenceTime = new Date()) {
  return signals
    .map((signal) => deriveEventRiskIntelligence(signal, referenceTime))
    .filter((signal) => Date.parse(signal.expiresAt) > referenceTime.getTime());
}

const severityPoints: Record<RiskSeverity, number> = {
  low: 1,
  guarded: 2,
  elevated: 4,
  high: 7,
  severe: 10,
};

function pressureLevel(score: number): RiskSeverity {
  if (score >= 70) return "severe";
  if (score >= 50) return "high";
  if (score >= 30) return "elevated";
  if (score >= 15) return "guarded";
  return "low";
}

function precipitationPoints(precipitationMm: number) {
  if (precipitationMm >= 20) return 22;
  if (precipitationMm >= 7.5) return 16;
  if (precipitationMm >= 2.5) return 10;
  if (precipitationMm >= 0.2) return 6;
  return 0;
}

function heatPoints(apparentTemperatureC: number) {
  if (apparentTemperatureC >= 45) return 14;
  if (apparentTemperatureC >= 40) return 8;
  if (apparentTemperatureC >= 35) return 4;
  return 0;
}

function airPoints(usAqi: number | null) {
  if (usAqi === null) return 0;
  if (usAqi >= 301) return 22;
  if (usAqi >= 201) return 16;
  if (usAqi >= 151) return 10;
  if (usAqi >= 101) return 5;
  return 0;
}

function eventFreshness(signal: InspectableRiskSignal, referenceTime: Date) {
  const occurredAt = validDate(signal.occurredAt) ?? referenceTime;
  const age = Math.max(0, referenceTime.getTime() - occurredAt.getTime());
  if (signal.behavior === "live") {
    const duration = Math.max(1, Date.parse(signal.expiresAt) - occurredAt.getTime());
    return Math.max(0.25, 1 - 0.75 * Math.min(1, age / duration));
  }
  return Math.max(0.25, 1 - 0.75 * Math.min(1, age / STATIC_EVENT_MAX_AGE_MS));
}

function pressureSummary(level: RiskSeverity, activeEventCount: number) {
  const eventPhrase = activeEventCount === 0
    ? "no current located events"
    : `${activeEventCount} current located event${activeEventCount === 1 ? "" : "s"}`;
  return `${level[0].toUpperCase()}${level.slice(1)} live pressure from environmental conditions and ${eventPhrase}. This is not a mortality probability.`;
}

export function calculateLiveRiskPressure(
  weather: WeatherReading,
  air: AirReading,
  signals: RiskSignal[],
  referenceTime = new Date(),
): LiveRiskPressure {
  const currentSignals = enrichCurrentRiskSignals(signals, referenceTime);
  const contributions: RiskPressureContribution[] = [];
  const rainPoints = precipitationPoints(Math.max(0, weather.precipitationMm));
  const feelsLikePoints = heatPoints(weather.apparentTemperatureC);
  const aqiPoints = airPoints(air.usAqi);

  if (rainPoints > 0) {
    contributions.push({
      id: "precipitation",
      kind: "environment",
      label: "Precipitation",
      points: rainPoints,
      reason: `${weather.precipitationMm.toFixed(1)} mm current precipitation adds ${rainPoints} pressure points.`,
    });
  }
  if (feelsLikePoints > 0) {
    contributions.push({
      id: "heat",
      kind: "environment",
      label: "Apparent heat",
      points: feelsLikePoints,
      reason: `${weather.apparentTemperatureC.toFixed(1)}°C apparent temperature adds ${feelsLikePoints} pressure points.`,
    });
  }
  if (aqiPoints > 0) {
    contributions.push({
      id: "air-quality",
      kind: "environment",
      label: "Air quality",
      points: aqiPoints,
      reason: `US AQI ${air.usAqi} adds ${aqiPoints} pressure points.`,
    });
  }

  const eventContributions = currentSignals
    .map((signal) => ({
      signal,
      points: Math.max(1, Math.round(severityPoints[signal.severity] * eventFreshness(signal, referenceTime))),
    }))
    .sort((left, right) => right.points - left.points);
  let eventBudget = 30;
  for (const { signal, points } of eventContributions) {
    if (eventBudget <= 0) break;
    const countedPoints = Math.min(points, eventBudget);
    contributions.push({
      id: `event-${signal.id}`,
      kind: "event",
      label: signal.title,
      points: countedPoints,
      reason: `${signal.severity} ${signal.behavior} event near ${signal.location}; freshness-adjusted and capped with all events at 30 points.`,
    });
    eventBudget -= countedPoints;
  }

  const rainIsActive = rainPoints > 0 || RAIN_CODES.has(weather.weatherCode);
  if (rainIsActive) {
    const floodSignal = currentSignals.find((signal) => FLOOD_TERMS.test(signalText(signal)));
    if (floodSignal) {
      contributions.push({
        id: "interaction-rain-flood",
        kind: "interaction",
        label: "Rain + flood exposure",
        points: 8,
        reason: `Current rain overlaps a flood, Yamuna or rising-water event near ${floodSignal.location}.`,
      });
    }

    const roadSignal = currentSignals.find((signal) =>
      signal.riskType === "traffic-disruption" && ROAD_INTERACTION_TERMS.test(signalText(signal)),
    );
    if (roadSignal) {
      contributions.push({
        id: "interaction-rain-road",
        kind: "interaction",
        label: "Rain + road disruption",
        points: 6,
        reason: `Current rain overlaps a protest, closure or congestion event near ${roadSignal.location}.`,
      });
    }
  }

  let remainingScore = 100;
  const cappedContributions = contributions.flatMap((contribution) => {
    if (remainingScore <= 0) return [];
    const points = Math.min(contribution.points, remainingScore);
    remainingScore -= points;
    return [{ ...contribution, points }];
  });
  const score = cappedContributions.reduce((total, item) => total + item.points, 0);
  const level = pressureLevel(score);
  return {
    score,
    level,
    summary: pressureSummary(level, currentSignals.length),
    activeEventCount: currentSignals.length,
    calculatedAt: referenceTime.toISOString(),
    inputs: {
      precipitationMm: weather.precipitationMm,
      apparentTemperatureC: weather.apparentTemperatureC,
      usAqi: air.usAqi,
      activeEventCount: currentSignals.length,
    },
    contributions: cappedContributions,
  };
}

const minutesFrom = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60 * 1000).toISOString();

const fallbackGeneratedAt = new Date();
const fallbackWeather: WeatherReading = {
  temperatureC: 31,
  apparentTemperatureC: 38,
  precipitationMm: 2.4,
  cloudCover: 86,
  windKph: 14,
  weatherCode: 63,
  isDay: isDelhiDaylight(),
};
const fallbackAir: AirReading = {
  usAqi: 92,
  pm25: 29,
};
const fallbackSignals: RiskSignal[] = [
  {
    id: "signal-mayur-vihar",
    category: "weather",
    title: "Waterlogging",
    location: "Mayur Vihar Phase I, Delhi",
    summary:
      "Street flooding is affecting traffic and pedestrian movement. This fixture remains marked for source reconciliation.",
    sourceName: "Delhi prototype fixture",
    sourceUrl: "/methodology#coverage",
    occurredAt: new Date(fallbackGeneratedAt.getTime() - 45 * 60 * 1000).toISOString(),
    coordinates: [77.296, 28.604],
    severity: "elevated",
    status: "verified",
  },
  {
    id: "signal-noida-62",
    category: "weather",
    title: "Water accumulation",
    location: "Sector 62, Noida",
    summary:
      "Water accumulation is disrupting road movement. Open the source link for the publisher's report.",
    sourceName: "NCR prototype fixture",
    sourceUrl: "/methodology#coverage",
    occurredAt: new Date(fallbackGeneratedAt.getTime() - 80 * 60 * 1000).toISOString(),
    coordinates: [77.365, 28.627],
    severity: "elevated",
    status: "verified",
  },
  {
    id: "signal-ghaziabad",
    category: "civic",
    title: "Electrical hazard",
    location: "Saraswati Vihar, Ghaziabad",
    summary:
      "A waterlogging-adjacent electrical hazard is in the prototype fixture set.",
    sourceName: "NCR prototype fixture",
    sourceUrl: "/methodology#coverage",
    occurredAt: new Date(fallbackGeneratedAt.getTime() - 115 * 60 * 1000).toISOString(),
    coordinates: [77.438, 28.67],
    severity: "severe",
    riskType: "life-safety",
    riskExplanation:
      "Standing water near an electrical hazard may expose people around Saraswati Vihar to electrocution or serious injury.",
    severityReason:
      "Severe because water and an active electrical hazard can create an immediate threat to life.",
    behavior: "live",
    status: "verified",
  },
];
const inspectableFallbackSignals = enrichCurrentRiskSignals(fallbackSignals, fallbackGeneratedAt);

export const fallbackSnapshot: RiskSnapshot = {
  scene: "rain",
  generatedAt: fallbackGeneratedAt.toISOString(),
  nextReviewAt: minutesFrom(fallbackGeneratedAt, 5),
  freshnessHours: 0,
  baseline: {
    micromortsPerAverageDay: 0.87,
    annualRatePer100k: 31.7,
    sourceYear: 2023,
    status: "reconciliation-pending",
  },
  weather: fallbackWeather,
  air: fallbackAir,
  signals: inspectableFallbackSignals,
  liveRiskPressure: calculateLiveRiskPressure(
    fallbackWeather,
    fallbackAir,
    inspectableFallbackSignals,
    fallbackGeneratedAt,
  ),
  coverageNote:
    "Recent signals are an automated prototype feed and may be incomplete or inaccurate. They never change the official baseline.",
};

export function withLiveReadings(
  weather: WeatherReading,
  air: AirReading,
  signals: RiskSignal[] = fallbackSnapshot.signals,
  referenceTime = new Date(),
): RiskSnapshot {
  const currentSignals = enrichCurrentRiskSignals(signals, referenceTime);
  const scene = chooseScene({
    ...weather,
    usAqi: air.usAqi,
    roadSignalCount: currentSignals.filter((signal) => signal.category === "road").length,
  });

  return {
    ...fallbackSnapshot,
    scene,
    generatedAt: referenceTime.toISOString(),
    nextReviewAt: minutesFrom(referenceTime, 5),
    freshnessHours: 0,
    weather,
    air,
    signals: currentSignals,
    liveRiskPressure: calculateLiveRiskPressure(weather, air, currentSignals, referenceTime),
  };
}
