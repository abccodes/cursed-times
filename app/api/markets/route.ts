import { NextRequest, NextResponse } from "next/server";

type QuotePayload = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

const MARKETS = [
  { label: "S&P 500", symbol: "%5EGSPC" },
  { label: "Dow", symbol: "%5EDJI" },
  { label: "Nasdaq", symbol: "%5EIXIC" },
] as const;

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ items: [] });
  }

  const items = await Promise.all(
    MARKETS.map(async (market) => {
      try {
        const { period1, period2 } = buildPeriods(date);
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${market.symbol}?period1=${period1}&period2=${period2}&interval=1d&includePrePost=false&events=div%2Csplits`,
          { next: { revalidate: 60 * 60 * 24 } },
        );

        if (!response.ok) {
          return null;
        }

        const payload = (await response.json()) as QuotePayload;
        const result = payload.chart?.result?.[0];
        const timestamps = result?.timestamp ?? [];
        const closes = result?.indicators?.quote?.[0]?.close ?? [];
        const entries = timestamps
          .map((timestamp, index) => ({
            timestamp,
            close: closes[index],
          }))
          .filter((entry): entry is { timestamp: number; close: number } => typeof entry.close === "number");

        if (entries.length < 2) {
          return null;
        }

        const targetTs = Math.floor(new Date(`${date}T23:59:59Z`).getTime() / 1000);
        const onOrBefore = entries.filter((entry) => entry.timestamp <= targetTs);

        if (onOrBefore.length < 2) {
          return null;
        }

        const current = onOrBefore[onOrBefore.length - 1].close;
        const previous = onOrBefore[onOrBefore.length - 2].close;

        return {
          label: market.label,
          changePercent: ((current - previous) / previous) * 100,
        };
      } catch {
        return null;
      }
    }),
  );

  return NextResponse.json({
    items: items.filter(Boolean),
  });
}

function buildPeriods(date: string) {
  const target = new Date(`${date}T12:00:00Z`);
  const period1 = Math.floor(new Date(target.getTime() - 14 * 24 * 60 * 60 * 1000).getTime() / 1000);
  const period2 = Math.floor(new Date(target.getTime() + 2 * 24 * 60 * 60 * 1000).getTime() / 1000);

  return { period1, period2 };
}
