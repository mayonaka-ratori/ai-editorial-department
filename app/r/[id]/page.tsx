import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Space from "@/components/Space";
import ResultView, { type ResultData } from "@/components/ResultView";
import { one } from "@/lib/db";
import { EDITORS, PLACEMENT_LABEL } from "@/lib/editors";
import { reactions, parseTags, type SubmissionRow } from "@/lib/judge";
import { computeCover } from "@/lib/cover";
import { statusLine } from "@/lib/lines";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

async function load(id: string) {
  return one<SubmissionRow>("select * from submissions where id = $1", [id]);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const row = await load(id);
  if (!row) return { title: "AI編集部" };
  const e = EDITORS[row.editor];
  return {
    title: `『${row.title}』 ${e.magazine} ${PLACEMENT_LABEL[row.placement]}`,
    description: `${e.name}が${PLACEMENT_LABEL[row.placement]}にしました。作: ${row.pen_name}`,
  };
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await load(id);
  if (!row) notFound();
  const settings = await getSettings();
  const e = EDITORS[row.editor];
  const cover = await computeCover(settings);
  const pos = cover.positions[row.id];
  const status = row.is_sample
    ? statusLine(e.magazine, { kind: "sample" })
    : !pos
      ? statusLine(e.magazine, { kind: "none" })
      : pos.slot === "toc"
        ? statusLine(e.magazine, { kind: "toc" })
        : statusLine(e.magazine, { kind: "cover", slot: pos.slot });
  const data: ResultData = {
    id: row.id,
    editor: row.editor,
    magazine: e.magazine,
    placement: row.placement,
    placementLabel: PLACEMENT_LABEL[row.placement],
    score: Number(row.score),
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
  };
  return (
    <div className={`screen${row.editor === "nina" ? " onlight" : ""}`}>
      <Space editor={row.editor} />
      <div className="screen-inner">
        <ResultView data={data} animate={false} appUrl={process.env.APP_URL || ""} tweetUrl={settings.event_tweet_url || ""} />
      </div>
    </div>
  );
}
