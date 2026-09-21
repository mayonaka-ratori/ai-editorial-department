import CoverClient from "@/components/CoverClient";
import { computeCover, mineIds, myWorks } from "@/lib/cover";
import { getAfterwords } from "@/lib/afterword";
import { computeStats } from "@/lib/stats";
import { getSettings, issueTitle } from "@/lib/settings";
import { isEditorKey, type EditorKey } from "@/lib/editors";
import { readDevice } from "@/lib/device";

export const dynamic = "force-dynamic";

export default async function CoverPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const settings = await getSettings();
  const cover = await computeCover(settings);
  const afterwords = await getAfterwords(cover.issue);
  const stats = await computeStats(settings);
  const device = await readDevice();
  const mine = device.isNew ? [] : await mineIds(device.id, cover.issue);
  // 開く雑誌: URLで指定があればそれ、なければ自分が最後に送った雑誌、それもなければGEMINI。
  let defaultEditor: EditorKey = "nina";
  if (isEditorKey(m)) defaultEditor = m;
  else if (mine.length) {
    const works = await myWorks(device.id, cover.issue);
    const last = works.find((w) => !w.is_sample);
    if (last) defaultEditor = last.editor;
  }
  return (
    <CoverClient
      initial={{ ...cover, issueTitle: issueTitle(cover.issue), afterwords, total: stats.total, topReasons: stats.topReasons, mine }}
      defaultEditor={defaultEditor}
    />
  );
}
