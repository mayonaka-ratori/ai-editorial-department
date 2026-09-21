import { cookies } from "next/headers";
import { sha256 } from "./ids";

const COOKIE = "fable_admin";

export function adminToken(): string {
  return sha256(`admin:${process.env.ADMIN_PASSWORD || "change-me"}`);
}

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  return c.get(COOKIE)?.value === adminToken();
}

export const ADMIN_COOKIE = COOKIE;
