import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { get as getBlob, put as putBlob } from "@vercel/blob";

const STORAGE_ROOT = path.join(process.cwd(), ".cache", "cursed-times-store");
const BLOB_ENABLED = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

type CacheEnvelope<T> = {
  storedAt: string;
  value: T;
};

const memoryStore = new Map<string, unknown>();

export async function readStorageJson<T>(key: string): Promise<T | null> {
  if (memoryStore.has(key)) {
    return memoryStore.get(key) as T;
  }

  if (BLOB_ENABLED) {
    try {
      const result = await getBlob(key, {
        access: "private",
      });

      if (!result) {
        return null;
      }

      const raw = await streamToString(result.stream);
      const parsed = JSON.parse(raw) as CacheEnvelope<T>;

      if (!parsed || typeof parsed !== "object" || !("value" in parsed)) {
        return null;
      }

      memoryStore.set(key, parsed.value);
      return parsed.value;
    } catch {
      return null;
    }
  }

  try {
    const raw = await readFile(resolveKeyPath(key), "utf8");
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;

    if (!parsed || typeof parsed !== "object" || !("value" in parsed)) {
      return null;
    }

    memoryStore.set(key, parsed.value);
    return parsed.value;
  } catch {
    return null;
  }
}

export async function writeStorageJson<T>(key: string, value: T) {
  const envelope = {
    storedAt: new Date().toISOString(),
    value,
  } satisfies CacheEnvelope<T>;

  if (BLOB_ENABLED) {
    await putBlob(key, JSON.stringify(envelope), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    memoryStore.set(key, value);
    return;
  }

  const resolved = resolveKeyPath(key);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(
    resolved,
    JSON.stringify(envelope),
    "utf8",
  );
  memoryStore.set(key, value);
}

export function getArchiveMonthKey(year: number, month: number) {
  return `nyt/archive/${year}/${String(month).padStart(2, "0")}.json`;
}

export function getBooksKey(targetDate: string) {
  return `nyt/books/${targetDate}.json`;
}

export function getEditionKey(targetDate: string) {
  return `editions/${targetDate}.json`;
}

function resolveKeyPath(key: string) {
  const safeKey = key.replace(/^\//, "");
  return path.join(STORAGE_ROOT, safeKey);
}

async function streamToString(stream: ReadableStream<Uint8Array> | null) {
  if (!stream) {
    return "";
  }

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    chunks.push(value);
  }

  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(merged);
}
