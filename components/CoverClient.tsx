"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Space from "./Space";
import CoverView from "./CoverView";
import type { CoverData } from "@/lib/cover";
import type { EditorKey } from "@/lib/editors/types";

type Payload = CoverData & { issueTitle: string; afterwords: Record<string, string>; total: number; topReasons: { tag: string; count: number }[] };
const NAME: Record<EditorKey, string> = { kurodo: "蔵人", nina: "二ナ", sol: "ソル" };

// スマホの表紙。3誌を切り替え、下に目次。
export default function CoverClient({ initial, defaultEditor = "nina" }: { initial: Payload; defaultEditor?: EditorKey }) {
  const [data, setData] = useState<Payload>(initial);
  const [key, setKey] = useState<EditorKey>(defaultEditor);
  const [q, setQ] = useState("");
  useEffect(() => {
    const iv = setInterval(() => fetch("/api/cover").then((r) => r.json()).then(setData).catch(() => {}), 10000);
    return () => clearInterval(iv);
  }, []);
  const m = data.magazines.find((x) => x.editor === key)!;
  const published = !!data.published_at;
  const onCover = [...m.kanto, ...m.tokushu, ...m.kanmatsu].map((w) => ({ id: w.id, title: w.title, pen_name: w.pen_name, pos: { kanto: "巻頭", tokushu: "特集", kanmatsu: "巻末" }[w.slot as "kanto" | "tokushu" | "kanmatsu"] }));
  const all = [...onCover, ...m.toc.map((t) => ({ id: t.id, title: t.title, pen_name: t.pen_name, pos: "" }))];
  const list = q.trim() ? all.filter((x) => x.pen_name.includes(q.trim()) || x.title.includes(q.trim())) : all;
  const aw = data.afterwords[key];
  return (
    <div className="screen">
      <Space />
      <div className="screen-inner" style={{ gap: 12 }}>
        <div className="coverbar">
          <Link className="back-btn" href="/">
            ← 入口
          </Link>
          <span>
            {data.issueTitle}　{published ? "発行" : "組版中"}
          </span>
        </div>
        <div className="tabs">
          {data.magazines.map((x) => (
            <button key={x.editor} className={x.editor === key ? "on" : ""} onClick={() => setKey(x.editor)}>
              {x.magazine}
            </button>
          ))}
        </div>
        <CoverView m={m} issueTitle={data.issueTitle} published={published} />
        {aw && (
          <div className="afterword">
            <b>{NAME[key]}の編集後記</b>
            {aw}
          </div>
        )}
        <p className="label">TOC　目次（{m.magazine}の全員）</p>
        <input type="text" placeholder="ペンネームか作品名で探す" value={q} onChange={(e) => setQ(e.target.value)} style={{ fontSize: 14 }} />
        <div className="toclist">
          {list.length === 0 && <div className="note">まだ誰も載っていません。</div>}
          {list.map((x) => (
            <div key={x.id}>
              <Link href={`/r/${x.id}`} style={{ textDecoration: "none" }}>
                『{x.title}』{x.pen_name}
              </Link>
              {x.pos && <span className="pos">{x.pos}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
