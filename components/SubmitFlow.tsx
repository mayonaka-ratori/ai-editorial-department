"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Space from "./Space";
import Avatar from "./Avatar";
import ResultView, { type ResultData } from "./ResultView";
import { EDITORS, type EditorKey } from "@/lib/editors";
import { ODAI, SAMPLES } from "@/lib/samples";

type Phase = "input" | "upload" | "reading" | "result";

function tokenize(text: string): string[] {
  try {
    const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
    if (Seg) return [...new Seg("ja", { granularity: "word" }).segment(text)].map((s) => s.segment).filter((s) => s.trim());
  } catch {}
  const out: string[] = [];
  for (let i = 0; i < text.length; i += 2) out.push(text.slice(i, i + 2));
  return out;
}

const DRAFT_KEY = "fable_draft";
const sentKey = (editor: string) => `fable_sent_${editor}`;

// 書き直して送るときに出す、前回の要点。
interface Prev {
  id: string;
  editor: EditorKey;
  title: string;
  placementLabel: string;
  nextRequest: string;
  penName: string;
  revision: number;
}

export default function SubmitFlow({ editor, appUrl, rewriteId = "" }: { editor: EditorKey; appUrl: string; rewriteId?: string }) {
  const e = EDITORS[editor];
  const [prev, setPrev] = useState<Prev | null>(null);
  const [sentText, setSentText] = useState("");
  const [pen, setPen] = useState("");
  const [text, setText] = useState("");
  const [odai, setOdai] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [err, setErr] = useState("");
  const [queue, setQueue] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);
  const [result, setResult] = useState<ResultData | null>(null);
  const [flying, setFlying] = useState<{ t: string; x: number; y: number; dx: number; dy: number; d: number }[]>([]);
  // 読まれている文章。見本のときは見本の文章で、原稿の欄には入れない。
  const [reading, setReading] = useState("");
  const [upl, setUpl] = useState(0);
  const [litCount, setLitCount] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const timers = useRef<number[]>([]);
  const light = editor === "nina";

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (d?.pen) setPen(d.pen);
      if (d?.text) setText(d.text);
      setSentText(localStorage.getItem(sentKey(editor)) || "");
    } catch {}
  }, [editor]);
  // 書き直しのとき、前回の作品名と判定と頼みごとを取ってくる（本文は保存していないので、手元の下書きを使う）
  useEffect(() => {
    if (!rewriteId) return;
    fetch(`/api/r/${rewriteId}`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && j.editor === editor && !j.isSample) {
          setPrev(j as Prev);
          if (j.penName) setPen(j.penName);
        }
      })
      .catch(() => {});
  }, [rewriteId, editor]);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ pen, text }));
    } catch {}
  }, [pen, text]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const n = [...text.trim()].length;
  const same = !!sentText && text.trim() === sentText;
  const problem = n < 20 ? "20字以上でお願いします" : n > 1000 ? "1000字までです" : !pen.trim() ? "ペンネームを入れてください" : same ? "同じ文章のままでは送れません" : "";
  const tokens = useMemo(() => tokenize(reading.trim()).slice(0, 120), [reading]);

  async function send(sampleId?: string) {
    setErr("");
    const body = sampleId ? { editor, sample: sampleId } : { editor, penName: pen.trim(), text: text.trim() };
    const sendText = sampleId ? SAMPLES.find((s) => s.id === sampleId)!.text : text.trim();
    // 見本は本文の欄に入れない。入れると端末の下書きに残り、そのまま自分の作品として送れてしまう。
    setReading(sendText);
    // 送る演出
    setPhase("upload");
    const ta = taRef.current?.getBoundingClientRect();
    const toks = tokenize(sendText).slice(0, 40);
    setFlying(
      toks.map((t, i) => {
        const x = (ta?.left ?? 20) + 10 + Math.random() * Math.max(40, (ta?.width ?? 300) - 60);
        const y = (ta?.top ?? 200) + 10 + Math.random() * 140;
        return { t, x, y, dx: window.innerWidth / 2 - x - 20, dy: 64 - y, d: i * 28 };
      }),
    );
    setUpl(0);
    const iv = window.setInterval(() => setUpl((p) => Math.min(100, p + 7)), 90);
    timers.current.push(iv);
    const started = Date.now();
    const req = fetch("/api/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
    timers.current.push(window.setTimeout(() => setPhase("reading"), 2100));
    let j: { ok: boolean; code?: string; message?: string; retryAfter?: number } & Partial<ResultData>;
    try {
      j = await req;
      let tries = 0;
      while (!j.ok && j.code === "busy" && tries < 3) {
        tries++;
        setQueue(`前に何人かいます。${j.retryAfter}秒ほどお待ちください。`);
        await new Promise((r) => setTimeout(r, (j.retryAfter ?? 6) * 1000));
        j = await fetch("/api/submit", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
      }
    } catch {
      j = { ok: false, message: "つながりませんでした。もう一度お試しください。" };
    }
    clearInterval(iv);
    const minRead = 5000;
    const wait = Math.max(0, minRead - (Date.now() - started));
    timers.current.push(
      window.setTimeout(() => {
        setQueue("");
        if (!j.ok) {
          setErr(j.message || "うまくいきませんでした。");
          setPhase("input");
          return;
        }
        // 「同じ文章のままでは送れません」は、判定が返ってきたときだけにする。
        // 送る前に覚えると、編集者側のエラーで戻ったときに同じ文章を送り直せなくなる。
        if (!sampleId) {
          try {
            localStorage.setItem(sentKey(editor), sendText);
          } catch {}
          setSentText(sendText);
        }
        setResult(j as ResultData);
        setPhase("result");
        window.scrollTo({ top: 0 });
      }, wait),
    );
  }

  // 読んでいる間: 表示の文を回し、単語を順に光らせる
  useEffect(() => {
    if (phase !== "reading") return;
    setLitCount(0);
    const rot = window.setInterval(() => setStatusIdx((i) => (i + 1) % e.reading.length), 2600);
    const total = Math.max(1, tokens.length);
    const step = 7000 / total;
    const lit = window.setInterval(() => setLitCount((c) => Math.min(total, c + 1)), step);
    timers.current.push(rot, lit);
    return () => {
      clearInterval(rot);
      clearInterval(lit);
    };
  }, [phase, tokens.length, e.reading.length]);

  if (phase === "result" && result) {
    return (
      <div className={`screen${light ? " onlight" : ""}`}>
        <Space editor={editor} />
        <div className="screen-inner">
          <ResultView data={result} animate appUrl={appUrl} />
        </div>
      </div>
    );
  }

  if (phase === "reading" || phase === "upload") {
    return (
      <div className={`screen${light ? " onlight" : ""}`}>
        <Space editor={editor} presence />
        {phase === "upload" && (
          <div className="post">
            <div className="portal" />
            <div className="upl">UPLOADING {upl}%</div>
            {flying.map((f, i) => (
              <div key={i} className="tk" style={{ left: f.x, top: f.y, animationDelay: `${f.d}ms`, ["--dx" as string]: `${f.dx}px`, ["--dy" as string]: `${f.dy}px` }}>
                {f.t}
              </div>
            ))}
          </div>
        )}
        <div className="reading-wrap" style={{ opacity: phase === "reading" ? 1 : 0, transition: "opacity .4s" }}>
          <Avatar editor={editor} pose="read" />
          <div className="tokens">
            {tokens.map((t, i) => (
              <span key={i} className={i < litCount ? "lit" : ""}>
                {t}
              </span>
            ))}
          </div>
          <div className="status">
            <span>{e.reading[statusIdx]}</span>
            <span className="dots" />
          </div>
          {queue && <p className="queue">{queue}</p>}
          <p className="presencelabel">READER IS HERE</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`screen${light ? " onlight" : ""}`}>
      <Space editor={editor} />
      <div className="screen-inner">
        {prev ? (
          <Link className="back-btn" href={`/r/${prev.id}`} style={{ color: "var(--cyan)" }}>
            ← 結果に戻る
          </Link>
        ) : (
          <Link className="back-btn" href="/editors" style={{ color: "var(--cyan)" }}>
            ← 別の雑誌にする
          </Link>
        )}
        <div className="editorbar">
          <Avatar editor={editor} />
          <div className="bubble">
            {prev ? (
              <>
                <b>{prev.revision + 1}稿目ですね。</b>前回の『{prev.title}』は{prev.placementLabel}でした。
              </>
            ) : (
              <>
                <b>{e.magazine}</b>　{e.greet}
              </>
            )}
          </div>
        </div>
        {prev && (
          <div className={`ask ${light ? "n" : editor === "kurodo" ? "k" : "s"}`}>
            <span className="label">{e.name}からの頼み</span>
            <span>{prev.nextRequest}</span>
          </div>
        )}
        <div className="field">
          <label htmlFor="pen">ペンネーム</label>
          <input id="pen" type="text" maxLength={10} value={pen} onChange={(ev) => setPen(ev.target.value)} placeholder="10字まで" />
        </div>
        <div className="field">
          <label htmlFor="text">{prev ? "原稿（前の原稿が入っています。書き直してください）" : "原稿"}</label>
          <textarea id="text" ref={taRef} value={text} onChange={(ev) => setText(ev.target.value)} placeholder="自分の文章を貼り付けるか、ここに書いてください。3行から10行くらいで。" />
          <div className="counter">
            <span>{n} / 1000</span>
            <span>{problem || "20字以上、1000字まで"}</span>
          </div>
          <p className="hint">長い文章なら、一部だけ貼っても構いません。</p>
        </div>
        <div className="field">
          <span className="label2">何を書けばいいかわからないときは</span>
          <div className="chips">
            {ODAI.map((o) => (
              <button key={o} type="button" className={`chip${odai === o ? " on" : ""}`} onClick={() => setOdai(o)}>
                {o}
              </button>
            ))}
          </div>
          <div className="odai">{odai ? `お題: ${odai}（3行でいいです）` : ""}</div>
        </div>
        {err && <p className="err">{err}</p>}
        <button className="btn" type="button" disabled={!!problem} onClick={() => send()}>
          {e.name}に送る{prev ? `（${prev.revision + 1}稿目）` : ""}
        </button>
        {prev && <p className="note" style={{ textAlign: "center" }}>表紙には1人1作まで。点数の高いほうが載ります。</p>}
        <div className="field">
          <span className="label2">文章を持っていないときは、見本で試せます（表紙には載りません）</span>
          <div className="chips">
            {SAMPLES.map((s) => (
              <button key={s.id} type="button" className="chip" onClick={() => send(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
