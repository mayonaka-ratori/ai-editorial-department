import { NextResponse } from "next/server";
import { isEditorKey, PLACEMENT_LABEL } from "@/lib/editors";
import { getSettings } from "@/lib/settings";
import { precheck, countDay } from "@/lib/precheck";
import { judge, BusyError, reactions, parseTags } from "@/lib/judge";
import { readDevice, clientIp, DEVICE_COOKIE } from "@/lib/device";
import { SAMPLES } from "@/lib/samples";
import { computeCover, statusFor } from "@/lib/cover";
import { statusLine, placementNote } from "@/lib/lines";
import { rememberHash } from "@/lib/throttle";
import { EDITORS } from "@/lib/editors";
import { q } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { editor?: string; penName?: string; text?: string; sample?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "送る内容が読めませんでした。" }, { status: 400 });
  }
  if (!isEditorKey(body.editor)) return NextResponse.json({ ok: false, message: "雑誌を選んでください。" }, { status: 400 });
  const editor = body.editor;
  const sample = body.sample ? SAMPLES.find((s) => s.id === body.sample) : undefined;
  const penName = String(sample ? sample.penName : body.penName ?? "");
  const text = String(sample ? sample.text : body.text ?? "");

  const settings = await getSettings();
  const device = await readDevice();
  const ip = await clientIp();

  const pre = await precheck({ editor, penName, text, deviceId: device.id, ip, isSample: !!sample, settings });
  const withCookie = (res: NextResponse) => {
    if (device.isNew) res.cookies.set(DEVICE_COOKIE, device.id, { path: "/", maxAge: 60 * 60 * 24 * 90, sameSite: "lax", httpOnly: true });
    return res;
  };
  if (!pre.ok) return withCookie(NextResponse.json({ ok: false, code: pre.code, message: pre.message }, { status: 200 }));

  try {
    const row = await judge({ editor, penName, text, deviceId: device.id, isSample: !!sample, ngWord: pre.ngWord, settings });
    // 同じ本文の2回目よけは、判定が終わってから覚える。
    // 先に覚えると、混雑や編集者側のエラーで返したあとのやり直しが全部「2回目」になってしまう。
    if (pre.dupKey) await rememberHash(pre.dupKey, 24 * 3600);
    // 見本は1日の上限を消費しない。
    if (!sample) await countDay();
    const cover = await computeCover(settings);
    const place = statusFor(row.id, row.is_sample, cover.positions);
    const status = statusLine(EDITORS[editor].magazine, place);
    return withCookie(
      NextResponse.json({
        ok: true,
        id: row.id,
        editor,
        magazine: EDITORS[editor].magazine,
        placement: row.placement,
        placementLabel: PLACEMENT_LABEL[row.placement],
        score: row.score,
        title: row.title,
        titleAlt: row.title_alt,
        quote: row.quote,
        comment: row.comment,
        nextRequest: row.next_request,
        reasonTags: parseTags(row),
        workType: row.work_type,
        isSample: row.is_sample,
        revision: Number(row.revision),
        prevScore: row.prev_score == null ? null : Number(row.prev_score),
        penName: row.pen_name,
        reactions: reactions(row),
        status,
        statusKind: place.kind,
        placementNote: placementNote(row.placement, place),
      }),
    );
  } catch (err) {
    if (err instanceof BusyError) {
      return withCookie(NextResponse.json({ ok: false, code: "busy", retryAfter: err.retryAfter, message: "前に何人かいます。少しお待ちください。" }));
    }
    const message = (err as Error).message || String(err);
    try {
      await q("insert into errors (editor, message) values ($1, $2)", [editor, message.slice(0, 500)]);
    } catch {}
    console.error("judge failed", editor, message);
    return withCookie(
      NextResponse.json({ ok: false, code: "error", message: `${EDITORS[editor].name}は今、手が離せないようです。少し待つか、別の雑誌に送ってください。` }),
    );
  }
}
