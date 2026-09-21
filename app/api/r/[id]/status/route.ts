import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { computeCover } from "@/lib/cover";
import { EDITORS, type EditorKey } from "@/lib/editors";
import { statusLine } from "@/lib/lines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = await one<{ editor: EditorKey; is_sample: boolean; hidden: boolean }>("select editor, is_sample, hidden from submissions where id = $1", [id]);
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  const mag = EDITORS[row.editor].magazine;
  if (row.is_sample) return NextResponse.json({ ok: true, status: statusLine(mag, { kind: "sample" }), kind: "sample" });
  const cover = await computeCover();
  const pos = cover.positions[id];
  if (!pos) return NextResponse.json({ ok: true, status: statusLine(mag, { kind: "none" }), kind: "none" });
  if (pos.slot === "toc") return NextResponse.json({ ok: true, status: statusLine(mag, { kind: "toc" }), kind: "toc" });
  return NextResponse.json({ ok: true, status: statusLine(mag, { kind: "cover", slot: pos.slot }), kind: "cover", slot: pos.slot });
}
