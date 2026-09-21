import { hit, rememberHash, peek, todayKey } from "./throttle";
import { sha256 } from "./ids";
import { normalize } from "./famous";
import type { EditorKey } from "./editors/types";

// 禁止語。表紙に出せない言葉。必要に応じて増やす。
const NG_WORDS = ["死ね", "殺す", "殺せ", "レイプ", "セックス", "セフレ", "淫", "ちんこ", "まんこ", "うんこ", "殺害予告"];

export interface PrecheckInput {
  editor: EditorKey;
  penName: string;
  text: string;
  deviceId: string;
  ip: string;
  isSample: boolean;
  settings: Record<string, string>;
}

export type PrecheckResult = { ok: true; textHash: string } | { ok: false; code: string; message: string };

export function countChars(s: string): number {
  return [...s].length;
}

export async function precheck(i: PrecheckInput): Promise<PrecheckResult> {
  if (i.settings.accepting !== "1") return { ok: false, code: "closed", message: "本日の持ち込み受付は終了しました。" };
  if (i.settings[`editor_${i.editor}_open`] !== "1") return { ok: false, code: "editor_closed", message: "この編集者は本日は休業です。別の雑誌に送ってください。" };

  const pen = i.penName.trim();
  const text = i.text.trim();
  const n = countChars(text);
  if (!pen) return { ok: false, code: "pen", message: "ペンネームを入れてください。" };
  if (countChars(pen) > 10) return { ok: false, code: "pen", message: "ペンネームは10字までです。" };
  if (n < 20) return { ok: false, code: "short", message: "20字以上でお願いします。一文でもいいので、もう少し。" };
  if (n > 1000) return { ok: false, code: "long", message: "1000字までです。" };

  const bad = NG_WORDS.find((w) => text.includes(w) || pen.includes(w));
  if (bad) return { ok: false, code: "ng", message: "表紙に載せられない言葉が入っています。言い換えてください。" };

  // 1日の上限（会場とネットを合わせて）
  const cap = Number(i.settings.daily_cap || 3000);
  const day = await peek(`day:${todayKey()}`);
  if (day >= cap) return { ok: false, code: "closed", message: "本日の持ち込み受付は終了しました。" };

  if (i.isSample) {
    const s = await hit(`sample:${i.deviceId}:${todayKey()}`, 1, 24 * 3600);
    if (!s.ok) return { ok: false, code: "sample", message: "見本で試せるのは1回だけです。自分の文章を送ってください。" };
  } else {
    // 同じ端末から1時間に5回まで
    const hourKey = `hour:${new Date().toISOString().slice(0, 13)}`;
    const r = await hit(`ip:${i.ip}:${hourKey}`, 5, 3600);
    const d = await hit(`dev:${i.deviceId}:${hourKey}`, 5, 3600);
    if (!r.ok || !d.ok) return { ok: false, code: "rate", message: "同じ端末からは1時間に5回までです。少し時間をおいてください。" };
    // 同じ本文の2回目
    const textHash = sha256(normalize(text));
    const fresh = await rememberHash(`${i.editor}:${textHash}`, 24 * 3600);
    if (!fresh) return { ok: false, code: "dup", message: "同じ原稿を同じ雑誌に2回は送れません。別の雑誌に送るか、書き直してください。" };
    return { ok: true, textHash };
  }
  return { ok: true, textHash: sha256(normalize(text)) };
}

export async function countDay(): Promise<void> {
  await hit(`day:${todayKey()}`, 1_000_000, 36 * 3600);
}
