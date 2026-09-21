import CoverClient from "@/components/CoverClient";
import { computeCover } from "@/lib/cover";
import { getAfterwords } from "@/lib/afterword";
import { computeStats } from "@/lib/stats";
import { getSettings, issueTitle } from "@/lib/settings";
import { isEditorKey } from "@/lib/editors";

export const dynamic = "force-dynamic";

export default async function CoverPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const settings = await getSettings();
  const cover = await computeCover(settings);
  const afterwords = await getAfterwords(cover.issue);
  const stats = await computeStats(settings);
  return (
    <CoverClient
      initial={{ ...cover, issueTitle: issueTitle(cover.issue), afterwords, total: stats.total, topReasons: stats.topReasons }}
      defaultEditor={isEditorKey(m) ? m : "nina"}
    />
  );
}
