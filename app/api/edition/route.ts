import { NextRequest, NextResponse } from "next/server";

import { getEdition } from "@/lib/edition";
import { parseYear } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const year = parseYear(request.nextUrl.searchParams.get("year"));
  const edition = await getEdition(year);

  return NextResponse.json(edition);
}
