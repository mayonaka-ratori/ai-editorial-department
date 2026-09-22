import { q } from "./db";
import { setSetting } from "./settings";
import { hit } from "./throttle";
import type { EditorKey } from "./editors/types";

// 休業の自動切り替え。
// 3社のどれかが月の上限額に当たると、そのあとは何度送ってもエラーになる。
// そのまま受け付けると、来場者が送るたびに「手が離せないようです」と言われて待たされるので、
// その編集者を自動で「本日は休業です」にする。戻すのは管理画面の「出勤」ボタン。

// エラーが続いたら休業にする回数と、数える時間
const FAIL_LIMIT = 5;
const FAIL_WINDOW_SECONDS = 10 * 60;

const failBucket = (editor: EditorKey) => `fail:${editor}`;

// 上限額や残高不足のエラーか。これは待っても直らないので、1回で休業にする。
export function isQuotaError(err: unknown): boolean {
  const e = err as { status?: number; code?: string; message?: string; error?: { code?: string; type?: string } };
  if (e?.status === 402) return true;
  const text = [e?.message, e?.code, e?.error?.code, e?.error?.type].filter(Boolean).join(" ").toLowerCase();
  return /insufficient_quota|credit balance|billing|exceeded your current quota|spend limit|spending limit|resource_exhausted.*quota|quota.*exceeded/.test(text);
}

// 判定がうまくいったら、続いたエラーの数を0に戻す。
export async function recordSuccess(editor: EditorKey): Promise<void> {
  await q("delete from throttle where bucket = $1", [failBucket(editor)]);
}

// 判定がエラーになったとき。休業にしたら、その理由を返す。
export async function recordFailure(editor: EditorKey, err: unknown): Promise<string | null> {
  if (isQuotaError(err)) return closeEditor(editor, "上限額か残高のエラーが出たため");
  const r = await hit(failBucket(editor), FAIL_LIMIT - 1, FAIL_WINDOW_SECONDS);
  if (!r.ok) return closeEditor(editor, `${FAIL_WINDOW_SECONDS / 60}分の間にエラーが${FAIL_LIMIT}回続いたため`);
  return null;
}

async function closeEditor(editor: EditorKey, why: string): Promise<string> {
  const at = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(11, 16);
  const reason = `${at}に自動で休業にしました。${why}です。`;
  await setSetting(`editor_${editor}_open`, "0");
  await setSetting(`editor_${editor}_closed_reason`, reason);
  await recordSuccess(editor);
  return reason;
}

// 管理画面で「出勤」に戻したとき。理由と数を消す。
export async function reopenEditor(editor: EditorKey): Promise<void> {
  await setSetting(`editor_${editor}_closed_reason`, "");
  await recordSuccess(editor);
}
