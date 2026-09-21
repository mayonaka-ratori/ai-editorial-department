import { kurodo } from "./kurodo";
import { nina } from "./nina";
import { sol } from "./sol";
import type { EditorKey, EditorProfile } from "./types";

export const EDITORS: Record<EditorKey, EditorProfile> = { kurodo, nina, sol };
export const EDITOR_KEYS: EditorKey[] = ["kurodo", "nina", "sol"];

export function isEditorKey(v: unknown): v is EditorKey {
  return v === "kurodo" || v === "nina" || v === "sol";
}

export function pickQuirks(e: EditorProfile, seed = Math.random()): string[] {
  const n = seed < 0.5 ? 1 : 2;
  const pool = [...e.quirks];
  const out: string[] = [];
  while (out.length < n && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

export * from "./types";
