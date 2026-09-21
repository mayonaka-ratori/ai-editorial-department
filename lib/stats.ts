import { q } from "./db";
import { currentIssue, getSettings } from "./settings";
import { REASON_TAGS, EDITOR_KEYS, type EditorKey } from "./editors";

export interface Stats {
  issue: string;
  total: number;
  byEditor: Record<EditorKey, { total: number; placements: Record<string, number>; errors: number }>;
  topReasons: { tag: string; count: number }[];
  workTypes: Record<string, number>;
}

export async function computeStats(settings?: Record<string, string>): Promise<Stats> {
  const s = settings ?? (await getSettings());
  const issue = currentIssue(s);
  const rows = await q<{ editor: EditorKey; placement: string; reason_tags: string; work_type: string }>(
    `select editor, placement, reason_tags, work_type from submissions where issue = $1 and is_sample = false`,
    [issue],
  );
  const errs = await q<{ editor: EditorKey; c: number }>(
    `select editor, count(*)::int as c from errors where created_at > now() - interval '1 day' group by editor`,
  );
  const byEditor = Object.fromEntries(
    EDITOR_KEYS.map((k) => [k, { total: 0, placements: {}, errors: 0 }]),
  ) as Stats["byEditor"];
  for (const e of errs) byEditor[e.editor].errors = Number(e.c);
  const reasons: Record<string, number> = {};
  const workTypes: Record<string, number> = {};
  for (const r of rows) {
    const b = byEditor[r.editor];
    if (!b) continue;
    b.total++;
    b.placements[r.placement] = (b.placements[r.placement] ?? 0) + 1;
    workTypes[r.work_type] = (workTypes[r.work_type] ?? 0) + 1;
    try {
      for (const t of JSON.parse(r.reason_tags || "[]") as string[]) reasons[t] = (reasons[t] ?? 0) + 1;
    } catch {}
  }
  const topReasons = (REASON_TAGS as readonly string[])
    .map((tag) => ({ tag, count: reasons[tag] ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  return { issue, total: rows.length, byEditor, topReasons, workTypes };
}
