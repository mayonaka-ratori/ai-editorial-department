import { q, one } from "./db";

export type Strictness = "amai" | "futsu" | "kibishii";

export const DEFAULTS: Record<string, string> = {
  accepting: "1",
  daily_cap: "3000",
  // 同じIPから1時間に送れる回数。0なら見ない。
  // 会場のWi-Fiや携帯回線は大勢が同じIPを使うので、既定では見ない。
  ip_hour_cap: "0",
  event_tweet_url: "",
  editor_kurodo_open: "1",
  editor_nina_open: "1",
  editor_sol_open: "1",
  strictness_kurodo: "futsu",
  strictness_nina: "futsu",
  strictness_sol: "futsu",
  published_at: "",
  issue_label: "",
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await q<{ key: string; value: string }>("select key, value from settings");
  const out = { ...DEFAULTS };
  for (const r of rows) out[r.key] = r.value;
  return out;
}

export async function getSetting(key: string): Promise<string> {
  const row = await one<{ value: string }>("select value from settings where key = $1", [key]);
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  await q(
    "insert into settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value",
    [key, value],
  );
}

// 号。イベントの月（例: 2026-10）。管理画面で決めていなければ今日の月。
export function currentIssue(settings?: Record<string, string>): string {
  const label = settings?.issue_label?.trim();
  if (label) return label;
  const d = new Date();
  const jst = new Date(d.getTime() + 9 * 3600 * 1000);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function issueTitle(issue: string): string {
  const [y, m] = issue.split("-");
  if (!y || !m) return issue;
  return `${y}年${Number(m)}月号`;
}
