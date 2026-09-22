import { hit, hashSeen, peek, todayKey } from "./throttle";
import { sha256 } from "./ids";
import { normalize } from "./famous";
import type { EditorKey } from "./editors/types";

// 禁止語。表紙にも目次にも出さない言葉。必要に応じて増やす。
// 当たっても原稿は受け取る。判定は返して、表紙と目次には出さない。
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

export type PrecheckResult =
  | { ok: true; textHash: string; dupKey: string; ngWord: boolean }
  | { ok: false; code: string; message: string };

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

  // 禁止語。ここでは落とさない。判定は返して、表紙と目次には出さない印だけ付ける。
  const ngWord = NG_WORDS.some((w) => text.includes(w) || pen.includes(w));

  // 1日の上限（会場とネットを合わせて）
  const cap = Number(i.settings.daily_cap) > 0 ? Number(i.settings.daily_cap) : 3000;
  const day = await peek(`day:${todayKey()}`);
  if (day >= cap) return { ok: false, code: "closed", message: "本日の持ち込み受付は終了しました。" };

  const textHash = sha256(normalize(text));
  if (i.isSample) {
    const s = await hit(`sample:${i.deviceId}:${todayKey()}`, 1, 24 * 3600);
    if (!s.ok) return { ok: false, code: "sample", message: "見本で試せるのは1回だけです。自分の文章を送ってください。" };
    return { ok: true, textHash, dupKey: "", ngWord };
  }

  const hourKey = `hour:${new Date().toISOString().slice(0, 13)}`;
  // 会場のWi-Fiや携帯回線は大勢が同じIPを使う。ここは荒らし避けなので、うんと高くしておく。
  const ipCap = Number(i.settings.ip_hour_cap) > 0 ? Number(i.settings.ip_hour_cap) : 0;
  if (ipCap > 0) {
    const r = await hit(`ip:${i.ip}:${hourKey}`, ipCap, 3600);
    if (!r.ok) return { ok: false, code: "rate", message: "この回線から送れる回数が、1時間の上限に達しました。少し時間をおいてください。" };
  }
  // 同じ端末から1時間に7回まで（3誌に送って比べる人が上限に当たらないように）
  const d = await hit(`dev:${i.deviceId}:${hourKey}`, 7, 3600);
  if (!d.ok) return { ok: false, code: "rate", message: "同じ端末からは1時間に7回までです。少し時間をおいてください。" };

  // 同じ本文の2回目。ここでは見るだけ。覚えるのは判定が終わったあと。
  const dupKey = `${i.editor}:${textHash}`;
  if (await hashSeen(dupKey)) {
    return { ok: false, code: "dup", message: "同じ原稿を同じ雑誌に2回は送れません。別の雑誌に送るか、書き直してください。" };
  }
  return { ok: true, textHash, dupKey, ngWord };
}

export async function countDay(): Promise<void> {
  await hit(`day:${todayKey()}`, 1_000_000, 36 * 3600);
}
