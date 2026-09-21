import Link from "next/link";
import Space from "@/components/Space";
import { readDevice } from "@/lib/device";
import { computeCover, myWorks } from "@/lib/cover";
import { currentIssue, getSettings } from "@/lib/settings";
import { PLACEMENT_LABEL } from "@/lib/editors";

export const dynamic = "force-dynamic";
const CLS = { kurodo: "k", nina: "n", sol: "s" } as const;
const SLOT = { kanto: "巻頭", tokushu: "特集", kanmatsu: "巻末", toc: "目次", namae: "", jigo: "" } as const;

// この端末で送った結果の一覧。端末の目印（クッキー）で見分ける。
export default async function Mine() {
  const settings = await getSettings();
  const device = await readDevice();
  const issue = currentIssue(settings);
  const works = device.isNew ? [] : await myWorks(device.id, issue);
  const cover = await computeCover(settings);
  return (
    <div className="screen">
      <Space />
      <div className="screen-inner">
        <Link className="back-btn" href="/">
          ← 入口に戻る
        </Link>
        <h2 style={{ fontSize: 22 }}>自分の結果</h2>
        <p className="note">この端末から送ったものです。押すと結果のページが開きます。</p>
        {works.length === 0 && <p className="note">この端末からは、まだ送っていません。</p>}
        <div className="mylist">
          {works.map((w) => {
            const pos = cover.positions[w.id];
            const now = w.is_sample ? "見本" : pos ? `今は${SLOT[pos.slot]}` : "載っていません";
            return (
              <Link key={w.id} href={`/r/${w.id}`} className={`myitem ${CLS[w.editor]}`}>
                <div className="top">
                  <span className="mag">{w.magazine}</span>
                  <span className="pl">{PLACEMENT_LABEL[w.placement]}</span>
                </div>
                <div className="t">『{w.title}』</div>
                <div className="sub">
                  {w.pen_name}
                  {w.revision > 1 ? `　${w.revision}稿目` : ""}　{now}
                </div>
              </Link>
            );
          })}
        </div>
        <Link className="btn soft" href="/cover">
          表紙で確かめる
        </Link>
        <Link className="btn ghost" href="/editors">
          もう1本送る
        </Link>
      </div>
    </div>
  );
}
