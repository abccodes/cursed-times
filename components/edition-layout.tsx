"use client";

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import { ArchiveImage } from "@/components/archive-image";
import { HistoryWeather } from "@/components/history-weather";
import { MarketTicker } from "@/components/market-ticker";
import type { BooksListEntry, EditionPayload, StoryCard as StoryCardType } from "@/lib/types";

type LayoutProps = {
  edition: EditionPayload;
  selectedYear: number;
  isPending: boolean;
  onYearChange: (year: number) => void;
};

export function EditionLayout({
  edition,
  selectedYear,
  isPending,
  onYearChange,
}: LayoutProps) {
  const yearGap = edition.maxYear + 1 - edition.selectedYear;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftYear, setDraftYear] = useState(String(selectedYear));
  const [showIntroGlow, setShowIntroGlow] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftYear(String(selectedYear));
  }, [selectedYear]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setShowIntroGlow(false);

    const start = window.setTimeout(() => setShowIntroGlow(true), 1000);
    const stop = window.setTimeout(() => setShowIntroGlow(false), 3800);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, []);

  function submitDraft() {
    const numericYear = Number(draftYear);

    if (!Number.isInteger(numericYear)) {
      return;
    }

    const clampedYear = Math.max(edition.minYear, Math.min(edition.maxYear, numericYear));
    setDraftYear(String(clampedYear));
    setPickerOpen(false);
    onYearChange(clampedYear);
  }

  return (
    <main className="bg-[color:var(--news-bg)] px-3 py-3 sm:px-5">
      <div className="news-page mx-auto max-w-[1220px] bg-white px-5 pb-5 pt-2 sm:px-7 lg:px-9">
        <header className="edition-enter pb-2">
          <div className="flex items-start justify-between gap-4 text-[10px] uppercase tracking-[0.14em] text-[color:var(--news-muted)]">
            <div className="min-w-0 space-y-1">
              <p>{edition.anchorDateLabel}</p>
              <p>Today&apos;s paper, {yearGap} years too late</p>
            </div>
            <div className="hidden items-center gap-4 md:flex">
              <HistoryWeather targetDate={edition.targetDate} />
              <MarketTicker targetDate={edition.targetDate} />
              {isPending ? <span className="text-[color:var(--news-accent)]">Shifting year</span> : null}
            </div>
          </div>

          <div className="mt-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--news-muted)]">
              Inspired by The New York Times
            </p>
            <div className="mx-auto mt-1 max-w-[760px]">
              <MastheadLogo />
            </div>
            <p className="mt-1 text-[12px] text-[color:var(--news-muted)]">
              Read today&apos;s Times, except it&apos;s {yearGap} years old.
            </p>
          </div>

          <div className="mt-3 border-y border-[color:var(--news-line-strong)] py-2">
            <div className="relative flex flex-col gap-2 md:flex-row md:items-center md:justify-between" ref={pickerRef}>
              <div className="text-[11px] text-[color:var(--news-muted)]">
                Historical edition: <span className="font-semibold text-[color:var(--news-ink)]">{edition.targetDateLabel}</span>
              </div>

              <div className="relative self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setPickerOpen((open) => !open)}
                  className={clsx(
                    "news-pill news-pill-inactive flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]",
                    showIntroGlow ? "jump-button-glow" : "",
                  )}
                >
                  Jump to year
                  <span className={clsx("transition-transform", pickerOpen ? "rotate-180" : "")}>▾</span>
                </button>

                <div
                  className={clsx(
                    "year-picker-panel absolute right-0 top-[calc(100%+10px)] z-20 w-[260px] rounded-[18px] border border-[color:var(--news-line)] bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,0.12)]",
                    pickerOpen ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 -translate-y-1",
                  )}
                >
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--news-muted)]">
                    Same month and day
                  </p>
                  <p className="mt-2 text-[13px] leading-5 text-[color:var(--news-copy)]">
                    Enter any archive year from {edition.minYear} to {edition.maxYear}. The site keeps today&apos;s month and day fixed.
                  </p>

                  <div className="mt-4">
                    <label htmlFor="year-picker-input" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--news-muted)]">
                      Year
                    </label>
                    <input
                      id="year-picker-input"
                      value={draftYear}
                      onChange={(event) => setDraftYear(event.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          submitDraft();
                        }
                      }}
                      onBlur={submitDraft}
                      className="mt-2 w-full border border-[color:var(--news-line)] px-3 py-2 text-[15px] text-[color:var(--news-ink)] outline-none"
                      inputMode="numeric"
                    />
                  </div>

                  <input
                    type="range"
                    min={edition.minYear}
                    max={edition.maxYear}
                    value={Number(draftYear) || edition.defaultYear}
                    onChange={(event) => {
                      setDraftYear(event.target.value);
                    }}
                    onMouseUp={(event) => {
                      const year = Number((event.target as HTMLInputElement).value);
                      onYearChange(year);
                    }}
                    onTouchEnd={(event) => {
                      const year = Number((event.target as HTMLInputElement).value);
                      onYearChange(year);
                    }}
                    onKeyUp={(event) => {
                      const year = Number((event.target as HTMLInputElement).value);
                      onYearChange(year);
                    }}
                    className="mt-4 w-full"
                  />

                  <p className="mt-3 text-[10px] text-[color:var(--news-muted)]">
                    Press Enter after typing a year, or drag the slider.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {edition.status === "unavailable" ? (
          <UnavailableState edition={edition} />
        ) : (
          <EditionBody edition={edition} />
        )}
      </div>
    </main>
  );
}

function EditionBody({ edition }: { edition: EditionPayload }) {
  const hero = edition.hero!;
  const hasImageStories = edition.featuredImages.length > 0;
  const imageLead = edition.featuredImages[0] ?? hero;
  const rightFeature = edition.featuredImages[1] ?? edition.leadStories[0] ?? hero;
  const miniImageStories = edition.featuredImages.slice(2, 5);
  const lowerImageStory = edition.featuredImages[5] ?? imageLead;
  const leftColumnStories = edition.secondaryStories.slice(0, 4);
  const lowerStories = edition.secondaryStories.slice(4, 7);
  const digestStories = dedupeStories([
    ...edition.secondaryStories.slice(7),
    ...edition.sections.flatMap((section) => section.stories),
  ]);
  const railDigestStories = digestStories.slice(0, 8);
  const overflowDigestStories = digestStories.slice(8, 28);

  if (!hasImageStories) {
    return <ExpandedEdition edition={edition} />;
  }

  return (
    <>
      <section className="border-b border-[color:var(--news-line-strong)] py-4">
        <div className="grid gap-5 lg:grid-cols-[1.18fr_1.58fr_1.02fr]">
          <aside className="border-b border-[color:var(--news-line)] pb-3 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-4">
            <LeadTextStory story={hero} />
            <div className="mt-4 border-t border-[color:var(--news-line)] pt-3">
              {leftColumnStories.map((story, index) => (
                <AdaptiveTextStory
                  key={story.id}
                  story={story}
                  withDivider={index > 0}
                  preferred="compact"
                />
              ))}
            </div>
          </aside>

          <article className="lg:px-2">
            <CenterVisualStory story={imageLead} />
          </article>

          <aside className="border-t border-[color:var(--news-line)] pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            {rightFeature ? <FeatureSideStory story={rightFeature} /> : null}
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[color:var(--news-line)] pt-3">
              {miniImageStories.map((story) => (
                <MiniVisualCard key={story.id} label={story.section} story={story} />
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-5 border-b border-[color:var(--news-line-strong)] py-4 lg:grid-cols-[1.45fr_0.92fr]">
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[color:var(--news-line)] pb-2 text-[11px]">
            <span className="font-semibold text-[color:var(--news-ink)]">On This Day</span>
            <span className="text-[color:var(--news-accent)]">LIVE</span>
            <span className="text-[color:var(--news-muted)]">Coverage reconstructed from archive metadata</span>
          </div>

          <div className="mt-3 grid gap-4 md:grid-cols-[0.95fr_1.2fr]">
            <div className="space-y-5">
              {lowerStories.map((story) => (
                <AdaptiveTextStory key={story.id} story={story} preferred="bullet" />
              ))}
            </div>
            <div className="news-photo-frame min-h-[180px] overflow-hidden bg-[color:#efefef]">
              <ArchiveImage story={lowerImageStory} size="lower" />
            </div>
          </div>
        </div>

        <div className="border-t border-[color:var(--news-line)] pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--news-muted)]">
            More from the edition
          </p>
          <BalancedStoryColumns
            stories={railDigestStories}
            columns={2}
            className="mt-2 gap-4"
            estimateWeight={(story) => estimateDigestWeight(story)}
            renderStory={(story) => (
              <AdaptiveTextStory key={story.id} sectionName={story.section} story={story} preferred="digest" />
            )}
          />
        </div>
      </section>

      {overflowDigestStories.length > 0 ? (
        <section className="border-b border-[color:var(--news-line-strong)] py-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[color:var(--news-line)] pb-2 text-[11px]">
            <span className="font-semibold text-[color:var(--news-ink)]">Continued Coverage</span>
            <span className="text-[color:var(--news-muted)]">Additional reporting from this day&apos;s edition</span>
          </div>

          <BalancedStoryColumns
            stories={overflowDigestStories}
            columns={3}
            className="mt-4 gap-5"
            estimateWeight={(story) => estimateDigestWeight(story)}
            renderStory={(story) => (
              <AdaptiveTextStory key={story.id} sectionName={story.section} story={story} preferred="digest" />
            )}
          />
        </section>
      ) : null}

      {edition.books ? <BooksShelf books={edition.books} /> : null}

      <footer className="flex flex-col gap-2 pt-4 text-[10px] leading-5 text-[color:var(--news-muted)] md:flex-row md:items-end md:justify-between">
        <p className="max-w-3xl">
          Built from New York Times archive metadata and arranged into a single reconstructed landing page.
        </p>
        <p>{edition.totalStories} stories considered</p>
      </footer>
    </>
  );
}

function ExpandedEdition({ edition }: { edition: EditionPayload }) {
  const hero = edition.hero!;
  const supportStories = dedupeStories([
    ...edition.leadStories,
    ...edition.secondaryStories,
    ...edition.sections.flatMap((section) => section.stories),
  ]).filter((story) => story.id !== hero.id);

  const leftLeadCapacity = getLeadSupportCapacity(hero);
  const topSupportStories = supportStories.slice(0, 15);
  const leftLeadStories = topSupportStories.slice(0, leftLeadCapacity);
  const rightTopStories = topSupportStories.slice(leftLeadCapacity);
  const bottomStories = supportStories.slice(15, 36);

  return (
    <>
      <section className="border-b border-[color:var(--news-line-strong)] py-4">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_2.45fr]">
          <div className="border-b border-[color:var(--news-line)] pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
            <LeadTextStory story={hero} />
            {leftLeadStories.length > 0 ? (
              <div className="mt-5 border-t border-[color:var(--news-line)] pt-3">
                <div className={clsx("grid gap-3", leftLeadStories.length > 1 ? "sm:grid-cols-2" : "")}>
                  {leftLeadStories.slice(0, 2).map((story) => (
                    <AdaptiveTextStory key={`hero-${story.id}`} story={story} preferred="compact" />
                  ))}
                </div>

                {leftLeadStories.slice(2).length > 0 ? (
                  <div className="mt-3 space-y-3 border-t border-[color:var(--news-line)] pt-3">
                    {leftLeadStories.slice(2).map((story) => (
                      <AdaptiveTextStory
                        key={`hero-stack-${story.id}`}
                        sectionName={story.section}
                        story={story}
                        preferred="digest"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="lg:pl-6">
            <BalancedStoryColumns
              stories={rightTopStories}
              columns={3}
              className="gap-5"
              estimateWeight={(story, index) =>
                index < 4 ? estimateCompactWeight(story) : estimateDigestWeight(story)
              }
              renderStory={(story, index) =>
                index < 4 ? (
                  <AdaptiveTextStory story={story} withDivider={index > 0} preferred="compact" />
                ) : (
                  <AdaptiveTextStory sectionName={story.section} story={story} preferred="digest" />
                )
              }
            />
          </div>
        </div>
      </section>

      {bottomStories.length > 0 ? (
        <section className="border-b border-[color:var(--news-line-strong)] py-4">
          <BalancedStoryColumns
            stories={bottomStories}
            columns={3}
            className="gap-5"
            estimateWeight={(story, index) =>
              index % 5 === 0 ? estimateBulletWeight(story) : estimateDigestWeight(story)
            }
            renderStory={(story, index) =>
              index % 5 === 0 ? (
                <AdaptiveTextStory story={story} preferred="bullet" />
              ) : (
                <AdaptiveTextStory sectionName={story.section} story={story} preferred="digest" />
              )
            }
          />
        </section>
      ) : null}

      {edition.books ? <BooksShelf books={edition.books} /> : null}

      <footer className="flex flex-col gap-2 pt-4 text-[10px] leading-5 text-[color:var(--news-muted)] md:flex-row md:items-end md:justify-between">
        <p className="max-w-3xl">
          Built from New York Times archive metadata and arranged into a single reconstructed landing page.
        </p>
        <p>{edition.totalStories} stories considered</p>
      </footer>
    </>
  );
}

function dedupeStories(stories: StoryCardType[]) {
  const seen = new Set<string>();

  return stories.filter((story) => {
    if (seen.has(story.id)) {
      return false;
    }

    seen.add(story.id);
    return true;
  });
}

function BalancedStoryColumns({
  stories,
  columns,
  renderStory,
  estimateWeight,
  className,
}: {
  stories: StoryCardType[];
  columns: number;
  renderStory: (story: StoryCardType, index: number) => React.ReactNode;
  estimateWeight?: (story: StoryCardType, index: number) => number;
  className?: string;
}) {
  const layout = distributeStories(stories, columns, estimateWeight);

  return (
    <div className="space-y-4">
      <div className={clsx("grid", columns === 2 ? "md:grid-cols-2" : "lg:grid-cols-3", className)}>
        {layout.columns.map((column, columnIndex) => (
          <div key={`column-${columnIndex}`} className="space-y-3">
            {column.map((story) => renderStory(story.story, story.index))}
          </div>
        ))}
      </div>

      {layout.overflow.length > 0 ? (
        <div className="border-t border-[color:var(--news-line)] pt-4">
          <div className={clsx("grid gap-4", layout.overflow.length === 1 ? "" : "md:grid-cols-2")}>
            {layout.overflow.map((story) => renderStory(story.story, story.index))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function distributeStories(
  stories: StoryCardType[],
  columns: number,
  estimateWeight?: (story: StoryCardType, index: number) => number,
) {
  const buckets = Array.from({ length: columns }, () => ({
    height: 0,
    stories: [] as Array<{ story: StoryCardType; index: number }>,
  }));

  stories.forEach((story, index) => {
    const target = buckets.reduce((smallest, bucket) =>
      bucket.height < smallest.height ? bucket : smallest,
    );
    const weight = estimateWeight?.(story, index) ?? estimateStoryWeight(story);

    target.stories.push({ story, index });
    target.height += weight;
  });

  rebalanceBuckets(buckets, estimateWeight);

  const overflow = trimImbalancedColumns(buckets, estimateWeight);

  return {
    columns: buckets.map((bucket) => bucket.stories),
    overflow,
  };
}

function estimateStoryWeight(story: StoryCardType) {
  const headlineWeight = Math.ceil(story.headline.length / 36);
  const abstractWeight = Math.ceil(story.abstract.length / 120);
  const wordWeight = Math.min(8, Math.ceil(story.wordCount / 250));

  return headlineWeight + abstractWeight + wordWeight;
}

function estimateCompactWeight(story: StoryCardType) {
  return Math.max(2, Math.ceil(story.headline.length / 34) + Math.min(2, Math.ceil(story.wordCount / 700)));
}

function estimateDigestWeight(story: StoryCardType) {
  return estimateStoryWeight(story) + 1;
}

function estimateBulletWeight(story: StoryCardType) {
  return estimateStoryWeight(story) + 3;
}

function rebalanceBuckets(
  buckets: Array<{ height: number; stories: Array<{ story: StoryCardType; index: number }> }>,
  estimateWeight?: (story: StoryCardType, index: number) => number,
) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const tallest = buckets.reduce((largest, bucket) =>
      bucket.height > largest.height ? bucket : largest,
    );
    const shortest = buckets.reduce((smallest, bucket) =>
      bucket.height < smallest.height ? bucket : smallest,
    );

    if (tallest === shortest || tallest.stories.length <= 1) {
      return;
    }

    const spread = tallest.height - shortest.height;
    if (spread <= 3) {
      return;
    }

    const candidate = findMoveCandidate(tallest, shortest, estimateWeight);
    if (!candidate) {
      return;
    }

    const moved = tallest.stories.splice(candidate.position, 1)[0];
    tallest.height -= candidate.weight;
    shortest.stories.push(moved);
    shortest.height += candidate.weight;
  }
}

function trimImbalancedColumns(
  buckets: Array<{ height: number; stories: Array<{ story: StoryCardType; index: number }> }>,
  estimateWeight?: (story: StoryCardType, index: number) => number,
) {
  const overflow: Array<{ story: StoryCardType; index: number }> = [];

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const tallest = buckets.reduce((largest, bucket) =>
      bucket.height > largest.height ? bucket : largest,
    );
    const shortest = buckets.reduce((smallest, bucket) =>
      bucket.height < smallest.height ? bucket : smallest,
    );

    const spread = tallest.height - shortest.height;
    if (spread <= 4 || tallest.stories.length <= 2) {
      break;
    }

    const moved = tallest.stories.pop();
    if (!moved) {
      break;
    }

    const weight = estimateWeight?.(moved.story, moved.index) ?? estimateStoryWeight(moved.story);
    tallest.height -= weight;
    overflow.unshift(moved);
  }

  return overflow;
}

function findMoveCandidate(
  source: { height: number; stories: Array<{ story: StoryCardType; index: number }> },
  destination: { height: number; stories: Array<{ story: StoryCardType; index: number }> },
  estimateWeight?: (story: StoryCardType, index: number) => number,
) {
  let best:
    | {
        position: number;
        weight: number;
        diff: number;
      }
    | undefined;

  source.stories.forEach((entry, position) => {
    const weight = estimateWeight?.(entry.story, entry.index) ?? estimateStoryWeight(entry.story);
    const nextSource = source.height - weight;
    const nextDestination = destination.height + weight;
    const diff = Math.abs(nextSource - nextDestination);

    if (!best || diff < best.diff) {
      best = { position, weight, diff };
    }
  });

  return best;
}

function UnavailableState({ edition }: { edition: EditionPayload }) {
  return (
    <section className="flex min-h-[460px] flex-col items-center justify-center border-b border-[color:var(--news-line-strong)] px-6 py-16 text-center">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--news-muted)]">Archive unavailable</p>
      <h2 className="news-headline mt-4 text-[2rem] leading-tight">This date did not produce a usable edition.</h2>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[color:var(--news-copy)]">
        {edition.message} Try another year for the same month and day.
      </p>
    </section>
  );
}

function LeadTextStory({ story }: { story: StoryCardType }) {
  return (
    <article>
      <h2 className="news-headline text-[1.22rem] leading-[1.02] sm:text-[1.44rem]">{story.headline}</h2>
      <p className="mt-2 text-[13px] leading-6 text-[color:var(--news-copy)]">{truncateAbstract(story, 240)}</p>
      <div className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[color:var(--news-muted)]">
        {story.publishedLabel}
      </div>
    </article>
  );
}

function CenterVisualStory({ story }: { story: StoryCardType }) {
  return (
    <article>
      <div className="news-photo-frame overflow-hidden">
        <ArchiveImage story={story} size="hero" />
      </div>
    </article>
  );
}

function FeatureSideStory({ story }: { story: StoryCardType }) {
  return (
    <article>
      <div className="news-photo-frame overflow-hidden">
        <ArchiveImage story={story} size="feature" />
      </div>
      <h3 className="news-headline mt-2 text-[0.92rem] leading-[1.08]">{story.headline}</h3>
      <p className="mt-2 text-[12px] leading-5 text-[color:var(--news-copy)]">{story.abstract}</p>
      <StoryMeta story={story} />
    </article>
  );
}

function CompactHeadline({
  story,
  withDivider,
}: {
  story: StoryCardType;
  withDivider?: boolean;
}) {
  return (
    <article className={clsx(withDivider ? "border-t border-[color:var(--news-line)] pt-3" : "")}>
      <h3 className="news-headline text-[0.88rem] leading-[1.08]">{story.headline}</h3>
      <StoryMeta story={story} compact />
    </article>
  );
}

function MiniVisualCard({
  label,
  story,
}: {
  label: string;
  story: StoryCardType;
}) {
  return (
    <article>
      <div className="news-photo-frame overflow-hidden">
        <ArchiveImage story={story} size="mini" />
      </div>
      <p className="mt-2 text-[9px] uppercase tracking-[0.16em] text-[color:var(--news-muted)]">{label}</p>
      <h4 className="news-headline mt-1 text-[0.82rem] leading-[1.08]">{story.headline}</h4>
      <StoryMeta story={story} compact />
    </article>
  );
}

function BulletStory({ story }: { story: StoryCardType }) {
  const sectionLabel = displaySectionLabel(story.section);

  return (
    <article>
      {sectionLabel ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--news-accent)]">{sectionLabel}</p>
      ) : null}
      <h3 className="news-headline mt-2 text-[1.06rem] leading-[1.08]">{story.headline}</h3>
      <ul className="mt-3 list-disc space-y-1.5 pl-4 text-[12px] leading-5 text-[color:var(--news-copy)] marker:text-[color:var(--news-accent)]">
        <li>{story.abstract}</li>
      </ul>
      <div className="mt-3">
        <StoryMeta story={story} compact />
      </div>
    </article>
  );
}

function SectionDigest({
  sectionName,
  story,
}: {
  sectionName: string;
  story?: StoryCardType;
}) {
  if (!story) {
    return null;
  }

  const sectionLabel = displaySectionLabel(sectionName);

  return (
    <article className="border-b border-[color:var(--news-line)] pb-3 last:border-b-0 last:pb-0">
      {sectionLabel ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--news-muted)]">{sectionLabel}</p>
      ) : null}
      <h3 className="news-headline mt-1 text-[0.88rem] leading-[1.12]">{story.headline}</h3>
      <p className="mt-1 text-[12px] leading-5 text-[color:var(--news-copy)]">{truncateAbstract(story, 170)}</p>
      <StoryMeta story={story} compact />
    </article>
  );
}

function AdaptiveTextStory({
  story,
  sectionName,
  preferred,
  withDivider,
}: {
  story: StoryCardType;
  sectionName?: string;
  preferred: "compact" | "digest" | "bullet";
  withDivider?: boolean;
}) {
  if (preferred === "bullet" && shouldPromoteStory(story)) {
    return <BulletStory story={story} />;
  }

  if (preferred === "digest" && shouldExpandDigest(story)) {
    return <ExpandedDigest sectionName={sectionName ?? story.section} story={story} />;
  }

  return preferred === "compact" ? (
    <CompactHeadline story={story} withDivider={withDivider} />
  ) : (
    <SectionDigest sectionName={sectionName ?? story.section} story={story} />
  );
}

function ExpandedDigest({
  sectionName,
  story,
}: {
  sectionName: string;
  story: StoryCardType;
}) {
  const sectionLabel = displaySectionLabel(sectionName);

  return (
    <article className="border-b border-[color:var(--news-line)] pb-3 last:border-b-0 last:pb-0">
      {sectionLabel ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--news-muted)]">{sectionLabel}</p>
      ) : null}
      <h3 className="news-headline mt-1 text-[0.98rem] leading-[1.08]">{story.headline}</h3>
      <p className="mt-1.5 text-[12px] leading-[1.55] text-[color:var(--news-copy)]">
        {truncateAbstract(story, 260)}
      </p>
      <StoryMeta story={story} compact />
    </article>
  );
}

function StoryMeta({ story, compact = false }: { story: StoryCardType; compact?: boolean }) {
  return (
    <div className={clsx("mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] uppercase tracking-[0.14em] text-[color:var(--news-muted)]", compact ? "" : "pt-1")}>
      <span>{story.publishedLabel}</span>
      {story.originalUrl ? (
        <a href={story.originalUrl} target="_blank" rel="noreferrer" className="font-semibold text-[color:var(--news-ink)] underline underline-offset-2">
          View original
        </a>
      ) : null}
    </div>
  );
}

function BooksShelf({ books }: { books: NonNullable<EditionPayload["books"]> }) {
  return (
    <section className="border-b border-[color:var(--news-line-strong)] py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--news-line)] pb-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--news-muted)]">
            Books
          </p>
          <p className="mt-1 text-[12px] text-[color:var(--news-copy)]">
            Bestseller lists for the week of {formatBooksDate(books.publishedDate)}
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--news-muted)]">
          NYT Books overview
        </p>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        {books.lists.map((list) => (
          <div key={list.name} className="border-t border-[color:var(--news-line)] pt-3 lg:border-t-0 lg:border-l lg:pl-5 lg:first:border-l-0 lg:first:pl-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--news-muted)]">
              {list.name}
            </p>

            <div className="mt-3 space-y-4">
              {list.books.map((book) => (
                <BookEntry key={`${list.name}-${book.rank}-${book.title}`} book={book} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BookEntry({ book }: { book: BooksListEntry }) {
  return (
    <article className="flex gap-3">
      {book.imageUrl ? (
        <img
          src={book.imageUrl}
          alt={book.title}
          className="h-[82px] w-[56px] flex-none border border-[color:var(--news-line)] object-cover"
        />
      ) : null}

      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--news-muted)]">
          No. {book.rank}
        </p>
        <h3 className="news-headline mt-1 text-[0.95rem] leading-[1.08]">{book.title}</h3>
        <p className="mt-1 text-[12px] italic leading-5 text-[color:var(--news-copy)]">By {book.author}</p>
        {book.description ? (
          <p className="mt-1 text-[12px] leading-5 text-[color:var(--news-copy)]">
            {book.description}
          </p>
        ) : null}
        {book.buyUrl ? (
          <a
            href={book.buyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-[9px] font-semibold uppercase tracking-[0.14em] text-[color:var(--news-ink)] underline underline-offset-2"
          >
            View book
          </a>
        ) : null}
      </div>
    </article>
  );
}

function MastheadLogo() {
  return (
    <svg viewBox="0 0 1200 180" role="img" aria-label="The Cursed Times" className="masthead-logo h-auto w-full">
      <text
        x="600"
        y="118"
        textAnchor="middle"
        className="masthead-mark"
        fontSize="104"
        fontWeight="400"
        letterSpacing="-1.4"
      >
        The Cursed Times
      </text>
    </svg>
  );
}

function displaySectionLabel(sectionName: string) {
  return sectionName === "Archives" ? "" : sectionName;
}

function shouldPromoteStory(story: StoryCardType) {
  return story.wordCount >= 900 || story.abstract.length >= 190;
}

function shouldExpandDigest(story: StoryCardType) {
  return story.wordCount >= 700 || story.abstract.length >= 150 || story.headline.length >= 85;
}

function truncateAbstract(story: StoryCardType, maxLength: number) {
  if (story.abstract.length <= maxLength) {
    return story.abstract;
  }

  return `${story.abstract.slice(0, maxLength).trimEnd()}...`;
}

function getLeadSupportCapacity(story: StoryCardType) {
  if (story.wordCount < 350 && story.abstract.length < 150) {
    return 5;
  }

  if (story.wordCount < 650 && story.abstract.length < 210) {
    return 4;
  }

  return 2;
}

function formatBooksDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}
