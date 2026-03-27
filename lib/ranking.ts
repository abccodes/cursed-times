import type { ArchiveArticle, SectionBlock, StoryCard } from "@/lib/types";

const publishedLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const SECTION_PRIORITY: Record<string, number> = {
  World: 28,
  "U.S.": 26,
  Business: 20,
  Technology: 18,
  "Arts / Culture": 14,
  Arts: 14,
  Sports: 12,
};

export function buildEditionLayout(articles: ArchiveArticle[]) {
  const ranked = dedupeArticles(articles)
    .filter(isEligible)
    .map((article) => ({
      article,
      score: scoreArticle(article),
      imageScore: scoreImageArticle(article),
    }))
    .sort((left, right) => right.score - left.score);

  if (ranked.length === 0) {
    throw new Error("No articles available to build the edition.");
  }

  const selected = new Set<string>();
  const heroEntry = ranked[0];
  selected.add(heroEntry.article.id);

  const leadStories = takeWithDiversity(ranked, selected, 4);
  const secondaryStories = takeWithDiversity(ranked, selected, 8);
  const sections = buildSectionBlocks(ranked, selected);
  const featuredImages = ranked
    .filter((entry) => Boolean(entry.article.imageUrl))
    .sort((left, right) => right.imageScore - left.imageScore)
    .slice(0, 7)
    .map((entry, index) => toStoryCard(entry.article, entry.score, index + 20));

  return {
    hero: toStoryCard(heroEntry.article, heroEntry.score, 0),
    featuredImages,
    leadStories: leadStories.map((entry, index) => toStoryCard(entry.article, entry.score, index + 1)),
    secondaryStories: secondaryStories.map((entry, index) => toStoryCard(entry.article, entry.score, index + 4)),
    sections,
    totalStories: ranked.length,
  };
}

function takeWithDiversity(
  ranked: Array<{ article: ArchiveArticle; score: number; imageScore: number }>,
  selected: Set<string>,
  count: number,
) {
  const picked: Array<{ article: ArchiveArticle; score: number; imageScore: number }> = [];
  const seenSections = new Set<string>();

  for (const entry of ranked) {
    if (selected.has(entry.article.id)) {
      continue;
    }

    if (seenSections.has(entry.article.section) && picked.length < count - 1) {
      continue;
    }

    selected.add(entry.article.id);
    seenSections.add(entry.article.section);
    picked.push(entry);

    if (picked.length === count) {
      break;
    }
  }

  if (picked.length < count) {
    for (const entry of ranked) {
      if (selected.has(entry.article.id)) {
        continue;
      }

      selected.add(entry.article.id);
      picked.push(entry);

      if (picked.length === count) {
        break;
      }
    }
  }

  return picked;
}

function buildSectionBlocks(
  ranked: Array<{ article: ArchiveArticle; score: number; imageScore: number }>,
  selected: Set<string>,
): SectionBlock[] {
  const desiredSections = ["U.S.", "World", "Business", "Technology", "Arts / Culture", "Sports"];

  return desiredSections
    .map((sectionName) => {
      const stories = ranked
        .filter((entry) => entry.article.section === sectionName && !selected.has(entry.article.id))
        .slice(0, 6)
        .map((entry, index) => {
          selected.add(entry.article.id);
          return toStoryCard(entry.article, entry.score, index + 10);
        });

      return {
        name: sectionName,
        stories,
      };
    })
    .filter((section) => section.stories.length > 0);
}

function dedupeArticles(articles: ArchiveArticle[]) {
  const seen = new Set<string>();

  return articles.filter((article) => {
    const key = `${article.headline.toLowerCase()}::${article.url ?? article.id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function isEligible(article: ArchiveArticle) {
  const material = (article.materialType ?? "").toLowerCase();
  const headline = article.headline.toLowerCase();

  if (material.includes("correction")) {
    return false;
  }

  if (headline.includes("paid notice") || headline.includes("corrections")) {
    return false;
  }

  return article.abstract.length > 30;
}

function scoreArticle(article: ArchiveArticle) {
  let score = 0;

  score += SECTION_PRIORITY[article.section] ?? 8;
  score += article.frontPageHint ? 18 : 0;
  score += article.printPage ? Math.max(0, 12 - article.printPage) : 0;
  score += Math.min(article.wordCount / 180, 12);
  score += (article.mediaWeight ?? 0) * 8;
  score += article.abstract.length > 120 ? 4 : 0;
  score += (article.materialType ?? "").toLowerCase() === "news" ? 4 : 0;
  score -= (article.materialType ?? "").toLowerCase().includes("brief") ? 4 : 0;

  return Number(score.toFixed(2));
}

function scoreImageArticle(article: ArchiveArticle) {
  let score = scoreArticle(article);

  score += (article.mediaWeight ?? 0) * 18;
  score += article.frontPageHint ? 6 : 0;
  score += article.printPage === 1 ? 4 : 0;

  return Number(score.toFixed(2));
}

function toStoryCard(article: ArchiveArticle, score: number, _index: number): StoryCard {
  return {
    id: article.id,
    headline: article.headline,
    abstract: article.abstract,
    section: article.section,
    publishedLabel: formatPublishedLabel(article.publishedAt),
    originalUrl: article.url,
    imageUrl: article.imageUrl,
    score,
    wordCount: article.wordCount,
  };
}

function formatPublishedLabel(publishedAt: string) {
  const isoDate = publishedAt.slice(0, 10);
  return publishedLabelFormatter.format(new Date(`${isoDate}T12:00:00Z`));
}
