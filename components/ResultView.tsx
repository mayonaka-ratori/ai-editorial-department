"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import { EDITORS, PLACEMENT_LABEL, type EditorKey, type Placement } from "@/lib/editors";

export interface ResultData {
  id: string;
  editor: EditorKey;
  magazine: string;
  placement: Placement;
  placementLabel: string;
  score: number;
  title: string;
  titleAlt: string;
  quote: string;
  comment: string;
  nextRequest: string;
  reasonTags: string[];
  workType: string;
  isSample: boolean;
  revision: number;
  prevScore: number | null;
  penName: string;
  reactions: { key: EditorKey; name: string; line: string }[];
  status: string;
}

const CLS: Record<EditorKey, string> = { kurodo: "k", nina: "n", sol: "s" };
const SPEED: Record<EditorKey, number> = { kurodo: 42, nina: 20, sol: 30 };

export default function ResultView({ data, animate, appUrl, tweetUrl }: { data: ResultData; animate: boolean; appUrl: string; tweetUrl: string }) {
  const e = EDITORS[data.editor];
  const [typed, setTyped] = useState(animate ? "" : data.comment);
  const [phase, setPhase] = useState(animate ? 0 : 9);
  const [status, setStatus] = useState(data.status);
  const cardRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!animate) return;
    const chars = [...data.comment];
    let i = 0;
    let out = "";
    const step = () => {
      if (i >= chars.length) {
        setPhase(1);
        return;
      }
      const c = chars[i++];
      out += c;
      setTyped(out);
      let wait = SPEED[data.editor];
      if ("。！？".includes(c)) wait += data.editor === "kurodo" ? 380 : 160;
      if (c === "\n") wait += 180;
      timers.current.push(window.setTimeout(step, wait));
    };
    timers.current.push(window.setTimeout(step, 500));
    return () => timers.current.forEach(clearTimeout);
  }, [animate, data.comment, data.editor]);

  useEffect(() => {
    if (phase !== 1) return;
    const card = cardRef.current;
    timers.current.push(
      window.setTimeout(() => {
        card?.classList.add("shake", "flash");
        try {
          navigator.vibrate?.(40);
        } catch {}
      }, 360),
    );
    const seq = [2, 3, 4, 5, 6, 7, 8, 9];
    const at = [900, 1100, 1300, 1800, 2400, 3200, 3400, 3500];
    seq.forEach((p, i) => timers.current.push(window.setTimeout(() => setPhase(p), at[i])));
  }, [phase]);

  // いまの掲載を最新にする（結果ページを開き直したとき）
  useEffect(() => {
    if (animate) return;
    fetch(`/api/r/${data.id}/status`).then((r) => r.json()).then((j) => j?.status && setStatus(j.status)).catch(() => {});
  }, [animate, data.id]);

  const resultUrl = `${appUrl}/r/${data.id}`;
  const tweetText = `AI編集部の${data.magazine}に持ち込んだら、${e.name}が${data.placementLabel}にしてくれました。作品名『${data.title}』 #AI編集部 ${resultUrl}${tweetUrl ? " " + tweetUrl : ""}`;
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  const gold = data.placement === "kanto";
  const showSeal = phase >= 1;
  const cls = (p: number) => `fade${phase >= p ? " in" : ""}`;
  const mineText = data.isSample ? "（見本なので載りません）" : data.placement === "jigo" ? "（今回は載りません）" : data.placement === "namae" ? "（目次に載ります）" : `『${data.title}』`;
  const diff = data.prevScore == null ? null : data.score - data.prevScore;

  return (
    <div className="result">
      <div className="editorbar">
        <Avatar editor={data.editor} pose="judge" />
        <div className="bubble">
          {data.magazine}の{e.name}が読みました
          {data.revision > 1 && <span className="badge">{data.revision}稿目</span>}
          {data.isSample && <span className="badge">見本</span>}
        </div>
      </div>
      <div className="glass corner" ref={cardRef}>
        {data.quote ? (
          <>
            <p className="label">QUOTE</p>
            <p className="quote">「{data.quote}」</p>
          </>
        ) : null}
        <p className="comment" style={{ marginTop: data.quote ? 12 : 0 }}>
          {typed}
          {animate && phase === 0 && <span className="cursor" />}
        </p>
        <div className="sealwrap">
          <div className={`seal ${CLS[data.editor]}${gold ? " gold" : ""}${showSeal ? (animate ? " drop" : " show") : ""}`}>
            <div className="hex" />
            <div className="hex in" />
            <div className="orbit" />
            <div className={`txt${data.placementLabel.length > 2 ? " long" : ""}`}>{data.placementLabel}</div>
            <div className="sub">PLACEMENT</div>
          </div>
        </div>
        <div className={`titlebox ${cls(2)}`}>
          <p className="label">TITLE</p>
          <p className="t">『{data.title}』</p>
          <p className="a">
            作: <b>{data.penName}</b>　推薦: <b>{e.name}</b>
          </p>
          {data.titleAlt && <p className="a">もう1案: 『{data.titleAlt}』</p>}
        </div>
        <p className={`nowline ${cls(3)}`}>
          <span className="label">NOW</span>
          <span>
            {status}
            {diff != null && (diff > 0 ? `　前回より${diff}点上がりました。` : diff < 0 ? `　前回より${-diff}点下がりました。` : "　前回と同じ点数です。")}
          </span>
        </p>
        <p className={`next ${cls(4)}`} style={{ marginTop: 10 }}>
          <b>次は:</b> {data.nextRequest}
        </p>
        {data.reasonTags.length > 0 && (
          <div className={`rtags ${cls(4)}`}>
            {data.reasonTags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className={`others ${cls(5)}`}>
        {data.reactions.map((r) => (
          <div className="o" key={r.key}>
            <div className={`face ${CLS[r.key]}`}>{r.name[0]}</div>
            <div>
              <b>{r.name}</b>「{r.line}」
            </div>
          </div>
        ))}
      </div>
      <div className={`minicover${phase >= 6 ? " in" : ""}`}>
        <div className="no">{PLACEMENT_LABEL[data.placement]}</div>
        <div className="mag">{data.magazine}</div>
        <div className="mine">
          {mineText}
          <small>{data.penName}</small>
        </div>
      </div>
      <div className={`actions ${cls(7)}`}>
        {!data.isSample && (
          <a className="btn" href={intent} target="_blank" rel="noopener">
            Xに投稿する
          </a>
        )}
        <Link className="btn soft" href="/cover">
          表紙を見る
        </Link>
        <Link className="btn ghost" href="/editors">
          別の雑誌に送る
        </Link>
      </div>
      <p className={`url ${cls(8)}`}>{resultUrl}</p>
    </div>
  );
}
