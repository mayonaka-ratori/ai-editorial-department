import QRCode from "qrcode";
import ScreenClient from "@/components/ScreenClient";
import { computeCover } from "@/lib/cover";
import { getAfterwords } from "@/lib/afterword";
import { computeStats } from "@/lib/stats";
import { getSettings, issueTitle } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Screen() {
  const settings = await getSettings();
  const cover = await computeCover(settings);
  const afterwords = await getAfterwords(cover.issue);
  const stats = await computeStats(settings);
  const appUrl = process.env.APP_URL || "";
  const qr = appUrl ? await QRCode.toDataURL(appUrl, { margin: 0, width: 220, color: { dark: "#070b16", light: "#ffffff" } }) : "";
  return <ScreenClient initial={{ ...cover, issueTitle: issueTitle(cover.issue), afterwords, total: stats.total, topReasons: stats.topReasons }} qr={qr} appUrl={appUrl} />;
}
