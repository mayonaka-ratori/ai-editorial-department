import { q } from "./db";
import { EDITORS, EDITOR_KEYS, type EditorKey } from "./editors";
import { COMMON_SYSTEM } from "./editors/common";
import { providerFor } from "./providers";
import { computeCover } from "./cover";
import { computeStats } from "./stats";
import { getSettings } from "./settings";

// 発行のときに、3人がそれぞれ「今日の編集後記」を書く。AIを呼ぶのは1日に3回。
export async function writeAfterwords(only?: EditorKey): Promise<Record<string, string>> {
  const settings = await getSettings();
  const cover = await computeCover(settings);
  const stats = await computeStats(settings);
  const out: Record<string, string> = {};
  for (const ek of EDITOR_KEYS) {
    if (only && ek !== only) continue;
    const e = EDITORS[ek];
    const mag = cover.magazines.find((m) => m.editor === ek)!;
    const st = stats.byEditor[ek];
    const material = [
      `今日の${e.magazine}の持ち込みは${st.total}回でした。`,
      `表紙に載った作品: 巻頭『${mag.kanto.map((w) => w.title).join("』『")}』、特集『${mag.tokushu.map((w) => w.title).join("』『")}』、巻末『${mag.kanmatsu.map((w) => w.title).join("』『")}』。`,
      `判定の内訳: ${Object.entries(st.placements).map(([k, v]) => `${k} ${v}件`).join("、") || "なし"}。`,
      `今日多かった理由: ${stats.topReasons.map((r) => `${r.tag}（${r.count}件）`).join("、") || "なし"}。`,
    ].join("\n");
    const { provider } = providerFor(ek);
    const user = `${material}\n\n上の材料をもとに、今日の編集後記を200字ほどで書いてください。あなたの話し方で、うちの読者（AI）が今日どう感じたかを1つ、明日持ち込む人へのお願いを1つ入れてください。作品名は『』でそのまま使い、本文にない作品名は作らないでください。編集後記の本文だけを返してください。`;
    let body: string;
    try {
      body = (await provider.free?.({ system: `${COMMON_SYSTEM}\n\n${e.system}`, user, timeoutMs: 40_000 })) || "";
    } catch (err) {
      body = `（編集後記を書けませんでした: ${(err as Error).message}）`;
    }
    await q(
      `insert into afterwords (editor, issue, body) values ($1, $2, $3)
       on conflict (editor, issue) do update set body = excluded.body, created_at = now()`,
      [ek, cover.issue, body],
    );
    out[ek] = body;
  }
  return out;
}

export async function getAfterwords(issue: string): Promise<Record<string, string>> {
  const rows = await q<{ editor: string; body: string }>("select editor, body from afterwords where issue = $1", [issue]);
  return Object.fromEntries(rows.map((r) => [r.editor, r.body]));
}
