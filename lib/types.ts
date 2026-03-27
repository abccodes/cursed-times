export type ArchiveArticle = {
  id: string;
  headline: string;
  abstract: string;
  section: string;
  subsection?: string;
  publishedAt: string;
  wordCount: number;
  url?: string;
  imageUrl?: string;
  mediaWeight?: number;
  printPage?: number;
  source?: "api" | "demo";
  materialType?: string;
  keywords?: string[];
  frontPageHint?: boolean;
  desk?: string;
};

export type StoryCard = {
  id: string;
  headline: string;
  abstract: string;
  section: string;
  publishedLabel: string;
  originalUrl?: string;
  imageUrl?: string;
  score: number;
  wordCount: number;
};

export type SectionBlock = {
  name: string;
  stories: StoryCard[];
};

export type EditionSourceStatus =
  | "cache"
  | "fresh_fetch"
  | "rate_limited"
  | "upstream_error"
  | "empty_data";

export type BooksListEntry = {
  rank: number;
  title: string;
  author: string;
  description: string;
  imageUrl?: string;
  buyUrl?: string;
};

export type BooksList = {
  name: string;
  books: BooksListEntry[];
};

export type BooksModule = {
  publishedDate: string;
  bestsellersDate: string;
  lists: BooksList[];
};

export type EditionPayload = {
  status: "ok" | "unavailable";
  sourceStatus: EditionSourceStatus;
  selectedYear: number;
  defaultYear: number;
  minYear: number;
  maxYear: number;
  anchorDate: string;
  anchorDateLabel: string;
  targetDate: string;
  targetDateLabel: string;
  timezone: string;
  usedFallbackDay: boolean;
  message?: string;
  hero?: StoryCard;
  featuredImages: StoryCard[];
  leadStories: StoryCard[];
  secondaryStories: StoryCard[];
  sections: SectionBlock[];
  books: BooksModule | null;
  totalStories: number;
};
