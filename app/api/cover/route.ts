import { NextResponse } from "next/server";
import { computeCover } from "@/lib/cover";
import { getAfterwords } from "@/lib/afterword";
import { computeStats } from "@/lib/stats";
import { getSettings, issueTitle } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  const cover = await computeCover(settings);
  const afterwords = await getAfterwords(cover.issue);
  const stats = await computeStats(settings);
  return NextResponse.json({
    ...cover,
    issueTitle: issueTitle(cover.issue),
    afterwords,
    total: stats.total,
    topReasons: stats.topReasons,
    accepting: settings.accepting === "1",
  });
}
