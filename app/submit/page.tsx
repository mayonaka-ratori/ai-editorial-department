import { redirect } from "next/navigation";
import SubmitFlow from "@/components/SubmitFlow";
import { isEditorKey } from "@/lib/editors";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Submit({ searchParams }: { searchParams: Promise<{ editor?: string; rewrite?: string }> }) {
  const { editor, rewrite } = await searchParams;
  if (!isEditorKey(editor)) redirect("/editors");
  const settings = await getSettings();
  if (settings.accepting !== "1") redirect("/");
  const rewriteId = /^[a-z0-9]{4,20}$/.test(rewrite || "") ? rewrite! : "";
  // key を付けて、結果画面から「書き直して送る」で戻ったときに部品を作り直す（前の画面の状態を持ち越さない）
  return <SubmitFlow key={`${editor}:${rewriteId}`} editor={editor} appUrl={process.env.APP_URL || ""} tweetUrl={settings.event_tweet_url || ""} rewriteId={rewriteId} />;
}
