import { getAnchorDateParts } from "@/lib/date";
import { getEdition } from "@/lib/edition";

const COMMON_YEAR_GAPS = [1, 5, 10, 20, 30, 50];

export async function precomputeTodaysEditions(now = new Date()) {
  const anchor = getAnchorDateParts(now);
  const years = Array.from(
    new Set(
      COMMON_YEAR_GAPS.map((gap) => anchor.year - gap).filter((year) => year >= 1851 && year < anchor.year),
    ),
  );

  const results = await Promise.allSettled(
    years.map(async (year) => {
      const edition = await getEdition(year);
      return {
        year,
        status: edition.status,
        sourceStatus: edition.sourceStatus,
        totalStories: edition.totalStories,
      };
    }),
  );

  return results.map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : {
          year: years[index],
          status: "failed" as const,
          sourceStatus: "upstream_error" as const,
          totalStories: 0,
        },
  );
}
