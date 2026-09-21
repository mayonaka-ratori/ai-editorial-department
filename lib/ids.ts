import { randomBytes, createHash } from "crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
export function shortId(len = 8): string {
  const bytes = randomBytes(len);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return s;
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}
