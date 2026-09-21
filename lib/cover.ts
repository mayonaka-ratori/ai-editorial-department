import { q } from "./db";
import { EDITOR_KEYS, EDITORS, type EditorKey, type Placement } from "./editors";
import { currentIssue, getSettings } from "./settings";

export interface CoverWork {
  id: string;
  title: string;
  pen_name: string;
  slot: Placement; // 表紙のどの枠に入ったか
  placement: Placement; // 編集者の判定
  score: number;
  is_new: boolean;
}

export interface MagazineCover {
  editor: EditorKey;
  magazine: string;
  magazineEn: string;
  kanto: CoverWork[];
  tokushu: CoverWork[];
  kanmatsu: CoverWork[];
  toc: { id: string; title: string; pen_name: string; placement: Placement; created_at: string }[];
  counts: { submissions: number; toc: number };
}

export interface CoverData {
  issue: string;
  published_at: string; // 空なら組版中
  magazines: MagazineCover[];
  positions: Record<string, { editor: EditorKey; slot: Placement } | { editor: EditorKey; slot: "toc" }>;
}

const SLOTS: { slot: Placement; n: number }[] = [
  { slot: "kanto", n: 1 },
  { slot: "tokushu", n: 3 },
  { slot: "kanmatsu", n: 6 },
];

interface Row {
  [k: string]: unknown;
  id: string;
  editor: EditorKey;
  pen_name: string;
  placement: Placement;
  score: number;
  title: string;
  device_id: string;
  created_at: string | Date;
}

export async function computeCover(settings?: Record<string, string>): Promise<CoverData> {
  const s = settings ?? (await getSettings());
  const issue = currentIssue(s);
  const published = s.published_at?.trim() || "";
  const rows = await q<Row>(
    `select id, editor, pen_name, placement, score, title, device_id, created_at from submissions
     where issue = $1 and hidden = false and is_sample = false and placement <> 'jigo'
       and ($2 = '' or created_at <= $2::timestamptz)
     order by created_at desc`,
    [issue, published],
  );
  const total = await q<{ editor: EditorKey; c: number }>(
    `select editor, count(*)::int as c from submissions where issue = $1 and is_sample = false group by editor`,
    [issue],
  );
  const totals: Record<string, number> = {};
  for (const t of total) totals[t.editor] = Number(t.c);
  const recentCut = Date.now() - 20_000;

  const positions: CoverData["positions"] = {};
  const magazines = EDITOR_KEYS.map((ek) => {
    const e = EDITORS[ek];
    const mine = rows.filter((r) => r.editor === ek);
    // 表紙の候補: 巻頭・特集・巻末の判定で、1人1作（端末とペンネーム）
    const seen = new Set<string>();
    const candidates: Row[] = [];
    const eligible = mine.filter((r) => r.placement === "kanto" || r.placement === "tokushu" || r.placement === "kanmatsu");
    for (const r of [...eligible].sort((a, b) => b.score - a.score)) {
      const k1 = `d:${r.device_id}`;
      const k2 = `p:${r.pen_name}`;
      if (seen.has(k1) || seen.has(k2)) continue;
      seen.add(k1);
      seen.add(k2);
      candidates.push(r);
    }
    // 枠に入れる。判定より上の枠には入らない（特集の判定なら巻頭の枠には入らない）。
    const out: Record<Placement, CoverWork[]> = { kanto: [], tokushu: [], kanmatsu: [], namae: [], jigo: [] };
    const used = new Set<string>();
    const allow: Record<Placement, Placement[]> = { kanto: ["kanto"], tokushu: ["kanto", "tokushu"], kanmatsu: ["kanto", "tokushu", "kanmatsu"], namae: [], jigo: [] };
    for (const { slot, n } of SLOTS) {
      for (const r of candidates) {
        if (out[slot].length >= n) break;
        if (used.has(r.id) || !allow[slot].includes(r.placement)) continue;
        used.add(r.id);
        out[slot].push({
          id: r.id,
          title: r.title,
          pen_name: r.pen_name,
          slot,
          placement: r.placement,
          score: r.score,
          is_new: new Date(r.created_at).getTime() > recentCut,
        });
        positions[r.id] = { editor: ek, slot };
      }
    }
    const toc = mine
      .filter((r) => !positions[r.id])
      .map((r) => {
        positions[r.id] = { editor: ek, slot: "toc" };
        return { id: r.id, title: r.title, pen_name: r.pen_name, placement: r.placement, created_at: new Date(r.created_at).toISOString() };
      });
    return {
      editor: ek,
      magazine: e.magazine,
      magazineEn: e.magazineEn,
      kanto: out.kanto,
      tokushu: out.tokushu,
      kanmatsu: out.kanmatsu,
      toc,
      counts: { submissions: totals[ek] ?? 0, toc: toc.length },
    };
  });
  return { issue, published_at: published, magazines, positions };
}
