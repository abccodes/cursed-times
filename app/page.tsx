import { EditionExperience } from "@/components/edition-experience";
import { getEdition } from "@/lib/edition";
import { parseYear } from "@/lib/date";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams?: Promise<{
    year?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const initialYear = parseYear(params?.year);
  const initialEdition = await getEdition(initialYear);

  return <EditionExperience initialEdition={initialEdition} />;
}
