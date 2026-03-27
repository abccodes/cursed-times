"use client";

import clsx from "clsx";
import { useState } from "react";

import type { StoryCard } from "@/lib/types";

type ArchiveImageProps = {
  story: StoryCard;
  size: "hero" | "feature" | "mini" | "lower";
  className?: string;
};

export function ArchiveImage({ story, size, className }: ArchiveImageProps) {
  const [failed, setFailed] = useState(false);

  if (!story.imageUrl || failed) {
    return <PlaceholderArt story={story} size={size} className={className} />;
  }

  return (
    <img
      src={story.imageUrl}
      alt={story.headline}
      className={clsx(className, imageClasses[size])}
      onError={() => setFailed(true)}
    />
  );
}

function PlaceholderArt({
  story,
  size,
  className,
}: {
  story: StoryCard;
  size: "hero" | "feature" | "mini" | "lower";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex w-full flex-col justify-between bg-[linear-gradient(180deg,#d9d3cb,#b2aaa0)] text-[#f9f6f0]",
        placeholderClasses[size],
        className,
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] opacity-90">{story.section}</p>
      <p className={clsx("news-headline max-w-[80%] leading-tight", headlineClasses[size])}>{story.headline}</p>
      {size !== "mini" ? (
        <p className="text-[9px] uppercase tracking-[0.2em] opacity-90">Archive image unavailable</p>
      ) : null}
    </div>
  );
}

const imageClasses = {
  hero: "h-[215px] w-full object-cover sm:h-[295px] lg:h-[330px]",
  feature: "h-[145px] w-full object-cover",
  mini: "h-[72px] w-full object-cover",
  lower: "h-full w-full object-cover grayscale-[0.08]",
} as const;

const placeholderClasses = {
  hero: "h-[215px] p-4 sm:h-[295px] lg:h-[330px]",
  feature: "h-[145px] p-3",
  mini: "h-[72px] p-2",
  lower: "h-full min-h-[200px] p-4",
} as const;

const headlineClasses = {
  hero: "text-[1.5rem] sm:text-[2rem]",
  feature: "text-[0.95rem]",
  mini: "text-[0.7rem]",
  lower: "text-[1.35rem]",
} as const;
