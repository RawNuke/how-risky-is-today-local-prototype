import { NextResponse } from "next/server";
import {
  fallbackSnapshot,
  withLiveReadings,
  type AirReading,
  type WeatherReading,
} from "@/lib/risk-engine";
import { getSignalFirehose, hasPublicDataConfig } from "@/lib/public-data";

export const dynamic = "force-dynamic";

const DELHI = { latitude: 28.6139, longitude: 77.209 };

interface OpenMeteoWeatherResponse {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    cloud_cover?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    is_day?: number;
  };
}

interface OpenMeteoAirResponse {
  current?: {
    us_aqi?: number;
    pm2_5?: number;
  };
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

async function fetchWeather(): Promise<WeatherReading> {
  const params = new URLSearchParams({
    latitude: String(DELHI.latitude),
    longitude: String(DELHI.longitude),
    current:
      "temperature_2m,apparent_temperature,precipitation,cloud_cover,wind_speed_10m,weather_code,is_day",
    timezone: "Asia/Kolkata",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(4500),
  });

  if (!response.ok) throw new Error(`Weather feed returned ${response.status}`);
  const payload = (await response.json()) as OpenMeteoWeatherResponse;
  const current = payload.current;
  if (!current || !isNumber(current.temperature_2m)) {
    throw new Error("Weather feed did not include a current reading");
  }

  return {
    temperatureC: current.temperature_2m,
    apparentTemperatureC: isNumber(current.apparent_temperature)
      ? current.apparent_temperature
      : current.temperature_2m,
    precipitationMm: isNumber(current.precipitation) ? current.precipitation : 0,
    cloudCover: isNumber(current.cloud_cover) ? current.cloud_cover : 0,
    windKph: isNumber(current.wind_speed_10m) ? current.wind_speed_10m : 0,
    weatherCode: isNumber(current.weather_code) ? current.weather_code : 0,
    isDay: current.is_day === 1,
  };
}

async function fetchAir(): Promise<AirReading> {
  const params = new URLSearchParams({
    latitude: String(DELHI.latitude),
    longitude: String(DELHI.longitude),
    current: "us_aqi,pm2_5",
    domains: "cams_global",
    timezone: "Asia/Kolkata",
  });
  const response = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`,
    {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4500),
    },
  );

  if (!response.ok) throw new Error(`Air feed returned ${response.status}`);
  const payload = (await response.json()) as OpenMeteoAirResponse;
  return {
    usAqi: isNumber(payload.current?.us_aqi) ? payload.current.us_aqi : null,
    pm25: isNumber(payload.current?.pm2_5) ? payload.current.pm2_5 : null,
  };
}

export async function GET() {
  const signals = hasPublicDataConfig()
    ? await getSignalFirehose().catch(() => [])
    : fallbackSnapshot.signals;

  try {
    const [weather, air] = await Promise.all([fetchWeather(), fetchAir()]);
    return NextResponse.json(withLiveReadings(weather, air, signals), {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ...fallbackSnapshot,
        signals,
        feedStatus: "fallback",
        feedMessage:
          error instanceof Error ? error.message : "Live feeds are temporarily unavailable",
      },
      {
        headers: { "Cache-Control": "public, max-age=60" },
      },
    );
  }
}
