import Link from "next/link";
import Space from "@/components/Space";
import Avatar from "@/components/Avatar";
import { EDITOR_KEYS, EDITORS } from "@/lib/editors";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
const CLS = { kurodo: "k", nina: "n", sol: "s" } as const;

export default async function Editors() {
  const settings = await getSettings();
  return (
    <div className="screen">
      <Space />
      <div className="screen-inner">
        <Link className="back-btn" href="/">
          ← 入口に戻る
        </Link>
        <h2 style={{ fontSize: 22 }}>どの雑誌に送りますか</h2>
        <p className="note">雑誌ごとに編集者がいて、見るところが違います。</p>
        <div className="cards">
          {EDITOR_KEYS.map((k) => {
            const e = EDITORS[k];
            const open = settings[`editor_${k}_open`] === "1";
            return (
              <Link key={k} className={`ecard ${CLS[k]}${open ? "" : " closed"}`} href={`/submit?editor=${k}`} aria-disabled={!open}>
                <Avatar editor={k} />
                <div>
                  <div className="magname">
                    {e.magazine}
                    <span className="yomi">{e.magazineEn}</span>
                  </div>
                  <div>
                    <span className="name">{e.name}</span>
                    <span className="yomi">{e.yomi}</span>
                  </div>
                  <div className="motto">「{e.motto}」</div>
                  <div className="looks">見るところ: {e.looks}</div>
                  {!open && <div className="looks">本日は休業です</div>}
                </div>
                <div className="core">CORE: {e.inside}</div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
