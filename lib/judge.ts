import { q, one } from "./db";
import { EDITORS, pickQuirks, type EditorKey, type Judgement, type Placement, PLACEMENTS, PLACEMENT_BASE, PLACEMENT_LABEL, REASON_TAGS, WORK_TYPES } from "./editors";
import { COMMON_SYSTEM, STRICTNESS_LINE, ratioLine, previousLine } from "./editors/common";
import { providerFor } from "./providers";
import { findFamous } from "./famous";
import { shortId } from "./ids";
import { othersLines } from "./lines";
import { currentIssue } from "./settings";
import { hit } from "./throttle";

export interface JudgeInput {
  editor: EditorKey;
  penName: string;
  text: string;
  deviceId: string;
  isSample: boolean;
  // 禁止語が入っていた。判定は返すが、表紙にも目次にも出さない。
  ngWord?: boolean;
  settings: Record<string, string>;
}

export interface SubmissionRow {
  id: string;
  editor: EditorKey;
  pen_name: string;
  placement: Placement;
  score: number;
  title: string;
  title_alt: string;
  quote: string;
  comment: string;
  next_request: string;
  reason_tags: string; // JSON
  work_type: string;
  safe_for_cover: boolean;
  hidden: boolean;
  is_sample: boolean;
  device_id: string;
  revision: number;
  prev_id: string;
  prev_score: number | null;
  issue: string;
  created_at: string | Date;
  [k: string]: unknown;
}

const PROVIDER_RPM: Record<EditorKey, number> = { kurodo: 50, nina: 60, sol: 60 };

export class BusyError extends Error {
  retryAfter: number;
  constructor(retryAfter: number) {
    super("busy");
    this.retryAfter = retryAfter;
  }
}

export async function judge(input: JudgeInput): Promise<SubmissionRow> {
  const e = EDITORS[input.editor];
  const issue = currentIssue(input.settings);
  const text = input.text.trim();
  const penName = input.penName.trim();

  // 前回（改稿）
  const prev = input.isSample
    ? null
    : await one<SubmissionRow>(
        `select * from submissions where device_id = $1 and editor = $2 and issue = $3 and is_sample = false order by created_at desc limit 1`,
        [input.deviceId, input.editor, issue],
      );
  const revision = prev ? Number(prev.revision) + 1 : 1;

  // 有名作品ならAIを呼ばない
  const famous = findFamous(text);
  let j: Judgement;
  if (famous) {
    j = {
      work_type: "コピペ",
      placement: "jigo",
      score: 0,
      title: famous.title,
      title_alt: "",
      quote: "",
      comment: e.famousReply(famous.title),
      next_request: e.famousNext,
      reason_tags: ["どこかで読んだ"],
      safe_for_cover: true,
    };
  } else {
    // 混み具合（会社ごとに1分あたりの回数）
    const minute = new Date().toISOString().slice(0, 16);
    const rpm = await hit(`provider:${input.editor}:${minute}`, PROVIDER_RPM[input.editor], 120);
    if (!rpm.ok) throw new BusyError(6 + Math.floor(Math.random() * 6));

    const quirks = pickQuirks(e);
    const strictness = (input.settings[`strictness_${input.editor}`] as keyof typeof STRICTNESS_LINE) || "futsu";
    const ratio = await recentRatio(input.editor, issue);
    const parts = [
      `ペンネーム: ${penName}`,
      `本文:\n${text}\n---`,
      `今回の癖（この回だけ、必ずコメントに入れる）:\n- ${quirks.join("\n- ")}`,
      STRICTNESS_LINE[strictness] ?? STRICTNESS_LINE.futsu,
      ratioLine(ratio),
      prev
        ? previousLine({ title: prev.title, placement_label: PLACEMENT_LABEL[prev.placement], next_request: prev.next_request, revision })
        : "",
      "作品の種類ごとの見るところ:\n" + Object.entries(e.typeHints).map(([k, v]) => `- ${k}: ${v}`).join("\n"),
    ].filter(Boolean);
    const { provider } = providerFor(input.editor);
    const raw = await provider.judge({
      system: `${COMMON_SYSTEM}\n\n${e.system}`,
      user: parts.join("\n\n"),
      timeoutMs: 25_000,
    });
    j = verify(raw, text);
  }

  const score = PLACEMENT_BASE[j.placement] + (j.placement === "jigo" ? 0 : j.score);
  const id = shortId();
  const hidden = !j.safe_for_cover || !!input.ngWord;
  await q(
    `insert into submissions (id, editor, pen_name, placement, score, title, title_alt, quote, comment, next_request, reason_tags, work_type, safe_for_cover, hidden, is_sample, device_id, revision, prev_id, prev_score, issue)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
    [
      id, input.editor, penName, j.placement, score, j.title, j.title_alt, j.quote, j.comment, j.next_request,
      JSON.stringify(j.reason_tags), j.work_type, j.safe_for_cover, hidden, input.isSample, input.deviceId, revision,
      prev?.id ?? "", prev ? Number(prev.score) : null, issue,
    ],
  );
  const row = await one<SubmissionRow>("select * from submissions where id = $1", [id]);
  return row!;
}

// 返ってきたものの検算
export function verify(raw: Judgement, text: string): Judgement {
  const j = { ...raw };
  if (!PLACEMENTS.includes(j.placement)) j.placement = "kanmatsu";
  if (!WORK_TYPES.includes(j.work_type)) j.work_type = "つぶやき";
  if (!Number.isInteger(j.score) || j.score < 0 || j.score > 100) j.score = 50;
  j.title = [...(j.title || "").trim()].slice(0, 15).join("") || "無題";
  j.title_alt = [...(j.title_alt || "").trim()].slice(0, 15).join("");
  j.quote = (j.quote || "").trim();
  if (j.quote && !text.includes(j.quote)) {
    // 前後の記号だけ違うことがあるので、記号を取って探す
    const loose = j.quote.replace(/^[「『"]+|[」』"。]+$/g, "");
    j.quote = loose && text.includes(loose) ? loose : "";
  }
  j.reason_tags = (j.reason_tags || []).filter((t) => (REASON_TAGS as readonly string[]).includes(t)).slice(0, 2);
  j.comment = (j.comment || "").trim();
  j.next_request = [...(j.next_request || "").trim()].slice(0, 80).join("");
  if (typeof j.safe_for_cover !== "boolean") j.safe_for_cover = true;
  if (j.work_type === "AIが書いたもの" || j.work_type === "コピペ") {
    if (j.placement === "kanto" || j.placement === "tokushu" || j.placement === "kanmatsu") j.placement = "namae";
  }
  return j;
}

export async function recentRatio(editor: EditorKey, issue: string): Promise<Record<string, number>> {
  const rows = await q<{ placement: string }>(
    `select placement from submissions where editor = $1 and issue = $2 and is_sample = false order by created_at desc limit 50`,
    [editor, issue],
  );
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.placement] = (counts[r.placement] ?? 0) + 1;
  return counts;
}

export function reactions(row: SubmissionRow) {
  return othersLines(row.editor, row.placement, row.work_type, row.id);
}

export function parseTags(row: SubmissionRow): string[] {
  try {
    return JSON.parse(row.reason_tags || "[]");
  } catch {
    return [];
  }
}
