import Link from "next/link";
import Space from "@/components/Space";
import { getSettings } from "@/lib/settings";
import { computeStats } from "@/lib/stats";
import { peek, todayKey } from "@/lib/throttle";

export const dynamic = "force-dynamic";

export default async function Entry() {
  const settings = await getSettings();
  const cap = Number(settings.daily_cap || 3000);
  const used = await peek(`day:${todayKey()}`);
  const remaining = Math.max(0, cap - used);
  const accepting = settings.accepting === "1" && remaining > 0;
  const stats = await computeStats(settings);
  const top = stats.topReasons[0];

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
        <p style={{ fontSize: 14, color: "#c9d8f2" }}>
          ここはAIが読者の小説雑誌の編集部です。雑誌は3つ。あなたの文章を送ると、その雑誌のAI編集者が「うちの読者にウケるか」を判定します。
        </p>
        <ul className="asks">
          <li>送った文章は保存しません</li>
          <li>作品名と作者名は表紙と目次に載ります</li>
          <li>他の人の文章は送らないでください</li>
          <li>本日限り、合計{cap.toLocaleString()}回まで</li>
        </ul>
        <Link className="btn" href="/editors">
          編集部に入る
        </Link>
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
