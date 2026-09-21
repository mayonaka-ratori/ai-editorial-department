import { q, one } from "./db";

// 回数を数える。bucket ごとに count を増やし、上限を超えたら false。
export async function hit(bucket: string, limit: number, ttlSeconds: number): Promise<{ ok: boolean; count: number }> {
  const expires = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const row = await one<{ count: number }>(
    `insert into throttle (bucket, count, expires_at) values ($1, 1, $2)
     on conflict (bucket) do update set
       count = case when throttle.expires_at < now() then 1 else throttle.count + 1 end,
       expires_at = case when throttle.expires_at < now() then excluded.expires_at else throttle.expires_at end
     returning count`,
    [bucket, expires],
  );
  const count = Number(row?.count ?? 0);
  return { ok: count <= limit, count };
}

export async function peek(bucket: string): Promise<number> {
  const row = await one<{ count: number; expires_at: string }>(
    "select count, expires_at from throttle where bucket = $1 and expires_at > now()",
    [bucket],
  );
  return Number(row?.count ?? 0);
}

export async function rememberHash(hash: string, ttlSeconds: number): Promise<boolean> {
  const rows = await q<{ hash: string }>(
    `insert into text_hashes (hash, expires_at) values ($1, $2)
     on conflict (hash) do update set expires_at = excluded.expires_at
     where text_hashes.expires_at < now()
     returning hash`,
    [hash, new Date(Date.now() + ttlSeconds * 1000).toISOString()],
  );
  return rows.length > 0; // 新しく入ったか、期限切れを更新できたら true
}

export function todayKey(): string {
  const jst = new Date(Date.now() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10);
}
