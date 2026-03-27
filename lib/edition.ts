import { getBooksModule } from "@/lib/books";
import { getDateInfo } from "@/lib/date";
import { getArchiveArticles } from "@/lib/nyt";
import { buildEditionLayout } from "@/lib/ranking";
import { getEditionKey, readStorageJson, writeStorageJson } from "@/lib/storage";
import type { EditionPayload } from "@/lib/types";

export async function getEdition(selectedYear: number): Promise<EditionPayload> {
  const dateInfo = getDateInfo(selectedYear);
  const editionKey = getEditionKey(dateInfo.targetDate);
  const cachedEdition = await readStorageJson<EditionPayload>(editionKey);

  if (cachedEdition) {
    return {
      ...cachedEdition,
      sourceStatus: "cache",
    };
  }

  const [{ articles, sourceStatus }, books] = await Promise.all([
    getArchiveArticles(dateInfo.targetDate),
    getBooksModule(dateInfo.targetDate),
  ]);

  if (articles.length === 0) {
    const unavailableEdition: EditionPayload = {
      status: "unavailable",
      sourceStatus,
      selectedYear: dateInfo.selectedYear,
      defaultYear: dateInfo.defaultYear,
      minYear: dateInfo.minYear,
      maxYear: dateInfo.maxYear,
      anchorDate: dateInfo.anchorDate,
      anchorDateLabel: dateInfo.anchorDateLabel,
      targetDate: dateInfo.targetDate,
      targetDateLabel: dateInfo.targetDateLabel,
      timezone: dateInfo.timezone,
      usedFallbackDay: dateInfo.usedFallbackDay,
      message:
        sourceStatus === "rate_limited"
          ? "The archive source is temporarily rate-limited. Try again later or choose a cached year."
          : sourceStatus === "upstream_error"
            ? "The archive source could not be reached right now."
            : "No usable archive stories were returned for this date.",
      featuredImages: [],
      leadStories: [],
      secondaryStories: [],
      sections: [],
      books,
      totalStories: 0,
    };

    if (sourceStatus === "empty_data") {
      await writeStorageJson(editionKey, unavailableEdition);
    }

    return unavailableEdition;
  }

  const layout = buildEditionLayout(articles);

  const edition: EditionPayload = {
    status: "ok",
    sourceStatus,
    selectedYear: dateInfo.selectedYear,
    defaultYear: dateInfo.defaultYear,
    minYear: dateInfo.minYear,
    maxYear: dateInfo.maxYear,
    anchorDate: dateInfo.anchorDate,
    anchorDateLabel: dateInfo.anchorDateLabel,
    targetDate: dateInfo.targetDate,
    targetDateLabel: dateInfo.targetDateLabel,
    timezone: dateInfo.timezone,
    usedFallbackDay: dateInfo.usedFallbackDay,
    hero: layout.hero,
    featuredImages: layout.featuredImages,
    leadStories: layout.leadStories,
    secondaryStories: layout.secondaryStories,
    sections: layout.sections,
    books,
    totalStories: layout.totalStories,
  };

  await writeStorageJson(editionKey, edition);
  return edition;
}
