import { cookies, headers } from "next/headers";
import { shortId } from "./ids";

export const DEVICE_COOKIE = "fable_device";

// 端末の目印。クッキーになければ新しく作る（返す値を呼び出し側がクッキーに書く）。
export async function readDevice(): Promise<{ id: string; isNew: boolean }> {
  const c = await cookies();
  const v = c.get(DEVICE_COOKIE)?.value;
  if (v && /^[a-z0-9]{12,}$/.test(v)) return { id: v, isNew: false };
  return { id: shortId(16), isNew: true };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") || h.get("x-real-ip") || "local").split(",")[0].trim();
}
