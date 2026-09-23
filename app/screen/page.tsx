import QRCode from "qrcode";
import ScreenClient from "@/components/ScreenClient";
import { computeCover } from "@/lib/cover";
import { getAfterwords } from "@/lib/afterword";
import { computeStats } from "@/lib/stats";
import { getSettings, issueTitle } from "@/lib/settings";
import { appUrl as resolveAppUrl } from "@/lib/appurl";

export const dynamic = "force-dynamic";

export default async function Screen() {
  const settings = await getSettings();
  const cover = await computeCover(settings);
  const afterwords = await getAfterwords(cover.issue);
  const stats = await computeStats(settings);
  const appUrl = await resolveAppUrl();
  // QRコードは遊び方のページに向ける。読み終えたら、そのまま雑誌を選ぶ画面へ進める。
  const guideUrl = appUrl ? `${appUrl.replace(/\/$/, "")}/guide` : "";
  const qr = guideUrl ? await QRCode.toDataURL(guideUrl, { margin: 0, width: 220, color: { dark: "#070b16", light: "#ffffff" } }) : "";
  return <ScreenClient initial={{ ...cover, issueTitle: issueTitle(cover.issue), afterwords, total: stats.total, topReasons: stats.topReasons }} qr={qr} appUrl={guideUrl} />;
}
