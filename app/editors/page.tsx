import MagazinePicker from "@/components/MagazinePicker";
import { computeCover } from "@/lib/cover";
import { EDITOR_KEYS, isEditorKey, type EditorKey } from "@/lib/editors";
import { getSettings, issueTitle } from "@/lib/settings";
import { modelNames } from "@/lib/providers";

export const dynamic = "force-dynamic";

export default async function Editors({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const settings = await getSettings();
  const cover = await computeCover(settings);
  const open = Object.fromEntries(EDITOR_KEYS.map((k) => [k, settings[`editor_${k}_open`] === "1"])) as Record<EditorKey, boolean>;
  const models = settings.inside_display === "model" ? modelNames() : {};
  return <MagazinePicker magazines={cover.magazines} issueTitle={issueTitle(cover.issue)} published={!!cover.published_at} open={open} initial={isEditorKey(m) ? m : "nina"} models={models} />;
}
