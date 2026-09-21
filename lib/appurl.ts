import { headers } from "next/headers";

// このアプリのURL。APP_URLを設定していれば、それを使う。
// 設定し忘れても投稿文のURLがドメインなしにならないように、リクエストのホスト名から作る。
export async function appUrl(): Promise<string> {
  const env = (process.env.APP_URL || "").trim().replace(/\/+$/, "");
  if (env) return env;
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
  if (!host) return "";
  const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || (/^(localhost|127\.|\[::1\])/.test(host) ? "http" : "https");
  return `${proto}://${host}`;
}
