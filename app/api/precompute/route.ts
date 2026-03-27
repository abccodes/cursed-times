import { NextRequest, NextResponse } from "next/server";

import { precomputeTodaysEditions } from "@/lib/precompute";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET ?? process.env.PRECOMPUTE_SECRET;

  if (secret) {
    const provided =
      request.nextUrl.searchParams.get("secret") ??
      request.headers.get("x-precompute-secret") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const results = await precomputeTodaysEditions();
  return NextResponse.json({
    status: "ok",
    results,
  });
}
