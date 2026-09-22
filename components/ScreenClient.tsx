"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CoverView from "./CoverView";
import Stage3D from "./Stage3D";
import type { CoverData } from "@/lib/cover";
import type { EditorKey } from "@/lib/editors/types";

type Payload = CoverData & { issueTitle: string; afterwords: Record<string, string>; total: number; topReasons: { tag: string; count: number }[] };
const ORDER: EditorKey[] = ["kurodo", "nina", "sol"];
const NAME: Record<EditorKey, string> = { kurodo: "蔵人", nina: "二ナ", sol: "ソル" };

// ブースの大画面。3誌が並び、真ん中が大きい。10秒ごとに更新、30秒ごとに真ん中を入れ替える。
// 3Dの空間は Stage3D（three.js）。表紙の中身はここで作って、Stage3D の枠に createPortal で入れる。
export default function ScreenClient({ initial, qr, appUrl }: { initial: Payload; qr: string; appUrl: string }) {
  const [data, setData] = useState<Payload>(initial);
  const [center, setCenter] = useState(1);
  const [slots, setSlots] = useState<Record<EditorKey, HTMLDivElement> | null>(null);
  useEffect(() => {
    const iv = setInterval(() => fetch("/api/cover").then((r) => r.json()).then(setData).catch(() => {}), 10000);
    const rot = setInterval(() => setCenter((c) => (c + 1) % 3), 30000);
    return () => {
      clearInterval(iv);
      clearInterval(rot);
    };
  }, []);
  const published = !!data.published_at;
  const arranged = [ORDER[(center + 2) % 3], ORDER[center], ORDER[(center + 1) % 3]];
  const mid = data.magazines.find((m) => m.editor === ORDER[center])!;
  const news = data.magazines.flatMap((m) => [...m.kanto, ...m.tokushu, ...m.kanmatsu].filter((w) => w.is_new).map((w) => `『${w.title}』${w.pen_name}（${m.magazine} ${{ kanto: "巻頭", tokushu: "特集", kanmatsu: "巻末" }[w.slot as "kanto" | "tokushu" | "kanmatsu"]}）`));
  // 目次は表紙に載っている人も含めて全員（スマホの目次と同じ並び）
  const tocAll = [...mid.kanto, ...mid.tokushu, ...mid.kanmatsu, ...mid.toc];
  const tocLine = tocAll.slice(0, 40).map((t) => `『${t.title}』${t.pen_name}`).join("　");
  const aw = data.afterwords[ORDER[center]];
  return (
    <div className="desk">
      <Stage3D order={arranged} onSlots={setSlots} />
      <div className="ticker">
        <span>{news.length ? `NEW　${news.join("　　")}` : `AI編集部　${data.issueTitle}　持ち込み ${data.total}回`}</span>
      </div>
      {slots &&
        ORDER.map((ek) => {
          const m = data.magazines.find((x) => x.editor === ek)!;
          return createPortal(<CoverView m={m} issueTitle={data.issueTitle} published={published} />, slots[ek], ek);
        })}
      <div className="side">
        <p className="label">{published ? "PUBLISHED" : "NOW TYPESETTING"}</p>
        <h2>
          {data.issueTitle}　{published ? "発行" : "組版中"}
        </h2>
        <p>3誌とも表紙は10枠。巻頭1、特集3、巻末6。点数の高い作品が入ると、下の作品は目次に移ります。</p>
        <p className="label" style={{ marginTop: 6 }}>TODAY</p>
        <p>持ち込み {data.total}回。{data.topReasons[0] ? `今日いちばん多かった理由: ${data.topReasons[0].tag}。` : ""}</p>
        {aw && (
          <div className="afterword" style={{ fontSize: 13 }}>
            <b>{NAME[ORDER[center]]}の編集後記</b>
            {aw}
          </div>
        )}
      </div>
      <div className="qr">
        {qr && <img src={qr} alt="持ち込みはこちら" />}
        <div>
          持ち込みはこちらから
          <br />
          <span className="num" style={{ fontSize: 12, color: "var(--mute)" }}>{appUrl.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
      <div className={`state${published ? " done" : ""}`}>{published ? "発行" : "組版中"}</div>
      <div className="ticker bottom">
        <span>
          {mid.magazine}の目次　{tocLine || "まだ誰も載っていません"}
        </span>
      </div>
    </div>
  );
}
