import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { one } from "@/lib/db";
import { EDITORS, PLACEMENT_LABEL, type EditorKey, type Placement } from "@/lib/editors";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const THEME: Record<EditorKey, { bg: string; edge: string; accent: string; fg: string; sub: string }> = {
  kurodo: { bg: "linear-gradient(160deg,#0a0806,#1a120a)", edge: "#ff8a3d", accent: "#ff8a3d", fg: "#f3ead8", sub: "#b9a68a" },
  nina: { bg: "linear-gradient(160deg,#ffffff,#eef4ff)", edge: "#4285f4", accent: "#4285f4", fg: "#1a1a1a", sub: "#555" },
  sol: { bg: "linear-gradient(160deg,#05070f,#0f1630)", edge: "#cfd6e6", accent: "#ffd86b", fg: "#ffffff", sub: "#8a94ad" },
};

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await one<{ editor: EditorKey; placement: Placement; title: string; pen_name: string; quote: string }>(
    "select editor, placement, title, pen_name, quote from submissions where id = $1",
    [id],
  );
  const [zenBlack, zenMed, raj] = await Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/zen-kaku-900.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/zen-kaku-500.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/rajdhani-700.ttf")),
  ]);
  const fonts = [
    { name: "Zen", data: zenBlack, weight: 900 as const, style: "normal" as const },
    { name: "Zen", data: zenMed, weight: 500 as const, style: "normal" as const },
    { name: "Raj", data: raj, weight: 700 as const, style: "normal" as const },
  ];
  if (!row) {
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#070b16", color: "#fff", fontFamily: "Zen", fontSize: 64, fontWeight: 900 }}>AI編集部</div>,
      { ...size, fonts },
    );
  }
  const e = EDITORS[row.editor];
  const t = THEME[row.editor];
  const gold = row.placement === "kanto";
  const label = PLACEMENT_LABEL[row.placement];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: t.bg, color: t.fg, fontFamily: "Zen", padding: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, border: `4px solid ${gold ? "#ffd86b" : t.edge}`, padding: "40px 48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "Raj", fontSize: 26, letterSpacing: 6, color: t.accent }}>{e.magazineEn}</div>
              <div style={{ fontSize: 44, fontWeight: 900 }}>{e.magazine}</div>
            </div>
            <div style={{ fontFamily: "Raj", fontSize: 26, letterSpacing: 6, color: t.sub }}>AI EDITORIAL DEPT.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <div
              style={{
                width: 200,
                height: 224,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                clipPath: "polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)",
                background: gold ? "linear-gradient(160deg,#fff4c2,#ffd86b 50%,#ff9d5c)" : row.editor === "nina" ? "linear-gradient(160deg,#4285f4,#ea4335 35%,#fbbc05 65%,#34a853)" : `linear-gradient(160deg,${t.edge},#2b2b2b)`,
                color: gold || row.editor === "nina" ? "#04101f" : "#fff",
                fontSize: label.length > 2 ? 40 : 60,
                fontWeight: 900,
                letterSpacing: 4,
              }}
            >
              {label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1.2 }}>{`『${row.title}』`}</div>
              <div style={{ fontSize: 28, color: t.sub, fontWeight: 500 }}>{`作: ${row.pen_name}　推薦: ${e.name}`}</div>
              {row.quote ? <div style={{ fontSize: 24, color: t.sub, fontWeight: 500, marginTop: 8 }}>{`「${row.quote.slice(0, 40)}」`}</div> : null}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Raj", fontSize: 22, letterSpacing: 4, color: t.sub }}>
            <div>{`${e.magazineEn} / ${e.name}`}</div>
            <div>#AI編集部</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
