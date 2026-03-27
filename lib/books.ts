import { getBooksKey, readStorageJson, writeStorageJson } from "@/lib/storage";
import type { BooksModule, BooksList, BooksListEntry } from "@/lib/types";

type NytBooksBook = {
  rank?: number;
  title?: string;
  author?: string;
  description?: string;
  book_image?: string;
  amazon_product_url?: string;
};

type NytBooksList = {
  list_name?: string;
  display_name?: string;
  books?: NytBooksBook[];
};

type NytBooksResponse = {
  results?: {
    published_date?: string;
    bestsellers_date?: string;
    lists?: NytBooksList[];
  };
};

export async function getBooksModule(targetDate: string): Promise<BooksModule | null> {
  if (targetDate < "2008-06-15") {
    return null;
  }

  const cacheKey = getBooksKey(targetDate);
  const cached = await readStorageJson<BooksModule | null>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  const apiKey = process.env.NYT_ARCHIVE_API_KEY;
  if (!apiKey) {
    return null;
  }

  const url = `https://api.nytimes.com/svc/books/v3/lists/overview.json?published_date=${targetDate}&api-key=${apiKey}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as NytBooksResponse;
    const lists = (payload.results?.lists ?? [])
      .map(normalizeList)
      .filter((list): list is BooksList => Boolean(list))
      .slice(0, 3);

    if (lists.length === 0) {
      await writeStorageJson(cacheKey, null);
      return null;
    }

    const moduleData = {
      publishedDate: payload.results?.published_date ?? targetDate,
      bestsellersDate: payload.results?.bestsellers_date ?? payload.results?.published_date ?? targetDate,
      lists,
    };

    await writeStorageJson(cacheKey, moduleData);
    return moduleData;
  } catch {
    return null;
  }
}

function normalizeList(list: NytBooksList): BooksList | null {
  const name = list.display_name?.trim() || list.list_name?.trim();
  const books = (list.books ?? [])
    .map(normalizeBook)
    .filter((book): book is BooksListEntry => Boolean(book))
    .slice(0, 3);

  if (!name || books.length === 0) {
    return null;
  }

  return {
    name,
    books,
  };
}

function normalizeBook(book: NytBooksBook): BooksListEntry | null {
  const title = book.title?.trim();
  const author = book.author?.trim();

  if (!title || !author) {
    return null;
  }

  return {
    rank: book.rank ?? 0,
    title,
    author,
    description: book.description?.trim() || "",
    imageUrl: book.book_image ?? undefined,
    buyUrl: book.amazon_product_url ?? undefined,
  };
}
