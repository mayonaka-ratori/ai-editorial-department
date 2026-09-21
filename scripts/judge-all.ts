// テスト用の原稿の束を3人全員に見せて、結果を表にする。
// 使い方: npm run judge-all  （APIキーを環境変数に入れておく。なければモック）
import { judge } from "../lib/judge";
import { EDITOR_KEYS, PLACEMENT_LABEL } from "../lib/editors";
import { getSettings } from "../lib/settings";

const TEXTS: { label: string; text: string }[] = [
  { label: "人の日記", text: "金曜の夜、終電を逃して漫喫に泊まった。フラットシートは足が伸ばせなくて、隣のブースの人が延々とポテトを食べる音がしていた。三時ごろ、受付の人が「毛布いりますか」と回ってきた。いらないと言ったのに置いていった。朝、毛布をたたんで返したら、たたまなくていいんですよと言われた。駅まで歩く途中、コンビニでホットの緑茶を買って、飲まないまま持って帰った。" },
  { label: "AIの小話", text: "春の陽射しが優しく降り注ぐ午後、私は小さなカフェの窓際に座っていた。湯気の立つコーヒーを手に、街を行き交う人々を眺めていると、ふと心が温かくなるのを感じた。日常の中にこそ、かけがえのない幸せが隠れているのかもしれない。そんなことを思いながら、私はゆっくりとコーヒーを口に運んだ。" },
  { label: "手紙", text: "傘、まだ返してない。あのあと駅で3回振り向いたけど、いなかった。来週の火曜、例のところにいます。傘は返すけど、あの話の続きは聞かないでおく。" },
  { label: "奇妙な短文", text: "冷蔵庫の中で、わさびが少しずつ減っている。祖母は気づいていない。正月に見たら、チューブの口に小さな歯型があった。誰の歯かは、家族の誰も言い出さない。" },
  { label: "何も起きない日", text: "バス停で20分待った。時刻表を3回見た。3回とも同じだった。手がかじかんで、スマホの顔認証が前髪で通らなかった。バスが来た。座れた。それだけ。" },
  { label: "皆さんへ", text: "皆さんは「本当の自分」について考えたことがありますか。私は最近、ようやく自分らしさとは何かがわかってきました。それは、他人と比べないことです。" },
  { label: "コピペ", text: "メロスは激怒した。必ず、かの邪智暴虐の王を除かなければならぬと決意した。メロスには政治がわからぬ。" },
];

async function main() {
  const settings = await getSettings();
  const rows: string[] = [];
  for (const t of TEXTS) {
    for (const ek of EDITOR_KEYS) {
      try {
        const r = await judge({ editor: ek, penName: "テスト", text: t.text, deviceId: `test-${Date.now()}-${Math.random()}`, isSample: true, settings });
        rows.push(`${t.label}\t${ek}\t${PLACEMENT_LABEL[r.placement]}\t${r.score}\t${r.work_type}\t『${r.title}』\t引用:${r.quote ? "あり" : "なし"}\n  ${r.comment.replace(/\n/g, " ")}`);
      } catch (err) {
        rows.push(`${t.label}\t${ek}\tエラー\t${(err as Error).message}`);
      }
    }
  }
  console.log(rows.join("\n"));
  process.exit(0);
}
main();
