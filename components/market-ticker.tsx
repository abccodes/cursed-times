"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";

type MarketItem = {
  label: string;
  changePercent: number;
};

export function MarketTicker({ targetDate }: { targetDate: string }) {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/markets?date=${targetDate}`, { cache: "no-store" });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { items?: MarketItem[] };

        if (!cancelled) {
          setItems(payload.items ?? []);
          setIndex(0);
          setVisible(true);
        }
      } catch {
        // Keep the header quiet if market data cannot be fetched.
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [targetDate]);

  useEffect(() => {
    if (items.length === 0) {
      setIndex(0);
      return;
    }

    if (index >= items.length) {
      setIndex(0);
    }
  }, [items, index]);

  useEffect(() => {
    if (items.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setVisible(false);

      window.setTimeout(() => {
        setIndex((current) => (current + 1) % items.length);
        setVisible(true);
      }, 220);
    }, 2600);

    return () => window.clearInterval(interval);
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  const item = items[index];

  if (!item) {
    return null;
  }

  const positive = item.changePercent >= 0;

  return (
    <div className={clsx("market-fade text-[11px] font-medium", visible ? "opacity-100" : "opacity-0")}>
      <span className="text-[color:var(--news-ink)]">{item.label}</span>{" "}
      <span className={positive ? "text-[color:#2f8f4e]" : "text-[color:#b3261e]"}>
        {positive ? "+" : ""}
        {item.changePercent.toFixed(2)}% {positive ? "↑" : "↓"}
      </span>
    </div>
  );
}
