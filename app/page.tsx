import Link from "next/link";
import Space from "@/components/Space";
import { getSettings } from "@/lib/settings";
import { computeStats } from "@/lib/stats";
import { peek, todayKey } from "@/lib/throttle";
import { readDevice } from "@/lib/device";
import { myWorks } from "@/lib/cover";
import { currentIssue } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Entry() {
  const settings = await getSettings();
  const cap = Number(settings.daily_cap || 3000);
  const used = await peek(`day:${todayKey()}`);
  const remaining = Math.max(0, cap - used);
  const accepting = settings.accepting === "1" && remaining > 0;
  const stats = await computeStats(settings);
  const top = stats.topReasons[0];
  const device = await readDevice();
  const mine = device.isNew ? [] : await myWorks(device.id, currentIssue(settings));
  const mineCount = mine.filter((w) => !w.is_sample).length;

  if (!accepting) {
    return (
      <div className="screen">
        <Space />
        <div className="closed">
          <div className="gate" style={{ height: 180, width: "100%" }}>
            <div className="ring r1" style={{ opacity: 0.3, animation: "none" }} />
            <div className="hexcore off">CLOSED</div>
          </div>
          <h2 style={{ fontSize: 22 }}>
            本日の持ち込み受付は
            <br />
            終了しました
          </h2>
          <p className="note">
            たくさんの原稿をありがとうございました。
            <br />
            表紙と結果のページはこのあとも見られます。
          </p>
          <Link className="btn soft" href="/cover">
            今日の表紙を見る
          </Link>
          {mineCount > 0 && (
            <Link className="btn ghost" href="/mine">
              自分の結果を見る（{mineCount}件）
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <Space motes={14} />
      <div className="screen-inner">
        <div className="gate">
          <div className="ring r3" />
          <div className="ring r1" />
          <div className="ring r2" />
          <div className="hexcore">AI</div>
        </div>
        <div className="hero">
          <p className="sub">AI EDITORIAL DEPT.</p>
          <h1>AI編集部</h1>
          <p className="label" style={{ marginTop: 4 }}>
            AIが読む小説雑誌を作っています
          </p>
        </div>
        <p style={{ fontSize: 14, color: "#c9d8f2" }}>あなたの文章を送ると、AIの編集者が「うちの読者にウケるか」を判定して、表紙に載せます。</p>
        <ol className="steps">
          <li>
            <span className="n">1</span>
            <b>選ぶ</b>
            <span>雑誌は3つ。編集者が1人ずつ</span>
          </li>
          <li>
            <span className="n">2</span>
            <b>送る</b>
            <span>自分の文章を貼るか、3行書く</span>
          </li>
          <li>
            <span className="n">3</span>
            <b>載る</b>
            <span>判定が出て、表紙に名前が載る</span>
          </li>
        </ol>
        <Link className="btn" href="/editors">
          編集部に入る
        </Link>
        {mineCount > 0 && (
          <Link className="btn ghost" href="/mine">
            自分の結果を見る（{mineCount}件）
          </Link>
        )}
        <p className="asks2">
          送った文章は保存しません。作品名と作者名は表紙と目次に載ります。他の人の文章は送らないでください。本日限り、合計{cap.toLocaleString()}回までです。
        </p>
        {top && (
          <p className="trend">
            今日いちばん多かった理由: <b>{top.tag}</b>（{top.count}件）
          </p>
        )}
        <div className="gauge">
          <div className="bar">
            <i style={{ width: `${Math.round((remaining / cap) * 100)}%` }} />
          </div>
          <div className="foot">
            <Link href="/cover">今日の表紙を見る</Link>
            <span className="num">
              残り {remaining.toLocaleString()} / {cap.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
