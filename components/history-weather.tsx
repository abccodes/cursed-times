"use client";

import { useEffect, useState } from "react";

type WeatherPayload =
  | {
      status: "ok";
      label: string;
      high: number;
      low: number;
      precipitation: number;
    }
  | {
      status: "unavailable";
    };

type Coordinates = {
  latitude: number;
  longitude: number;
};

export function HistoryWeather({ targetDate }: { targetDate: string }) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    let cancelled = false;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) {
          return;
        }

        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        if (!cancelled) {
          setCoords(null);
        }
      },
      {
        maximumAge: 1000 * 60 * 30,
        timeout: 8000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!coords) {
      setWeather(null);
      return;
    }

    const activeCoords = coords;
    let cancelled = false;

    async function loadWeather() {
      try {
        const params = new URLSearchParams({
          date: targetDate,
          lat: String(activeCoords.latitude),
          lon: String(activeCoords.longitude),
        });

        const response = await fetch(`/api/weather?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as WeatherPayload;

        if (!cancelled) {
          setWeather(payload);
        }
      } catch {
        if (!cancelled) {
          setWeather(null);
        }
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [coords, targetDate]);

  if (!weather || weather.status !== "ok") {
    return null;
  }

  const showPrecipitation = weather.precipitation > 0;

  return (
    <div className="text-[11px] font-medium text-[color:var(--news-ink)]">
      <span className="text-[color:var(--news-muted)]">Local weather</span>{" "}
      {weather.high}° / {weather.low}° {weather.label}
      {showPrecipitation ? (
        <span className="text-[color:var(--news-muted)]"> · {weather.precipitation}" precip.</span>
      ) : null}
    </div>
  );
}
