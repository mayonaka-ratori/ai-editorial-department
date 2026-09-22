"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Space from "./Space";
import Avatar from "./Avatar";
import ScaledCover from "./ScaledCover";
import type { MagazineCover } from "@/lib/cover";
import { EDITORS, EDITOR_KEYS, type EditorKey } from "@/lib/editors";

const CLS: Record<EditorKey, string> = { kurodo: "k", nina: "n", sol: "s" };

// 雑誌を選ぶ画面。3誌の表紙を並べ、真ん中が大きい。左右に動かすか、横の表紙を押すと入れ替わる。
export default function MagazinePicker({
  magazines,
  issueTitle,
  published,
  open,
  initial = "nina",
  models = {},
}: {
  magazines: MagazineCover[];
  issueTitle: string;
  published: boolean;
  open: Record<EditorKey, boolean>;
  initial?: EditorKey;
  // 「CORE:」に添えるモデル名。管理画面で「モデル名まで」にしたときだけ入る。
  models?: Partial<Record<EditorKey, string>>;
}) {
  const router = useRouter();
  const [idx, setIdx] = useState(Math.max(0, EDITOR_KEYS.indexOf(initial)));
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const key = EDITOR_KEYS[idx];
  const e = EDITORS[key];
  const isOpen = open[key];
  const byKey = (k: EditorKey) => magazines.find((m) => m.editor === k)!;
  const left = EDITOR_KEYS[(idx + 2) % 3];
  const right = EDITOR_KEYS[(idx + 1) % 3];

  const onDown = (ev: React.PointerEvent) => {
    start.current = { x: ev.clientX, y: ev.clientY };
    moved.current = false;
  };
  const onMove = (ev: React.PointerEvent) => {
    if (!start.current) return;
    if (Math.abs(ev.clientX - start.current.x) > 12) moved.current = true;
  };
  const onUp = (ev: React.PointerEvent) => {
    if (!start.current) return;
    const dx = ev.clientX - start.current.x;
    start.current = null;
    if (dx < -40) setIdx((i) => (i + 1) % 3);
    else if (dx > 40) setIdx((i) => (i + 2) % 3);
  };
  const go = () => {
    if (isOpen) router.push(`/submit?editor=${key}`);
  };

  return (
    <div className="screen">
      <Space />
      <div className="screen-inner picker">
        <Link className="back-btn" href="/">
          ← 入口に戻る
        </Link>
        <h2 style={{ fontSize: 22 }}>どの雑誌に送りますか</h2>
        <p className="note">左右に動かして、真ん中の表紙を押すと決まります。</p>
        <div className="carousel" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => (start.current = null)}>
          <button type="button" className={`side${open[left] ? "" : " closed"}`} aria-label={`${EDITORS[left].magazine}を選ぶ`} onClick={() => !moved.current && setIdx((i) => (i + 2) % 3)}>
            <ScaledCover m={byKey(left)} issueTitle={issueTitle} published={published} width={110} />
          </button>
          <button type="button" className={`center ${CLS[key]}${isOpen ? "" : " closed"}`} aria-label={`${e.magazine}に送る`} onClick={() => !moved.current && go()}>
            <ScaledCover m={byKey(key)} issueTitle={issueTitle} published={published} width={224} />
            {!isOpen && <span className="closedtag">本日は休業です</span>}
          </button>
          <button type="button" className={`side${open[right] ? "" : " closed"}`} aria-label={`${EDITORS[right].magazine}を選ぶ`} onClick={() => !moved.current && setIdx((i) => (i + 1) % 3)}>
            <ScaledCover m={byKey(right)} issueTitle={issueTitle} published={published} width={110} />
          </button>
        </div>
        <div className="pagedots">
          {EDITOR_KEYS.map((k, i) => (
            <button key={k} type="button" className={`${CLS[k]}${i === idx ? " on" : ""}`} aria-label={EDITORS[k].magazine} onClick={() => setIdx(i)} />
          ))}
        </div>
        <div className={`ecard pick ${CLS[key]}${isOpen ? "" : " closed"}`}>
          <Avatar editor={key} />
          <div>
            <div className="magname">
              {e.magazine}
              {/* 「GEMINI　GEMINI WEEKLY」と重なって見えないように、雑誌名と同じ語は省く */}
              <span className="yomi">{e.magazineEn.startsWith(e.magazine) ? e.magazineEn.slice(e.magazine.length).trim() : e.magazineEn}</span>
            </div>
            <div>
              <span className="name">{e.name}</span>
              <span className="yomi">{e.yomi}</span>
            </div>
            <div className="motto">「{e.motto}」</div>
            <div className="looks">見るところ: {e.looks}</div>
            {!isOpen && <div className="looks">本日は休業です</div>}
          </div>
          <div className="core">
            CORE: {e.inside}
            {models[key] ? `（${models[key]}）` : ""}
          </div>
        </div>
        <button className="btn" type="button" disabled={!isOpen} onClick={go}>
          {e.magazine}に送る
        </button>
      </div>
    </div>
  );
}
