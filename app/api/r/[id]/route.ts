import { NextResponse } from "next/server";
import { one } from "@/lib/db";
import { EDITORS, PLACEMENT_LABEL, type EditorKey, type Placement } from "@/lib/editors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 結果の要点。書き直して送る画面が「前回の作品名、判定、編集者の頼み」を出すのに使う。本文は保存していないので返せない。
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const row = await one<{ editor: EditorKey; title: string; placement: Placement; next_request: string; pen_name: string; revision: number; is_sample: boolean }>(
    "select editor, title, placement, next_request, pen_name, revision, is_sample from submissions where id = $1",
    [id],
  );
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({
    ok: true,
    id,
    editor: row.editor,
    editorName: EDITORS[row.editor].name,
    magazine: EDITORS[row.editor].magazine,
    title: row.title,
    placementLabel: PLACEMENT_LABEL[row.placement],
    nextRequest: row.next_request,
    penName: row.pen_name,
    revision: Number(row.revision),
    isSample: !!row.is_sample,
  });
}
