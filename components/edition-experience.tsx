"use client";

import { useEffect, useState } from "react";

import type { EditionPayload } from "@/lib/types";
import { EditionLayout } from "@/components/edition-layout";

type Props = {
  initialEdition: EditionPayload;
};

export function EditionExperience({ initialEdition }: Props) {
  const [selectedYear, setSelectedYear] = useState(initialEdition.selectedYear);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setSelectedYear(initialEdition.selectedYear);
    setIsPending(false);
  }, [initialEdition]);

  function handleYearChange(year: number) {
    if (year === selectedYear) {
      return;
    }

    setSelectedYear(year);
    setIsPending(true);

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("year", String(year));
    window.location.assign(nextUrl.toString());
  }

  return (
    <EditionLayout
      edition={initialEdition}
      isPending={isPending}
      selectedYear={selectedYear}
      onYearChange={handleYearChange}
    />
  );
}
