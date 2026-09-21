import type { EditorKey } from "@/lib/editors/types";

const CLS: Record<EditorKey, string> = { kurodo: "k", nina: "n", sol: "s" };
const INITIAL: Record<EditorKey, string> = { kurodo: "蔵", nina: "二", sol: "ソ" };

// 編集者の顔。絵が届くまでは名前の1文字。絵は public/editors/{key}/face-{pose}.png に置く。
export default function Avatar({ editor, pose = "wait", small = false }: { editor: EditorKey; pose?: "wait" | "read" | "judge"; small?: boolean }) {
  return (
    <div className={`avatar ${CLS[editor]}`} style={small ? { width: 40, height: 46 } : undefined}>
      <div className="halo" style={small ? { width: 32, height: 10, borderWidth: 2 } : undefined} />
      <div className={`face${pose === "read" ? " reading" : ""}`} style={small ? { width: 34, height: 34, fontSize: 14 } : undefined}>
        {INITIAL[editor]}
      </div>
    </div>
  );
}
