import CoverView from "./CoverView";
import type { MagazineCover } from "@/lib/cover";

// 表紙を、決めた幅に縮めて出す。中身は350px幅で組んでから縮めるので、どの大きさでも文字の折り返しが変わらない。
const BASE = 350;
const RATIO: Record<string, number> = { kurodo: 2 / 3, nina: 1328 / 1760, sol: 2 / 3 };

export default function ScaledCover({ m, issueTitle, published, width, mine }: { m: MagazineCover; issueTitle: string; published: boolean; width: number; mine?: string[] }) {
  const ratio = RATIO[m.editor] ?? 2 / 3;
  const height = Math.round(width / ratio);
  const scale = width / BASE;
  return (
    <div className="scaled" style={{ width, height }}>
      <div style={{ width: BASE, height: Math.round(BASE / ratio), transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <CoverView m={m} issueTitle={issueTitle} published={published} mine={mine} />
      </div>
    </div>
  );
}
