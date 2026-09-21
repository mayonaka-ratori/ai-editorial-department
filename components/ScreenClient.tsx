"use client";
import { useEffect, useState } from "react";
import Space from "./Space";
import CoverView from "./CoverView";
import type { CoverData } from "@/lib/cover";
import type { EditorKey } from "@/lib/editors/types";

type Payload = CoverData & { issueTitle: string; afterwords: Record<string, string>; total: number; topReasons: { tag: string; count: number }[] };
const ORDER: EditorKey[] = ["kurodo", "nina", "sol"];
const NAME: Record<EditorKey, string> = { kurodo: "蔵人", nina: "二ナ", sol: "ソル" };

// ブースの大画面。3誌が並び、真ん中が大きい。10秒ごとに更新、30秒ごとに真ん中を入れ替える。
export default function ScreenClient({ initial, qr, appUrl }: { initial: Payload; qr: string; appUrl: string }) {
  const [data, setData] = useState<Payload>(initial);
  const [center, setCenter] = useState(1);
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
  const tocLine = mid.toc.slice(0, 40).map((t) => `『${t.title}』${t.pen_name}`).join("　");
  const aw = data.afterwords[ORDER[center]];
  return (
    <div className="desk">
      <Space motes={30} />
      <div className="floor" />
      <div className="ticker">
        <span>{news.length ? `NEW　${news.join("　　")}` : `AI編集部　${data.issueTitle}　持ち込み ${data.total}回`}</span>
      </div>
      <div className="shelf">
        {arranged.map((ek, i) => {
          const m = data.magazines.find((x) => x.editor === ek)!;
          return (
            <div key={ek} className={`scene ${i === 1 ? "center" : i === 0 ? "left" : "right"}`}>
              <div className="book">
                <div className="back" />
                <div className="edge" />
                <CoverView m={m} issueTitle={data.issueTitle} published={published} />
              </div>
            </div>
          );
        })}
      </div>
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
