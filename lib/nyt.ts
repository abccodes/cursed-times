import { getArchiveMonthKey, readStorageJson, writeStorageJson } from "@/lib/storage";
import type { ArchiveArticle } from "@/lib/types";

type NytDoc = {
  _id: string;
  web_url?: string;
  abstract?: string;
  headline?: {
    main?: string;
  };
  section_name?: string;
  subsection_name?: string;
  pub_date?: string;
  word_count?: number;
  type_of_material?: string;
  news_desk?: string;
  print_page?: string;
  multimedia?: Array<{
    url?: string;
    subtype?: string;
  }>;
  keywords?: Array<{
    value?: string;
  }>;
};

type NytArchiveResponse = {
  response?: {
    docs?: NytDoc[];
  };
};

type ArchiveFetchStatus = "cache" | "fresh_fetch" | "rate_limited" | "upstream_error" | "empty_data";
const inflightMonthRequests = new Map<string, Promise<{ docs: NytDoc[]; status: ArchiveFetchStatus }>>();

export async function getArchiveArticles(
  targetDate: string,
): Promise<{ articles: ArchiveArticle[]; sourceStatus: ArchiveFetchStatus }> {
  const apiKey = process.env.NYT_ARCHIVE_API_KEY;

  if (!apiKey) {
    return { articles: [], sourceStatus: "upstream_error" };
  }

  const [year, month] = targetDate.split("-").map(Number);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  try {
    const { docs, status } = await getMonthDocs(monthKey, year, month, apiKey);
    const articles = docs
      .map(normalizeArticle)
      .filter((article): article is ArchiveArticle => Boolean(article))
      .filter((article) => article.publishedAt.startsWith(targetDate));

    if (articles.length === 0) {
      return { articles: [], sourceStatus: status === "cache" ? "empty_data" : status };
    }

    return { articles, sourceStatus: status };
  } catch {
    return { articles: [], sourceStatus: "upstream_error" };
  }
}

async function getMonthDocs(
  monthKey: string,
  year: number,
  month: number,
  apiKey: string,
): Promise<{ docs: NytDoc[]; status: ArchiveFetchStatus }> {
  const cacheKey = getArchiveMonthKey(year, month);
  const cached = await readStorageJson<NytDoc[]>(cacheKey);

  if (cached) {
    return { docs: cached, status: "cache" };
  }

  const existingRequest = inflightMonthRequests.get(monthKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetchMonthDocs(year, month, apiKey)
    .then(async (result) => {
      if (result.status === "fresh_fetch") {
        await writeStorageJson(cacheKey, result.docs);
      }

      return result;
    })
    .catch(async (error) => {
      if (cached) {
        return { docs: cached, status: "cache" as const };
      }

      throw error;
    })
    .finally(() => {
      inflightMonthRequests.delete(monthKey);
    });

  inflightMonthRequests.set(monthKey, request);

  return request;
}

async function fetchMonthDocs(year: number, month: number, apiKey: string) {
  const url = `https://api.nytimes.com/svc/archive/v1/${year}/${month}.json?api-key=${apiKey}`;
  const response = await fetch(url, {
    cache: "no-store",
  });

  if (response.status === 429) {
    return { docs: [], status: "rate_limited" as const };
  }

  if (!response.ok) {
    return { docs: [], status: "upstream_error" as const };
  }

  const payload = (await response.json()) as NytArchiveResponse;
  return { docs: payload.response?.docs ?? [], status: "fresh_fetch" as const };
}

function normalizeArticle(doc: NytDoc): ArchiveArticle | null {
  const headline = doc.headline?.main?.trim();
  const publishedAt = doc.pub_date;
  const section = normalizeSection(doc.section_name, doc.news_desk);

  if (!headline || !publishedAt || !section) {
    return null;
  }

  return {
    id: doc._id,
    headline,
    abstract: doc.abstract?.trim() || "Archived coverage from this day in Times history.",
    section,
    subsection: doc.subsection_name ?? undefined,
    publishedAt,
    wordCount: doc.word_count ?? 0,
    url: doc.web_url,
    imageUrl: normalizeImage(doc.multimedia),
    mediaWeight: doc.multimedia?.length ? 1 : 0,
    printPage: Number(doc.print_page) || undefined,
    source: "api",
    materialType: doc.type_of_material,
    keywords: doc.keywords?.map((keyword) => keyword.value ?? "").filter(Boolean),
    frontPageHint: doc.news_desk === "National" || doc.news_desk === "Foreign",
    desk: doc.news_desk,
  };
}

function normalizeSection(sectionName?: string, desk?: string) {
  const raw = (sectionName || desk || "").trim();

  switch (raw) {
    case "U.S.":
    case "National":
      return "U.S.";
    case "World":
    case "Foreign":
      return "World";
    case "Business Day":
      return "Business";
    case "Technology":
      return "Technology";
    case "Arts":
    case "Movies":
    case "Theater":
    case "Books":
      return "Arts / Culture";
    case "Sports":
      return "Sports";
    case "Business":
    case "Arts / Culture":
      return raw;
    default:
      return raw || null;
  }
}

function normalizeImage(
  multimedia?: Array<{
    url?: string;
    subtype?: string;
    type?: string;
    legacy?: {
      xlarge?: string;
    };
    crop_name?: string;
  }>,
) {
  const imageItems = (multimedia ?? []).filter((item) => item.type === "image" || !item.type);
  const preferred =
    imageItems.find((item) => item.subtype === "xlarge") ??
    imageItems.find((item) => item.crop_name === "articleLarge") ??
    imageItems.find((item) => item.legacy?.xlarge) ??
    imageItems[0];

  const candidateUrl = preferred?.legacy?.xlarge ?? preferred?.url;

  if (!candidateUrl) {
    return undefined;
  }

  if (candidateUrl.startsWith("http")) {
    return candidateUrl;
  }

  return `https://static01.nyt.com/${candidateUrl.replace(/^\//, "")}`;
}
