import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type OpenMeteoDaily = {
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
};

type OpenMeteoResponse = {
  daily?: OpenMeteoDaily;
};

const MIN_WEATHER_YEAR = 1940;

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const latitude = Number(request.nextUrl.searchParams.get("lat"));
  const longitude = Number(request.nextUrl.searchParams.get("lon"));

  if (!date || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ error: "Missing date or coordinates." }, { status: 400 });
  }

  const year = Number(date.slice(0, 4));
  if (!Number.isInteger(year) || year < MIN_WEATHER_YEAR) {
    return NextResponse.json({ status: "unavailable" });
  }

  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));
  url.searchParams.set("start_date", date);
  url.searchParams.set("end_date", date);
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
  );
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("precipitation_unit", "inch");
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(url.toString(), { cache: "no-store" });

    if (!response.ok) {
      return NextResponse.json({ status: "unavailable" });
    }

    const payload = (await response.json()) as OpenMeteoResponse;
    const daily = payload.daily;

    const high = daily?.temperature_2m_max?.[0];
    const low = daily?.temperature_2m_min?.[0];
    const precipitation = daily?.precipitation_sum?.[0] ?? 0;
    const weatherCode = daily?.weather_code?.[0];

    if (typeof high !== "number" || typeof low !== "number") {
      return NextResponse.json({ status: "unavailable" });
    }

    return NextResponse.json({
      status: "ok",
      label: describeWeatherCode(weatherCode),
      high: Math.round(high),
      low: Math.round(low),
      precipitation: Number(precipitation.toFixed(2)),
    });
  } catch {
    return NextResponse.json({ status: "unavailable" });
  }
}

function describeWeatherCode(code?: number) {
  switch (code) {
    case 0:
      return "Clear";
    case 1:
    case 2:
    case 3:
      return "Cloudy";
    case 45:
    case 48:
      return "Fog";
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return "Drizzle";
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
      return "Rain";
    case 71:
    case 73:
    case 75:
    case 77:
      return "Snow";
    case 80:
    case 81:
    case 82:
      return "Showers";
    case 85:
    case 86:
      return "Snow Showers";
    case 95:
    case 96:
    case 99:
      return "Storms";
    default:
      return "Conditions";
  }
}
