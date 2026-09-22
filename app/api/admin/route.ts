import { NextResponse } from "next/server";
import { isAdmin, adminToken, ADMIN_COOKIE } from "@/lib/auth";
import { getSettings, setSetting, DEFAULTS } from "@/lib/settings";
import { q } from "@/lib/db";
import { writeAfterwords } from "@/lib/afterword";
import { isEditorKey } from "@/lib/editors";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "");

  if (action === "login") {
    if (String(body.password ?? "") !== (process.env.ADMIN_PASSWORD || "change-me")) {
      return NextResponse.json({ ok: false, message: "合言葉が違います。" });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, adminToken(), { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
    return res;
  }
  if (!(await isAdmin())) return NextResponse.json({ ok: false, message: "合言葉を入れてください。" }, { status: 401 });

  if (action === "set") {
    const key = String(body.key ?? "");
    if (!(key in DEFAULTS)) return NextResponse.json({ ok: false, message: "知らない設定です。" });
    let value = String(body.value ?? "").trim();
    if (key === "daily_cap" || key === "ip_hour_cap") {
      // 数字以外を入れると入口が受付終了になってしまうので、数字だけ受ける
      if (!/^\d+$/.test(value)) return NextResponse.json({ ok: false, message: "数字を入れてください。" });
      if (key === "daily_cap" && Number(value) < 1) value = DEFAULTS.daily_cap;
    }
    await setSetting(key, value);
    return NextResponse.json({ ok: true, settings: await getSettings() });
  }
  if (action === "hide") {
    await q("update submissions set hidden = $2 where id = $1", [String(body.id ?? ""), body.hidden !== false]);
    return NextResponse.json({ ok: true });
  }
  if (action === "publish") {
    await setSetting("published_at", new Date().toISOString());
    await setSetting("accepting", "0");
    const afterwords = await writeAfterwords();
    return NextResponse.json({ ok: true, afterwords, settings: await getSettings() });
  }
  if (action === "unpublish") {
    await setSetting("published_at", "");
    return NextResponse.json({ ok: true, settings: await getSettings() });
  }
  if (action === "afterword") {
    const ek = body.editor;
    const afterwords = await writeAfterwords(isEditorKey(ek) ? ek : undefined);
    return NextResponse.json({ ok: true, afterwords });
  }
  if (action === "afterword_set") {
    const ek = String(body.editor ?? "");
    const issue = String(body.issue ?? "");
    await q(
      `insert into afterwords (editor, issue, body) values ($1,$2,$3) on conflict (editor, issue) do update set body = excluded.body`,
      [ek, issue, String(body.body ?? "")],
    );
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, message: "知らない操作です。" });
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ ok: false, message: "合言葉を入れてください。" }, { status: 401 });
  const settings = await getSettings();
  const { computeStats } = await import("@/lib/stats");
  const { getAfterwords } = await import("@/lib/afterword");
  const { currentIssue } = await import("@/lib/settings");
  const { peek, todayKey } = await import("@/lib/throttle");
  const issue = currentIssue(settings);
  const stats = await computeStats(settings);
  const recent = await q(
    `select id, editor, pen_name, placement, score, title, work_type, hidden, is_sample, revision, created_at from submissions where issue = $1 order by created_at desc limit 60`,
    [issue],
  );
  const errors = await q(`select editor, message, created_at from errors order by created_at desc limit 20`);
  return NextResponse.json({ ok: true, settings, stats, recent, errors, issue, afterwords: await getAfterwords(issue), used: await peek(`day:${todayKey()}`) });
}
