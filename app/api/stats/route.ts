import { NextResponse } from "next/server";
import { computeStats } from "@/lib/stats";
import { getSettings } from "@/lib/settings";
import { peek, todayKey } from "@/lib/throttle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  const stats = await computeStats(settings);
  const used = await peek(`day:${todayKey()}`);
  const cap = Number(settings.daily_cap || 3000);
  return NextResponse.json({ ...stats, used, cap, remaining: Math.max(0, cap - used), accepting: settings.accepting === "1" });
}
