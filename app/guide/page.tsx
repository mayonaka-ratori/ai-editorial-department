import Link from "next/link";
import type { Metadata } from "next";
import Space from "@/components/Space";
import { getSettings, currentIssue } from "@/lib/settings";
import { peek, todayKey } from "@/lib/throttle";
import { readDevice } from "@/lib/device";
import { myWorks } from "@/lib/cover";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI編集部の遊び方" };

// 遊び方のページ。ブースのQRコードはここに来る。読み終えたら、そのまま雑誌を選ぶ画面へ進む。
// 行き先はアプリの中なので、公開先のURLが変わってもこのページは直さなくてよい。
export default async function Guide() {
  const settings = await getSettings();
  const cap = Number(settings.daily_cap) > 0 ? Number(settings.daily_cap) : 3000;
  const used = await peek(`day:${todayKey()}`);
  const accepting = settings.accepting === "1" && used < cap;
  const device = await readDevice();
  const mine = device.isNew ? [] : await myWorks(device.id, currentIssue(settings));
  const mineCount = mine.filter((w) => !w.is_sample).length;

  return (
    <div className="screen guide-page">
      <Space motes={10} />
      <div className="screen-inner guide">
        <div className="hero">
          <p className="sub">HOW TO PLAY</p>
          <h1>AI編集部の遊び方</h1>
          <p className="lead">AIが読む小説雑誌に、あなたの文章を持ち込むゲームです。3分ほどで遊べます。</p>
        </div>

        <ol className="gsteps">
          <li>
            <span className="n">1</span>
            <div>
              <b>雑誌を選ぶ</b>
              <p>雑誌は3つ。編集者はそれぞれ別の会社のAIです。</p>
              <div className="mags">
                <span className="k">季刊フェーブル</span>
                <span className="n2">GEMINI</span>
                <span className="s">月刊アストラ</span>
              </div>
            </div>
          </li>
          <li>
            <span className="n">2</span>
            <div>
              <b>文章を送る</b>
              <p>自分の文章を貼るか、その場で3行書きます。文章がなければ見本でも試せます。</p>
            </div>
          </li>
          <li>
            <span className="n">3</span>
            <div>
              <b>判定が出る</b>
              <p>「うちの読者（AI）が読みたがるか」で、5つのどれかに決まります。</p>
              <div className="ranks">
                <span className="gold">巻頭</span>
                <span>特集</span>
                <span>巻末</span>
                <span>名前だけ</span>
                <span className="human">人間の部署へ</span>
              </div>
            </div>
          </li>
          <li>
            <span className="n">4</span>
            <div>
              <b>表紙に載る</b>
              <p>判定が良いと、作品名とペンネームが表紙とブースの大画面に載ります。結果はXに投稿できます。</p>
            </div>
          </li>
        </ol>

        <div className="gtip">
          <p className="label">TIP</p>
          <p>
            <b>AIが自分では書けない文章</b>ほど、高く評価されます。うまさより、あなたにしか書けない一文が大事です。
          </p>
        </div>

        <p className="asks2">送った文章は保存しません。他の人の文章は送らないでください。</p>

        {accepting ? (
          // 画面の下に固定して、読んでいる途中でもすぐ始められるようにする
          <Link className="btn go" href="/editors">
            編集部に入る
          </Link>
        ) : (
          <>
            <p className="err" style={{ textAlign: "center" }}>
              本日の持ち込み受付は終了しました。表紙と結果のページは、このあとも見られます。
            </p>
            <Link className="btn soft" href="/cover">
              今日の表紙を見る
            </Link>
          </>
        )}
        {mineCount > 0 && (
          <Link className="btn ghost" href="/mine">
            自分の結果を見る（{mineCount}件）
          </Link>
        )}
      </div>
    </div>
  );
}
