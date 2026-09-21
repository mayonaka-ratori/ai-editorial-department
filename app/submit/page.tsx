import { redirect } from "next/navigation";
import SubmitFlow from "@/components/SubmitFlow";
import { isEditorKey } from "@/lib/editors";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Submit({ searchParams }: { searchParams: Promise<{ editor?: string }> }) {
  const { editor } = await searchParams;
  if (!isEditorKey(editor)) redirect("/editors");
  const settings = await getSettings();
  if (settings.accepting !== "1") redirect("/");
  return <SubmitFlow editor={editor} appUrl={process.env.APP_URL || ""} tweetUrl={settings.event_tweet_url || ""} />;
}
