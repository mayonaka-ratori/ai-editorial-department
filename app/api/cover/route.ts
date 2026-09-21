import { NextResponse } from "next/server";
import { computeCover, mineIds } from "@/lib/cover";
import { getAfterwords } from "@/lib/afterword";
import { computeStats } from "@/lib/stats";
import { getSettings, issueTitle } from "@/lib/settings";
import { readDevice } from "@/lib/device";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  const cover = await computeCover(settings);
  const afterwords = await getAfterwords(cover.issue);
  const stats = await computeStats(settings);
  const device = await readDevice();
  const mine = device.isNew ? [] : await mineIds(device.id, cover.issue);
  return NextResponse.json({ ...cover, issueTitle: issueTitle(cover.issue), afterwords, total: stats.total, topReasons: stats.topReasons, mine });
}
