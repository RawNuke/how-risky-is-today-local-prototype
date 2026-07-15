import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateLiveRiskPressure,
  deriveEventRiskIntelligence,
  enrichCurrentRiskSignals,
  fallbackSnapshot,
  withLiveReadings,
  type AirReading,
  type RiskSignal,
  type WeatherReading,
} from "../lib/risk-engine";

const referenceTime = new Date("2026-07-14T12:00:00.000Z");

function signal(overrides: Partial<RiskSignal> = {}): RiskSignal {
  return {
    id: "event-1",
    category: "road",
    title: "Continuing protest at Jantar Mantar",
    location: "Jantar Mantar",
    summary: "Road closures and diversions are causing congestion around the venue.",
    sourceName: "Example publisher",
    sourceUrl: "https://example.com/event-1",
    occurredAt: "2026-07-14T10:00:00.000Z",
    coordinates: [77.2166, 28.6272],
    severity: "elevated",
    status: "automated",
    ...overrides,
  };
}

const quietWeather: WeatherReading = {
  temperatureC: 30,
  apparentTemperatureC: 33,
  precipitationMm: 0,
  cloudCover: 10,
  windKph: 8,
  weatherCode: 0,
  isDay: true,
};

const cleanAir: AirReading = { usAqi: 80, pm25: 22 };

test("derives inspectable live traffic intelligence for a continuing protest", () => {
  const result = deriveEventRiskIntelligence(signal(), referenceTime);

  assert.equal(result.riskType, "traffic-disruption");
  assert.equal(result.behavior, "live");
  assert.equal(result.expiresAt, "2026-07-14T16:00:00.000Z");
  assert.match(result.riskExplanation, /closures, diversions, crowds and congestion/i);
  assert.match(result.severityReason, /credible local hazard|material disruption/i);
});

test("treats a hospital incident as static institutional risk and caps retention at seven days", () => {
  const result = deriveEventRiskIntelligence(signal({
    category: "civic",
    title: "Hospital negligence incident reported",
    location: "SCI International Hospital, Greater Kailash I",
    summary: "A couple filed an FIR alleging deception after treatment went wrong.",
    occurredAt: "2026-07-10T08:00:00.000Z",
    expiresAt: "2026-08-10T08:00:00.000Z",
    severity: "guarded",
  }), referenceTime);

  assert.equal(result.riskType, "institutional-safety");
  assert.equal(result.behavior, "static");
  assert.equal(result.expiresAt, "2026-07-17T08:00:00.000Z");
  assert.match(result.riskExplanation, /not treated as a citywide continuing threat/i);
});

test("identifies Yamuna flooding as live life-safety exposure", () => {
  const result = deriveEventRiskIntelligence(signal({
    category: "weather",
    title: "Yamuna levels rising near low-lying homes",
    location: "Yamuna floodplain",
    summary: "Flooding warning remains active.",
    severity: "high",
  }), referenceTime);

  assert.equal(result.riskType, "life-safety");
  assert.equal(result.behavior, "live");
  assert.match(result.riskExplanation, /river and low-lying areas/i);
});

test("preserves supplied inspectable reasoning and an explicit live expiry", () => {
  const result = deriveEventRiskIntelligence(signal({
    riskType: "public-safety",
    riskExplanation: "Publisher-specific consequence explanation.",
    severityReason: "Publisher-specific inspectable reason.",
    behavior: "live",
    expiresAt: "2026-07-16T10:00:00.000Z",
  }), referenceTime);

  assert.equal(result.riskType, "public-safety");
  assert.equal(result.riskExplanation, "Publisher-specific consequence explanation.");
  assert.equal(result.severityReason, "Publisher-specific inspectable reason.");
  assert.equal(result.expiresAt, "2026-07-16T10:00:00.000Z");
});

test("removes expired live and seven-day-old static events from the public snapshot", () => {
  const current = signal({ id: "current" });
  const expiredLive = signal({
    id: "expired-live",
    occurredAt: "2026-07-13T10:00:00.000Z",
  });
  const expiredStatic = signal({
    id: "expired-static",
    title: "Collision reported",
    summary: "A one-off collision was reported.",
    occurredAt: "2026-07-07T11:59:59.000Z",
  });

  assert.deepEqual(
    enrichCurrentRiskSignals([current, expiredLive, expiredStatic], referenceTime)
      .map((item) => item.id),
    ["current"],
  );
});

test("scores environmental, event and interaction pressure with inspectable reasons", () => {
  const weather: WeatherReading = {
    ...quietWeather,
    apparentTemperatureC: 46,
    precipitationMm: 3,
    weatherCode: 63,
  };
  const air: AirReading = { usAqi: 180, pm25: 78 };
  const flood = signal({
    id: "flood",
    category: "weather",
    title: "Yamuna flood warning remains active",
    location: "Yamuna floodplain",
    summary: "Rising water is affecting low-lying areas.",
    severity: "high",
  });

  const pressure = calculateLiveRiskPressure(weather, air, [signal(), flood], referenceTime);

  assert.equal(pressure.score, 56);
  assert.equal(pressure.level, "high");
  assert.equal(pressure.activeEventCount, 2);
  assert.deepEqual(pressure.inputs, {
    precipitationMm: 3,
    apparentTemperatureC: 46,
    usAqi: 180,
    activeEventCount: 2,
  });
  assert.ok(pressure.contributions.some((item) => item.id === "interaction-rain-flood"));
  assert.ok(pressure.contributions.some((item) => item.id === "interaction-rain-road"));
  assert.equal(
    pressure.contributions.reduce((total, item) => total + item.points, 0),
    pressure.score,
  );
  assert.match(pressure.summary, /not a mortality probability/i);
});

test("expired events do not add live pressure", () => {
  const expired = signal({ occurredAt: "2026-07-13T10:00:00.000Z" });
  const pressure = calculateLiveRiskPressure(quietWeather, cleanAir, [expired], referenceTime);

  assert.equal(pressure.score, 0);
  assert.equal(pressure.activeEventCount, 0);
  assert.deepEqual(pressure.contributions, []);
});

test("withLiveReadings leaves the official 0.87 baseline unchanged", () => {
  const snapshot = withLiveReadings(
    { ...quietWeather, precipitationMm: 20, weatherCode: 65 },
    { usAqi: 350, pm25: 150 },
    [signal({ severity: "severe" })],
    referenceTime,
  );

  assert.equal(snapshot.baseline.micromortsPerAverageDay, 0.87);
  assert.deepEqual(snapshot.baseline, fallbackSnapshot.baseline);
  assert.ok(snapshot.liveRiskPressure.score > 0);
  assert.equal(snapshot.signals.length, 1);
  assert.equal(snapshot.signals[0].riskType, "traffic-disruption");
});

test("pressure score is capped at 100 while each contribution remains inspectable", () => {
  const manySevereEvents = Array.from({ length: 10 }, (_, index) => signal({
    id: `severe-${index}`,
    severity: "severe",
    title: index === 0 ? "Yamuna flood warning remains active" : `Continuing protest ${index}`,
  }));
  const pressure = calculateLiveRiskPressure(
    { ...quietWeather, apparentTemperatureC: 48, precipitationMm: 25, weatherCode: 65 },
    { usAqi: 400, pm25: 180 },
    manySevereEvents,
    referenceTime,
  );

  assert.equal(pressure.score, 100);
  assert.equal(
    pressure.contributions.reduce((total, item) => total + item.points, 0),
    pressure.score,
  );
  assert.ok(pressure.contributions.every((item) => item.points > 0 && item.reason.length > 0));
});
