// データベースの入口。DATABASE_URL があればNeon、なければ手元のPGlite。
// どちらも「SQLと引数を渡すと行の配列が返る」だけの形にそろえる。
import { SCHEMA_SQL } from "./schema";

type Row = Record<string, unknown>;
type Query = <T extends Row = Row>(sql: string, params?: unknown[]) => Promise<T[]>;

let queryFn: Query | null = null;
let ready: Promise<void> | null = null;

async function makeQuery(): Promise<Query> {
  const url = process.env.DATABASE_URL?.trim();
  if (url && url.startsWith("postgres")) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return async <T extends Row>(text: string, params: unknown[] = []) =>
      (await sql.query(text, params as never[])) as unknown as T[];
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const g = globalThis as unknown as { __pglite?: InstanceType<typeof PGlite> };
  if (!g.__pglite) g.__pglite = new PGlite(process.env.PGLITE_DIR || "./data/pglite");
  const db = g.__pglite;
  return async <T extends Row>(text: string, params: unknown[] = []) =>
    (await db.query<T>(text, params)).rows;
}

export async function q<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!queryFn) {
    if (!ready) {
      ready = (async () => {
        const fn = await makeQuery();
        for (const stmt of SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
          await fn(stmt);
        }
        queryFn = fn;
      })();
    }
    await ready;
  }
  return queryFn!<T>(sql, params);
}

export async function one<T extends Row = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(sql, params);
  return rows[0] ?? null;
}
