"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import { EDITORS, PLACEMENT_LABEL, type EditorKey, type Placement } from "@/lib/editors";
import { bestLine, tweetLead } from "@/lib/lines";

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
  aiStyle: boolean;
  revision: number;
  prevScore: number | null;
  penName: string;
  reactions: { key: EditorKey; name: string; line: string }[];
  status: string;
  statusKind: "cover" | "toc" | "none" | "sample";
  placementNote: string;
}

const CLS: Record<EditorKey, string> = { kurodo: "k", nina: "n", sol: "s" };
const SPEED: Record<EditorKey, number> = { kurodo: 42, nina: 20, sol: 30 };

export default function ResultView({ data, animate, appUrl }: { data: ResultData; animate: boolean; appUrl: string }) {
  const e = EDITORS[data.editor];
  const [typed, setTyped] = useState(animate ? "" : data.comment);
  const [phase, setPhase] = useState(animate ? 0 : 9);
  const [status, setStatus] = useState(data.status);
  const [note, setNote] = useState(data.placementNote);
  const [kind, setKind] = useState(data.statusKind);
  // APP_URLを設定し忘れても、投稿文のURLがドメインなしにならないようにする。
  const [base, setBase] = useState(appUrl);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const typing = useRef<number[]>([]);

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
      typing.current.push(window.setTimeout(step, wait));
    };
    typing.current.push(window.setTimeout(step, 500));
    return () => {
      typing.current.forEach(clearTimeout);
      timers.current.forEach(clearTimeout);
    };
  }, [animate, data.comment, data.editor]);

  // 画面をタップすると、1文字ずつの表示をやめて全部出す。
  const skip = () => {
    if (phase !== 0) return;
    typing.current.forEach(clearTimeout);
    typing.current = [];
    setTyped(data.comment);
    setPhase(1);
  };

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
    fetch(`/api/r/${data.id}/status`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.status) setStatus(j.status);
        if (j?.placementNote) setNote(j.placementNote);
        if (j?.kind) setKind(j.kind);
      })
      .catch(() => {});
  }, [animate, data.id]);

  useEffect(() => {
    if (!appUrl && typeof window !== "undefined") setBase(window.location.origin);
  }, [appUrl]);

  useEffect(() => {
    try {
      setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    } catch {}
  }, []);

  const resultUrl = `${base}/r/${data.id}`;
  const line = bestLine(data.comment);
  // 結果URLは投稿文のいちばん最後に置く。ここに別の投稿のURLを足すと、
  // Xがそちらを引用ツイートとして表示して、結果の画像カードが出なくなる。
  const tweetText =
    tweetLead(data.magazine, e.name, data.placement) +
    (line ? `\n${e.name}「${line}」` : "") +
    `\n作品名『${data.title}』 #AI編集部 ${resultUrl}`;
  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  const gold = data.placement === "kanto";
  const showSeal = phase >= 1;
  const cls = (p: number) => `fade${phase >= p ? " in" : ""}`;
  // 小さい表紙の絵も、判定ではなくいまの掲載で出し分ける。
  const mineText = kind === "sample" ? "（見本なので載りません）" : kind === "none" ? "（今回は載りません）" : kind === "toc" ? "（目次に載ります）" : `『${data.title}』`;
  const diff = data.prevScore == null ? null : data.score - data.prevScore;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(resultUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("このリンクをコピーしてください", resultUrl);
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: `『${data.title}』 ${data.magazine}`, text: tweetText.replace(resultUrl, "").trim(), url: resultUrl });
    } catch {}
  };

  return (
    <div className="result" onClick={skip}>
      <div className="editorbar">
        <Avatar editor={data.editor} pose="judge" />
        <div className="bubble">
          {data.magazine}の{e.name}が読みました
          {data.revision > 1 && <span className="badge">{data.revision}稿目</span>}
          {data.isSample && <span className="badge">見本</span>}
          {data.aiStyle && <span className="badge">AIっぽく</span>}
        </div>
      </div>
      <div className={`glass corner${animate && phase === 0 ? " typing" : ""}`} ref={cardRef}>
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
        {animate && phase === 0 && <p className="taphint">画面をタップすると、全部出ます</p>}
        <div className="sealwrap">
          <div className={`seal ${CLS[data.editor]}${gold ? " gold" : ""}${showSeal ? (animate ? " drop" : " show") : ""}`}>
            <div className="hex" />
            <div className="hex in" />
            <div className="orbit" />
            <div className={`txt${data.placementLabel.length > 4 ? " xl" : data.placementLabel.length > 2 ? " long" : ""}`}>
              {/* 「人間の部署へ」は長いので2行に分ける */}
              {data.placementLabel.length > 4 ? (
                <>
                  {data.placementLabel.slice(0, 3)}
                  <br />
                  {data.placementLabel.slice(3)}
                </>
              ) : (
                data.placementLabel
              )}
            </div>
            <div className="sub">PLACEMENT</div>
          </div>
        </div>
        <p className={`sealnote ${cls(2)}`}>
          <b>{data.placementLabel}</b>
          {note}
        </p>
        <div className={`titlebox ${cls(2)}`}>
          <p className="label">TITLE</p>
          <p className="t">『{data.title}』</p>
          <p className="a">
            作: <b>{data.penName}</b>　{data.placement === "jigo" ? "読んだ人" : "推薦"}: <b>{e.name}</b>
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
          <Link className={`btn rewrite ${CLS[data.editor]}`} href={`/submit?editor=${data.editor}&rewrite=${data.id}`}>
            <span>書き直して、もう一度{e.name}に送る</span>
            <small>さっきの原稿が入った状態で戻ります（{data.revision + 1}稿目）</small>
          </Link>
        )}
        {!data.isSample && (
          <a className="btn" href={intent} target="_blank" rel="noopener">
            Xに投稿する
          </a>
        )}
        <div className="grid2">
          <Link className="btn soft" href={`/cover?m=${data.editor}`}>
            表紙を見る
          </Link>
          <Link className="btn ghost" href="/editors">
            別の雑誌に送る
          </Link>
        </div>
        {!data.isSample && (
          <div className="sharerow">
            <a href={`/r/${data.id}/opengraph-image`} target="_blank" rel="noopener">
              画像を保存する
            </a>
            <button type="button" onClick={copyLink}>
              {copied ? "コピーしました" : "リンクをコピー"}
            </button>
            {canShare && (
              <button type="button" onClick={share}>
                共有する
              </button>
            )}
          </div>
        )}
      </div>
      <p className={`url ${cls(8)}`}>{resultUrl}</p>
    </div>
  );
}
