"use client";
import { useEffect, useMemo, useRef } from "react";
import type { EditorKey } from "@/lib/editors/types";

const GC = ["#4285f4", "#ea4335", "#fbbc05", "#34a853"];

// 空間の地。editor を渡すと、その雑誌の色の空間になる。
export default function Space({ editor, motes = 12, presence = false }: { editor?: EditorKey; motes?: number; presence?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const wins = useMemo(() => {
    const n = editor === "nina" ? 7 : editor === "kurodo" ? 5 : editor === "sol" ? 3 : 0;
    return Array.from({ length: n }, (_, i) => ({
      w: 40 + ((i * 37) % 90),
      h: 24 + ((i * 53) % 50),
      left: 5 + ((i * 41) % 80),
      // 上の30%より下には置かない。ペンネームの見出しや吹き出しに重なるため。
      top: 4 + ((i * 29) % 26),
      delay: -((i * 1.3) % 5),
      c: GC[i % 4],
    }));
  }, [editor]);
  const dots = useMemo(
    () =>
      Array.from({ length: editor === "nina" ? 0 : motes }, (_, i) => ({
        left: 5 + ((i * 53) % 90),
        top: 50 + ((i * 31) % 50),
        dur: 8 + ((i * 7) % 10),
        delay: -((i * 2.7) % 12),
      })),
    [editor, motes],
  );

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layers = root.querySelectorAll<HTMLElement>(".layer");
    const tilt = (x: number, y: number) => {
      layers.forEach((l) => {
        const k = l.classList.contains("back") ? 4 : l.classList.contains("mid") ? 10 : 16;
        l.style.transform = `translate(${x * k}px,${y * k}px)`;
      });
    };
    // スマホの傾きは使わない。iOSは傾きの取得に許可のダイアログが要り、体験の邪魔になる。
    // 視差は飾りなので、パソコンのマウスの位置だけで動かす。
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerType === "touch") return;
      tilt((ev.clientX / window.innerWidth) * 2 - 1, (ev.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={ref} className={editor ? `space sp ${editor}` : "space"} aria-hidden="true">
      <div className="layer back" />
      <div className="layer mid">
        {wins.map((w, i) => (
          <div
            key={i}
            className="win"
            style={{ width: w.w, height: w.h, left: `${w.left}%`, top: `${w.top}%`, animationDelay: `${w.delay}s`, ["--c" as string]: editor === "nina" ? w.c : undefined }}
          />
        ))}
      </div>
      <div className="layer front" />
      {editor === "kurodo" && <div className="orb" style={{ width: 220, height: 220, left: "30%", top: -60, background: "#ff8a3d" }} />}
      {editor === "nina" &&
        GC.map((c, i) => (
          <div key={c} className="orb" style={{ width: 160, height: 160, left: `${[-10, 60, 10, 70][i]}%`, top: `${[-8, -4, 70, 60][i]}%`, background: c, opacity: 0.35 }} />
        ))}
      {editor === "sol" && (
        <div className="planets">
          <i className="sun" />
          <i className="earth" />
          <i className="moon" />
        </div>
      )}
      {dots.map((d, i) => (
        <i key={i} className="mote" style={{ left: `${d.left}%`, top: `${d.top}%`, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }} />
      ))}
      {presence && <div className="presence" />}
    </div>
  );
}
