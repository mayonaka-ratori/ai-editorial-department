import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { computeCover, statusFor } from "@/lib/cover";
import { EDITORS, type EditorKey, type Placement } from "@/lib/editors";
import { statusLine, placementNote } from "@/lib/lines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = await one<{ editor: EditorKey; placement: Placement; is_sample: boolean; hidden: boolean }>(
    "select editor, placement, is_sample, hidden from submissions where id = $1",
    [id],
  );
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  const mag = EDITORS[row.editor].magazine;
  const cover = row.is_sample ? null : await computeCover();
  const place = statusFor(id, row.is_sample, cover?.positions ?? {});
  return NextResponse.json({
    ok: true,
    status: statusLine(mag, place),
    kind: place.kind,
    slot: place.kind === "cover" ? place.slot : undefined,
    placementNote: placementNote(row.placement, place),
  });
}
