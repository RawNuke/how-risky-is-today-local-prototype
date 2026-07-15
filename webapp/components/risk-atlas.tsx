"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDots,
  CaretDown,
  CheckCircle,
  Drop,
  Eye,
  Info,
  Moon,
  Pause,
  Play,
  ShieldCheck,
  Sun,
  Thermometer,
  Wind,
} from "@phosphor-icons/react";
import type { FeatureCollection, Point } from "geojson";
import { useEffect, useRef, useState } from "react";
import {
  STATIC_EVENT_MAX_AGE_MS,
  sceneCopy,
  isDelhiDaylight,
  type InspectableRiskSignal,
  type RiskSeverity,
  type RiskSnapshot,
  type RiskType,
  type Scene,
} from "@/lib/risk-engine";

const sceneColors: Record<Scene, string> = {
  rain: "#4bd6df",
  heat: "#ffb34f",
  haze: "#c7ad78",
  road: "#ff8a4c",
  quiet: "#75d5ae",
};

const daylightSceneColors: Record<Scene, string> = {
  rain: "#126f7c",
  heat: "#a55308",
  haze: "#76541f",
  road: "#a54121",
  quiet: "#176b57",
};

const riskTypeLabels: Record<RiskType, string> = {
  "life-safety": "Life safety",
  "traffic-disruption": "Traffic disruption",
  "environmental-exposure": "Environmental exposure",
  "public-safety": "Public safety",
  "institutional-safety": "Institutional safety",
};

const severityLabels: Record<RiskSeverity, string> = {
  low: "Low",
  guarded: "Guarded",
  elevated: "Elevated",
  high: "High",
  severe: "Severe",
};

function formatClock(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  })
    .format(new Date(iso))
    .toUpperCase();
}

function ageLabel(iso: string, referenceIso: string) {
  const minutes = Math.max(
    1,
    Math.round((new Date(referenceIso).getTime() - new Date(iso).getTime()) / 60000),
  );
  if (minutes < 60) return `${minutes} MIN AGO`;
  return `${Math.round(minutes / 60)} HR AGO`;
}

function signalGeoJson(
  signals: InspectableRiskSignal[],
  referenceTime: string,
): FeatureCollection<Point> {
  const referenceTimestamp = new Date(referenceTime).getTime();

  return {
    type: "FeatureCollection",
    features: signals.filter((signal) => signal.coordinates !== null).map((signal) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: signal.coordinates as [number, number] },
      properties: {
        id: signal.id,
        title: signal.title,
        severity: signal.severity,
        category: signal.category,
        location: signal.location,
        sourceUrl: signal.sourceUrl,
        sourceName: signal.sourceName,
        riskType: signal.riskType,
        riskExplanation: signal.riskExplanation,
        severityReason: signal.severityReason,
        behavior: signal.behavior,
        occurredAt: signal.occurredAt,
        recentHighRisk:
          (signal.severity === "high" || signal.severity === "severe")
          && referenceTimestamp - new Date(signal.occurredAt).getTime() <= STATIC_EVENT_MAX_AGE_MS,
      },
    })),
  };
}

function styleDelhiMap(map: import("maplibre-gl").Map, isDay: boolean, scene: Scene) {
  for (const layer of map.getStyle().layers ?? []) {
    const id = layer.id;
    const normalized = id.toLowerCase();
    try {
      if (layer.type === "background") {
        map.setPaintProperty(id, "background-color", isDay ? "#d8d2bd" : "#041014");
      }
      if (layer.type === "fill") {
        map.setPaintProperty(
          id,
          "fill-color",
          normalized.includes("water")
            ? isDay ? "#78aeb4" : "#0a5360"
            : isDay ? "#d4cdb5" : "#07161a",
        );
        map.setPaintProperty(id, "fill-opacity", normalized.includes("water") ? 0.82 : 0.68);
      }
      if (layer.type === "line") {
        const isRoad = normalized.includes("road") || normalized.includes("highway");
        const isBoundary = normalized.includes("boundary");
        const roadColor = scene === "road" ? "#d47a35" : isDay ? "#81765d" : "#756748";
        map.setPaintProperty(
          id,
          "line-color",
          isRoad ? roadColor : isBoundary ? (isDay ? "#667679" : "#71848a") : (isDay ? "#9d977f" : "#30464a"),
        );
        map.setPaintProperty(id, "line-opacity", isRoad ? (scene === "road" ? 0.82 : 0.58) : 0.38);
      }
      if (layer.type === "symbol") {
        const keepPlaceLabel = ["place", "settlement", "city", "town", "state", "country"]
          .some((token) => normalized.includes(token));
        if (!keepPlaceLabel) {
          map.setLayoutProperty(id, "visibility", "none");
          continue;
        }
        map.setPaintProperty(id, "text-color", isDay ? "#33474a" : "#aab9bd");
        map.setPaintProperty(id, "text-halo-color", isDay ? "#e4dfcd" : "#061216");
        map.setPaintProperty(id, "text-halo-width", 1.25);
        map.setPaintProperty(id, "icon-opacity", 0.35);
      }
      if (layer.type === "fill-extrusion") {
        map.setPaintProperty(id, "fill-extrusion-color", isDay ? "#b7af96" : "#10262a");
        map.setPaintProperty(id, "fill-extrusion-opacity", 0.36);
      }
    } catch {
      // Some third-party style layers intentionally omit mutable paint properties.
    }
  }
}

function DelhiMap({
  signals,
  scene,
  isDay,
  referenceTime,
}: {
  signals: InspectableRiskSignal[];
  scene: Scene;
  isDay: boolean;
  referenceTime: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const initialSignalsRef = useRef(signals);
  const initialSceneRef = useRef(scene);
  const initialIsDayRef = useRef(isDay);
  const initialReferenceTimeRef = useRef(referenceTime);
  const [mapReady, setMapReady] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    let animationFrame: number | null = null;

    async function startMap() {
      if (!containerRef.current || mapRef.current) return;
      const maplibre = await import("maplibre-gl");
      if (!active || !containerRef.current) return;

      const map = new maplibre.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [77.22, 28.58],
        zoom: 9.38,
        pitch: 24,
        bearing: 0,
        minZoom: 8,
        maxZoom: 14,
        attributionControl: false,
      });

      mapRef.current = map;
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        styleDelhiMap(map, initialIsDayRef.current, initialSceneRef.current);

        map.addSource("risk-signals", {
          type: "geojson",
          data: signalGeoJson(initialSignalsRef.current, initialReferenceTimeRef.current),
        });
        const severityColor = [
          "match",
          ["get", "severity"],
          "severe",
          "#ff704d",
          "high",
          "#ff875f",
          "elevated",
          "#ffb04f",
          "guarded",
          "#a9d17e",
          "#6dd7bc",
        ] as import("maplibre-gl").ExpressionSpecification;

        map.addLayer({
          id: "risk-signal-static-halo",
          type: "circle",
          source: "risk-signals",
          filter: ["==", ["get", "behavior"], "static"],
          paint: {
            "circle-radius": 13,
            "circle-color": severityColor,
            "circle-opacity": 0.2,
            "circle-blur": 0.32,
          },
        });
        map.addLayer({
          id: "risk-signal-live-glow",
          type: "circle",
          source: "risk-signals",
          filter: ["==", ["get", "behavior"], "live"],
          paint: {
            "circle-radius": 25,
            "circle-color": severityColor,
            "circle-opacity": 0.28,
            "circle-blur": 0.5,
          },
        });
        map.addLayer({
          id: "risk-signal-live-ring",
          type: "circle",
          source: "risk-signals",
          filter: ["==", ["get", "behavior"], "live"],
          paint: {
            "circle-radius": 11,
            "circle-color": "rgba(0, 0, 0, 0)",
            "circle-stroke-width": 1.75,
            "circle-stroke-color": severityColor,
            "circle-stroke-opacity": 0.88,
          },
        });
        map.addLayer({
          id: "risk-signal-recent-high-ambient",
          type: "circle",
          source: "risk-signals",
          filter: ["==", ["get", "recentHighRisk"], true],
          paint: {
            "circle-radius": 34,
            "circle-color": "#ff4f45",
            "circle-opacity": 0.17,
            "circle-blur": 0.72,
          },
        });
        map.addLayer({
          id: "risk-signal-recent-high-ring",
          type: "circle",
          source: "risk-signals",
          filter: ["==", ["get", "recentHighRisk"], true],
          paint: {
            "circle-radius": 22,
            "circle-color": "rgba(255, 79, 69, 0.025)",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ff4f45",
            "circle-stroke-opacity": 0.78,
          },
        });
        map.addLayer({
          id: "risk-signal-core",
          type: "circle",
          source: "risk-signals",
          paint: {
            "circle-radius": 6,
            "circle-color": "#071418",
            "circle-stroke-width": 3,
            "circle-stroke-color": severityColor,
          },
        });

        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const animateLiveGlow = (timestamp: number) => {
            if (!active || !map.getLayer("risk-signal-live-glow")) return;
            const cycle = (Math.sin(timestamp / 620) + 1) / 2;
            const incidentCycle = (Math.sin(timestamp / 980) + 1) / 2;
            map.setPaintProperty("risk-signal-live-glow", "circle-radius", 20 + cycle * 13);
            map.setPaintProperty("risk-signal-live-glow", "circle-opacity", 0.16 + cycle * 0.16);
            map.setPaintProperty("risk-signal-live-ring", "circle-radius", 10 + cycle * 5);
            map.setPaintProperty("risk-signal-live-ring", "circle-stroke-opacity", 0.9 - cycle * 0.48);
            map.setPaintProperty("risk-signal-recent-high-ambient", "circle-radius", 31 + incidentCycle * 8);
            map.setPaintProperty("risk-signal-recent-high-ambient", "circle-opacity", 0.12 + incidentCycle * 0.09);
            map.setPaintProperty("risk-signal-recent-high-ring", "circle-radius", 20 + incidentCycle * 5);
            map.setPaintProperty("risk-signal-recent-high-ring", "circle-stroke-opacity", 0.82 - incidentCycle * 0.24);
            animationFrame = window.requestAnimationFrame(animateLiveGlow);
          };
          animationFrame = window.requestAnimationFrame(animateLiveGlow);
        }
        map.on("mouseenter", "risk-signal-core", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "risk-signal-core", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("click", "risk-signal-core", (event) => {
          const feature = event.features?.[0];
          const properties = feature?.properties;
          if (!properties) return;

          const card = document.createElement("div");
          card.className = "map-risk-popup";
          const label = document.createElement("span");
          label.textContent = `${String(properties.riskType).replaceAll("-", " ").toUpperCase()} · ${String(properties.location)}`;
          const title = document.createElement("strong");
          title.textContent = String(properties.title);
          const explanation = document.createElement("p");
          explanation.textContent = String(properties.riskExplanation);
          const status = document.createElement("small");
          status.textContent = `${String(properties.severity).toUpperCase()} · ${String(properties.behavior).toUpperCase()}`;
          const source = document.createElement("a");
          source.textContent = `OPEN ${String(properties.sourceName)}`;
          source.href = String(properties.sourceUrl);
          source.target = "_blank";
          source.rel = "noreferrer";
          card.append(label, title, explanation, status, source);

          new maplibre.Popup({
            offset: 18,
            anchor: event.point.x > map.getCanvas().clientWidth / 2 ? "right" : "left",
            closeButton: true,
            className: "risk-popup-shell",
            maxWidth: "min(420px, calc(100vw - 32px))",
          })
            .setLngLat(event.lngLat)
            .setDOMContent(card)
            .addTo(map);
        });
        setMapReady(true);
      });

      map.on("error", (event) => {
        if (!map.loaded() && String(event.error?.message).includes("style")) {
          setMapUnavailable(true);
        }
      });
    }

    startMap().catch(() => setMapUnavailable(true));
    return () => {
      active = false;
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource("risk-signals") as
      | import("maplibre-gl").GeoJSONSource
      | undefined;
    source?.setData(signalGeoJson(signals, referenceTime));
  }, [signals, referenceTime, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    styleDelhiMap(map, isDay, scene);
  }, [scene, isDay, mapReady]);

  return (
    <div className="map-root" aria-label="Interactive map of Delhi and the National Capital Region">
      <div ref={containerRef} className="map-canvas" />
      {!mapReady && !mapUnavailable ? <div className="map-loading">READING DELHI / NCR…</div> : null}
      {mapUnavailable ? (
        <div className="map-fallback">
          <span>DELHI / NCR</span>
          <p>The live basemap is temporarily unavailable. Evidence and scene data remain readable.</p>
        </div>
      ) : null}
    </div>
  );
}

function AtmosphereStatus({ scene, isDay }: { scene: Scene; isDay: boolean }) {
  const DaylightIcon = isDay ? Sun : Moon;
  return (
    <div className="scene-selector" aria-live="polite">
      <div className="scene-trigger atmosphere-status">
        <DaylightIcon size={16} weight="duotone" />
        <span className="scene-trigger-copy">
          <span>
            LIVE DELHI · <strong>{isDay ? "DAYLIGHT" : "NIGHT"} · {sceneCopy[scene].label}</strong>
          </span>
          <small>WEATHER / AIR EVERY 5 MIN · EVIDENCE SCAN EVERY 2 HOURS</small>
        </span>
      </div>
    </div>
  );
}

function FeedRail({ signals, referenceTime }: { signals: InspectableRiskSignal[]; referenceTime: string }) {
  const [expanded, setExpanded] = useState(signals[0]?.id ?? "");

  return (
    <aside className="evidence-rail" aria-label="Located risk events">
      <div className="rail-heading">
        <div>
          <span>LOCATION-FILTERED RISK LAYER</span>
          <h2>{signals.length} LOCATED RISK EVENTS</h2>
        </div>
        <ShieldCheck size={23} weight="duotone" />
      </div>
      <div className="marker-legend" aria-label="Map event marker behavior">
        <span><i className="live" aria-hidden="true" /> LIVE · GLOWING</span>
        <span><i className="static" aria-hidden="true" /> STATIC · FIXED BLIP</span>
        <span><i className="recent-high" aria-hidden="true" /> HIGH / SEVERE · RECENT HALO</span>
      </div>
      <div className="signal-list">
        {signals.map((signal) => {
          const isOpen = expanded === signal.id;
          return (
            <article className={`signal-item severity-${signal.severity}`} key={signal.id}>
              <button
                type="button"
                className="signal-summary"
                aria-expanded={isOpen}
                onClick={() => setExpanded(isOpen ? "" : signal.id)}
              >
                <span className={`signal-dot behavior-${signal.behavior}`} aria-hidden="true" />
                <span className="signal-summary-copy">
                  <span className="signal-kicker">
                    {riskTypeLabels[signal.riskType]} · {signal.behavior}
                  </span>
                  <strong>{signal.title}</strong>
                  <small>{signal.location}</small>
                  <span className="signal-preview">{signal.riskExplanation}</span>
                  <span className="signal-publisher">PUBLISHER · {signal.sourceName}</span>
                  <span className="signal-summary-meta">
                    <span className="severity-pill">{severityLabels[signal.severity]}</span>
                    <time>{ageLabel(signal.occurredAt, referenceTime)}</time>
                    <span>{signal.status === "verified" ? "Verified" : "Auto-ingested"}</span>
                  </span>
                </span>
                <CaretDown size={14} className={isOpen ? "rotated" : ""} />
              </button>
              {isOpen ? (
                <div className="signal-detail">
                  <div className="signal-explanation">
                    <span>LIKELY CONSEQUENCE</span>
                    <p>{signal.riskExplanation}</p>
                  </div>
                  <div className="signal-reason">
                    <span>WHY {severityLabels[signal.severity].toUpperCase()}</span>
                    <p>{signal.severityReason}</p>
                  </div>
                  <p className="signal-context">{signal.summary}</p>
                  <a
                    className="signal-source"
                    href={signal.sourceUrl}
                    target={signal.sourceUrl.startsWith("http") ? "_blank" : undefined}
                    rel={signal.sourceUrl.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {signal.sourceName} <ArrowRight size={13} />
                  </a>
                  <span className="verified-label">
                    <CheckCircle size={14} weight="fill" />
                    {signal.behavior === "live" ? "LIVE CONDITION" : "ONE-OFF / STATIC INCIDENT"}
                  </span>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      <Link href="/incidents" className="rail-link">
        OPEN EVENT INDEX <ArrowRight size={16} />
      </Link>
    </aside>
  );
}

function LiveRiskPressure({ pressure }: { pressure: RiskSnapshot["liveRiskPressure"] }) {
  const visibleContributions = pressure.contributions.slice(0, 4);

  return (
    <section className={`live-pressure pressure-${pressure.level}`} aria-labelledby="pressure-title">
      <div className="pressure-heading">
        <div>
          <span>CONDITIONS LAYER · NOT MORTALITY</span>
          <h2 id="pressure-title">LIVE RISK PRESSURE</h2>
        </div>
        <div className="pressure-score" aria-label={`${pressure.score} out of 100, ${pressure.level}`}>
          <strong>{pressure.score}</strong><small>/100</small>
        </div>
      </div>
      <div className="pressure-meter" aria-hidden="true">
        <i style={{ width: `${pressure.score}%` }} />
      </div>
      <div className="pressure-level-row">
        <strong>{severityLabels[pressure.level]}</strong>
        <span>{pressure.activeEventCount} ACTIVE {pressure.activeEventCount === 1 ? "EVENT" : "EVENTS"}</span>
      </div>
      <p>{pressure.summary}</p>
      <div className="pressure-raw-inputs" aria-label="Current environmental inputs">
        <span>RAIN {pressure.inputs.precipitationMm.toFixed(1)} MM</span>
        <span>FEELS {Math.round(pressure.inputs.apparentTemperatureC)}°C</span>
        <span>AQI {pressure.inputs.usAqi === null ? "N/A" : Math.round(pressure.inputs.usAqi)}</span>
      </div>
      <div className="pressure-inputs" aria-label="Live Risk Pressure inputs">
        {visibleContributions.map((contribution) => (
          <div key={contribution.id} title={contribution.reason}>
            <span>{contribution.label}</span>
            <strong>+{contribution.points}</strong>
          </div>
        ))}
        {pressure.contributions.length > visibleContributions.length ? (
          <small>+ {pressure.contributions.length - visibleContributions.length} MORE INPUTS</small>
        ) : null}
      </div>
      <div className="pressure-legend" aria-label="Product interpretation scale">
        {(["low", "guarded", "elevated", "high", "severe"] as const).map((level) => (
          <span className={pressure.level === level ? "active" : ""} key={level}>{severityLabels[level]}</span>
        ))}
      </div>
      <small className="interpretation-note">PRODUCT INTERPRETATION · INPUTS ARE SHOWN ABOVE</small>
    </section>
  );
}

export function RiskAtlas({ initialSnapshot }: { initialSnapshot: RiskSnapshot }) {
  const [snapshot, setSnapshot] = useState<RiskSnapshot>(initialSnapshot);
  const [isDay, setIsDay] = useState(initialSnapshot.weather.isDay);
  const [playing, setPlaying] = useState(true);
  const [feedStatus, setFeedStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [baselineInfoOpen, setBaselineInfoOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadRisk = () => {
      setFeedStatus((current) => current === "live" ? current : "loading");
      fetch("/api/risk", { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("Risk feed unavailable");
          return response.json() as Promise<RiskSnapshot & { feedStatus?: "fallback" }>;
        })
        .then((next) => {
          setSnapshot(next);
          setFeedStatus(next.feedStatus === "fallback" ? "fallback" : "live");
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setFeedStatus("fallback");
          }
        });
    };

    loadRisk();
    const interval = window.setInterval(loadRisk, 5 * 60 * 1000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const syncDaylight = () => setIsDay(isDelhiDaylight());
    syncDaylight();
    const interval = window.setInterval(syncDaylight, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const activeScene = snapshot.scene;
  const hasClouds = activeScene === "rain" || snapshot.weather.cloudCover >= 45;
  const cloudOpacity = Math.min(0.52, 0.12 + snapshot.weather.cloudCover / 250);
  const rainOpacity = Math.min(0.72, 0.2 + snapshot.weather.precipitationMm / 8);
  const hazeOpacity = Math.min(0.62, 0.2 + Math.max(0, (snapshot.air.usAqi ?? 0) - 100) / 700);

  const generatedAt = snapshot.generatedAt;
  const nextReviewAt = snapshot.nextReviewAt;

  return (
    <main
      className={`atlas scene-${activeScene} time-${isDay ? "day" : "night"}`}
      style={{
        "--scene-color": isDay ? daylightSceneColors[activeScene] : sceneColors[activeScene],
        "--cloud-opacity": cloudOpacity,
        "--rain-opacity": rainOpacity,
        "--haze-opacity": hazeOpacity,
      } as React.CSSProperties}
    >
      <div className="map-stage" data-scene={activeScene}>
        <DelhiMap
          signals={snapshot.signals}
          scene={activeScene}
          isDay={isDay}
          referenceTime={generatedAt}
        />
        {hasClouds ? (
          <Image
            className="cloud-atmosphere"
            src="/atmosphere/monsoon-clouds.png"
            alt=""
            fill
            priority
            sizes="100vw"
          />
        ) : null}
        {activeScene === "rain" ? <div className="rain-atmosphere" aria-hidden="true" /> : null}
        {activeScene === "haze" ? (
          <div className="haze-atmosphere" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        ) : null}
        <div className="condition-wash" aria-hidden="true" />
      </div>

      <header className="atlas-header">
          <p>INTERNAL ARTIFACT · LOCATION-FILTERED RISK ATLAS</p>
        <h1>HOW RISKY IS TODAY?</h1>
        <div className="atlas-subline">
          <strong>DELHI / NCR</strong>
          <span>DAILY RISK ATLAS</span>
        </div>
        <div className="update-stamp">
          <span>UPDATED <strong>{formatClock(generatedAt)}</strong></span>
          <time>{formatDate(generatedAt)}</time>
        </div>
      </header>

      <AtmosphereStatus scene={activeScene} isDay={isDay} />

      <div className="freshness-pill" aria-live="polite">
        <Eye size={15} />
        <span>DATA FRESHNESS</span>
        <i className={feedStatus} aria-hidden="true" />
        <strong>{feedStatus === "loading" ? "CHECKING" : feedStatus === "live" ? "CURRENT" : "FALLBACK"}</strong>
        <Info size={15} />
      </div>

      <FeedRail signals={snapshot.signals} referenceTime={generatedAt} />

      <div className="reference-stack" aria-label="Risk reference and current pressure">
        <section className="baseline" aria-labelledby="baseline-title">
          <div className="baseline-number">
            <span>{snapshot.baseline.micromortsPerAverageDay.toFixed(2)}</span>
            <small>µmort/day</small>
          </div>
          <div className={`baseline-title-line ${baselineInfoOpen ? "is-open" : ""}`}>
            <h2 id="baseline-title">OFFICIAL BASELINE · AVERAGE DAY</h2>
            <button
              type="button"
              className="baseline-info-control"
              aria-label="Explain the official micromort baseline"
              aria-describedby="baseline-explanation"
              aria-expanded={baselineInfoOpen}
              onClick={() => setBaselineInfoOpen((current) => !current)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setBaselineInfoOpen(false);
                  event.currentTarget.blur();
                }
              }}
            >
              <Info size={15} weight="fill" />
            </button>
            <div className="baseline-explainer" id="baseline-explanation" role="note">
              <strong>WHAT THIS REFERENCE MEANS</strong>
              <p>One micromort is a one-in-a-million chance of death for a specified exposure and population.</p>
              <p>0.87 µmort/day is an average reference conversion—not a personal forecast or an exact measure for today.</p>
            </div>
          </div>
          <p>
            A stable official reference. Weather and located events never inflate this number.
          </p>
          <span className="baseline-reference-label"><i aria-hidden="true" /> STABLE REFERENCE · UNADJUSTED</span>
          {snapshot.baseline.status === "reconciliation-pending" ? (
            <Link href="/methodology#baseline" className="reconciliation-note">
              SOURCE RECONCILIATION PENDING <ArrowRight size={13} />
            </Link>
          ) : null}
        </section>

        <LiveRiskPressure pressure={snapshot.liveRiskPressure} />
      </div>

      <section className="timeline" aria-label="Five-minute environmental update timeline">
        <button
          type="button"
          className="play-control"
          aria-label={playing ? "Pause timeline" : "Play timeline"}
          onClick={() => setPlaying((current) => !current)}
        >
          {playing ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />}
        </button>
        <div className="timeline-track">
          <div className="track-line" />
          {["12 AM", "4 AM", "8 AM", "NOW", "+5 MIN"].map((label, index) => (
            <span className={`timeline-stop ${index === 3 ? "current" : ""}`} key={label}>
              <i />
              <small>{label}</small>
            </span>
          ))}
          <div className={`timeline-progress ${playing ? "playing" : ""}`} />
        </div>
        <div className="timeline-now">
          <strong>NOW</strong>
          <CalendarDots size={23} />
        </div>
        <div className="timeline-caption">
          <span>TODAY&apos;S ATMOSPHERE</span>
          <strong>{sceneCopy[activeScene].label}</strong>
          <small>NEXT WEATHER {formatClock(nextReviewAt)}</small>
        </div>
      </section>

      <nav className="quiet-nav" aria-label="Public pages">
        <Link href="/incidents">SIGNALS</Link>
        <Link href="/ledger">LEDGER</Link>
        <Link href="/methodology">METHOD</Link>
      </nav>

      <div className="conditions-readout" aria-label="Current conditions">
        <span><Thermometer size={14} /> {Math.round(snapshot.weather.temperatureC)}°C</span>
        <span><Drop size={14} /> {snapshot.weather.precipitationMm.toFixed(1)} MM</span>
        <span><Wind size={14} /> {Math.round(snapshot.weather.windKph)} KM/H</span>
        {snapshot.air.usAqi !== null ? <span>AQI {Math.round(snapshot.air.usAqi)}</span> : null}
      </div>
    </main>
  );
}
