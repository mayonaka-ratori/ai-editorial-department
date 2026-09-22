"use client";
import { useCallback, useEffect, useState } from "react";
import { EDITOR_KEYS, EDITORS, PLACEMENT_LABEL, type EditorKey, type Placement } from "@/lib/editors";

type Recent = { id: string; editor: EditorKey; pen_name: string; placement: Placement; score: number; title: string; work_type: string; hidden: boolean; is_sample: boolean; revision: number; created_at: string };
type Payload = {
  ok: boolean;
  settings: Record<string, string>;
  stats: { total: number; byEditor: Record<EditorKey, { total: number; placements: Record<string, number>; errors: number }>; topReasons: { tag: string; count: number }[] };
  recent: Recent[];
  errors: { editor: string; message: string; created_at: string }[];
  issue: string;
  afterwords: Record<string, string>;
  used: number;
};

export default function AdminClient() {
  const [pw, setPw] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin");
    if (r.status === 401) return setData(null);
    setData(await r.json());
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json());
    setBusy(false);
    if (!r.ok) setMsg(r.message || "うまくいきませんでした。");
    await load();
    return r;
  }

  if (!data) {
    return (
      <div className="admin">
        <h2>管理</h2>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            call({ action: "login", password: pw });
          }}
        >
          <input type="password" placeholder="合言葉" value={pw} onChange={(e) => setPw(e.target.value)} style={{ width: "auto", flex: 1 }} />
          <button className="small-btn on" type="submit">
            入る
          </button>
        </form>
        {msg && <p className="err">{msg}</p>}
      </div>
    );
  }
  const s = data.settings;
  const set = (key: string, value: string) => call({ action: "set", key, value });
  // 数字の欄。数字以外なら保存せず、その場で知らせる。
  const setNumber = (key: string, value: string) => {
    const v = value.trim();
    if (!/^\d+$/.test(v)) {
      setMsg("数字を入れてください。");
      return;
    }
    return set(key, v);
  };
  const published = !!s.published_at;

  return (
    <div className="admin">
      <h2>管理　{data.issue}</h2>
      {msg && <p className="err">{msg}</p>}

      <section>
        <h3>受付</h3>
        <div className="row">
          <button className={`small-btn${s.accepting === "1" ? " on" : ""}`} onClick={() => set("accepting", "1")}>受付中</button>
          <button className={`small-btn${s.accepting !== "1" ? " on" : ""}`} onClick={() => set("accepting", "0")}>受付終了</button>
          <span className="note">今日 {data.used}回 / 上限</span>
          <input type="text" inputMode="numeric" defaultValue={s.daily_cap} onBlur={(e) => setNumber("daily_cap", e.target.value)} style={{ width: 90, minWidth: 0, flex: "none" }} />
        </div>
        <div className="row">
          <span className="note">同じ回線から1時間に</span>
          <input type="text" inputMode="numeric" defaultValue={s.ip_hour_cap} onBlur={(e) => setNumber("ip_hour_cap", e.target.value)} style={{ width: 90, minWidth: 0, flex: "none" }} />
          <span className="note">回まで（0なら見ない）</span>
        </div>
        <p className="note">
          会場のWi-Fiや携帯回線は大勢が同じ回線を使うので、ふだんは0のままにしてください。
          1人が何度も送ってくるときだけ、200などを入れます。端末ごとの1時間に7回までは、この設定とは別にいつも効いています。
        </p>
      </section>

      <section>
        <h3>中身の表示</h3>
        <div className="row">
          <button className={`small-btn${s.inside_display !== "model" ? " on" : ""}`} onClick={() => set("inside_display", "company")}>会社名だけ</button>
          <button className={`small-btn${s.inside_display === "model" ? " on" : ""}`} onClick={() => set("inside_display", "model")}>モデル名まで</button>
        </div>
        <p className="note">雑誌を選ぶ画面の「CORE:」に出すものです。「モデル名まで」にすると「Claude（claude-sonnet-5）」のように、環境変数のモデル名も出ます。</p>
      </section>

      <section>
        <h3>告知ツイートのURL</h3>
        <div className="row">
          <input type="text" defaultValue={s.event_tweet_url} placeholder="https://x.com/..." onBlur={(e) => set("event_tweet_url", e.target.value.trim())} />
        </div>
        <p className="note">
          入口の「告知を見る」のリンク先になります。結果のXの投稿文には入れません。
          投稿文にこのURLを入れると、Xがそれを引用ツイートとして表示して、結果の画像カードが出なくなるためです。
        </p>
      </section>

      <section>
        <h3>号</h3>
        <div className="row">
          <input type="text" defaultValue={s.issue_label} placeholder="空なら今日の月（例 2026-10）" onBlur={(e) => set("issue_label", e.target.value.trim())} />
        </div>
      </section>

      <section>
        <h3>編集者</h3>
        <table className="tbl">
          <tbody>
            {EDITOR_KEYS.map((k) => {
              const e = EDITORS[k];
              const st = data.stats.byEditor[k];
              return (
                <tr key={k}>
                  <td>
                    {e.magazine}
                    <br />
                    <span className="note">{e.name}</span>
                  </td>
                  <td>
                    <button className={`small-btn${s[`editor_${k}_open`] === "1" ? " on" : ""}`} onClick={() => set(`editor_${k}_open`, "1")}>出勤</button>{" "}
                    <button className={`small-btn${s[`editor_${k}_open`] !== "1" ? " on" : ""}`} onClick={() => set(`editor_${k}_open`, "0")}>休業</button>
                  </td>
                  <td>
                    厳しさ{" "}
                    <select value={s[`strictness_${k}`] || "futsu"} onChange={(e) => set(`strictness_${k}`, e.target.value)} style={{ width: "auto", display: "inline-block" }}>
                      <option value="amai">甘め</option>
                      <option value="futsu">ふつう</option>
                      <option value="kibishii">厳しめ</option>
                    </select>
                  </td>
                  <td>
                    今日 {st.total}回　エラー {st.errors}回
                    <br />
                    <span className="note">
                      {Object.entries(st.placements).map(([p, n]) => `${PLACEMENT_LABEL[p as Placement] ?? p} ${n}`).join("　")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h3>発行</h3>
        <div className="row">
          {!published ? (
            <button className="small-btn danger" disabled={busy} onClick={() => confirm("受付を終了して表紙を固めます。3人の編集後記も作ります。よいですか？") && call({ action: "publish" })}>
              表紙を固める（発行）
            </button>
          ) : (
            <>
              <span className="note">発行済み {new Date(s.published_at).toLocaleString("ja-JP")}</span>
              <button className="small-btn" disabled={busy} onClick={() => call({ action: "unpublish" })}>発行を取り消す</button>
            </>
          )}
          <button className="small-btn" disabled={busy} onClick={() => call({ action: "afterword" })}>編集後記を書き直す（3人）</button>
        </div>
        {EDITOR_KEYS.map((k) => (
          <div key={k} style={{ marginTop: 8 }}>
            <p className="label">{EDITORS[k].name}の編集後記</p>
            <textarea defaultValue={data.afterwords[k] || ""} style={{ minHeight: 90 }} onBlur={(e) => call({ action: "afterword_set", editor: k, issue: data.issue, body: e.target.value })} />
          </div>
        ))}
      </section>

      <section>
        <h3>今日の傾向</h3>
        <p className="note">{data.stats.topReasons.map((r) => `${r.tag} ${r.count}`).join("　") || "まだありません"}</p>
      </section>

      <section>
        <h3>最近の結果</h3>
        <table className="tbl">
          <tbody>
            {data.recent.map((r) => (
              <tr key={r.id} style={{ opacity: r.hidden ? 0.5 : 1 }}>
                <td className="note">{new Date(r.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</td>
                <td>{EDITORS[r.editor].name}</td>
                <td>{PLACEMENT_LABEL[r.placement]} {r.score}</td>
                <td>
                  <a href={`/r/${r.id}`} target="_blank" rel="noopener">『{r.title}』</a> {r.pen_name}
                  {r.is_sample && <span className="badge">見本</span>}
                  {Number(r.revision) > 1 && <span className="badge">{r.revision}稿</span>}
                </td>
                <td>
                  <button className="small-btn" onClick={() => call({ action: "hide", id: r.id, hidden: !r.hidden })}>{r.hidden ? "戻す" : "表紙と目次から外す"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {data.errors.length > 0 && (
        <section>
          <h3>エラー</h3>
          <table className="tbl">
            <tbody>
              {data.errors.map((e, i) => (
                <tr key={i}>
                  <td className="note">{new Date(e.created_at).toLocaleTimeString("ja-JP")}</td>
                  <td>{e.editor}</td>
                  <td className="note" style={{ wordBreak: "break-all" }}>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
