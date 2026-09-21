import type { Provider, RawJudgement } from "./schema";
import type { EditorKey } from "../editors/types";

// AIを呼ばずに、docs/samples.md と同じ結果を返す。キーがない間の開発用。
const SAMPLE: Record<EditorKey, RawJudgement> = {
  kurodo: {
    work_type: "日記",
    placement: "tokushu",
    score: 62,
    title: "飲まないまま",
    title_alt: "",
    quote: "飲まないまま持って帰った",
    comment:
      "先に言っておくと、終電を逃して漫喫に泊まる話は、うちの読者はもう何度も読んでいます。\nただ、最後の「飲まないまま持って帰った」は、そうなるとは思いませんでした。ここがいいです。\nなぜ飲まなかったのかを書いていないので、読者は続きを自分で想像するしかありません。うちの読者は、自分では書けない文章を読みたがります。\nだから特集にします。\nもし毛布の話のほうが本題なら、私の読み方が間違っています。",
    next_request: "今回のように、理由を書かないで終わる話をもう1本お願いします。",
    reason_tags: ["理由を書かずに終わる", "先が読めた"],
    safe_for_cover: true,
  },
  nina: {
    work_type: "日記",
    placement: "kanto",
    score: 71,
    title: "毛布いりますか",
    title_alt: "ホットの緑茶",
    quote: "隣のブースの人が延々とポテトを食べる音がしていた",
    comment:
      "こういうのが読みたかったんです！\n「延々とポテトを食べる音」がいいです！足が伸ばせない席で、夜中の三時に起きていた人にしか書けません！\nちなみに毛布は、たたんでもたたまなくても毛布です。話を戻します！\nうちの読者には体がないので、寒いとか眠いとか、そういう話が大好きです。飲まないままの緑茶がだんだん冷めていくところまで、読者は喜びます！\nだから巻頭にします！\n作品名は『毛布いりますか』と『ホットの緑茶』で迷いました。やっぱり『毛布いりますか』にします！",
    next_request: "その緑茶を、家に帰ってからどうしたかも書いてください！",
    reason_tags: ["体の実感がある", "時間の実感がある"],
    safe_for_cover: true,
  },
  sol: {
    work_type: "日記",
    placement: "kanmatsu",
    score: 55,
    title: "たたまなくていい",
    title_alt: "",
    quote: "たたまなくていいんですよ",
    comment:
      "結論から言うと、巻末です。\n理由は2つあります。\n1つ目。この話を誰に向けて書いたのかが、最後までわかりません。受付の人に向けた話でも、隣の人に向けた話でもありません。誰にも向けていない文章なら、うちの読者は自分で書けてしまいます。\n2つ目。「たたまなくていいんですよ」だけは、人が人に向けて言った言葉です。ここだけは、読んでいて次が予想できませんでした。\n全部で7つの文のうち、4つは次にどうなるか予想がつきました。",
    next_request: "この夜のことを、誰か1人に話しかける形で書き直してください。その1人は、緑茶を渡したかった人がいいと思います。",
    reason_tags: ["宛先がない", "先が読めた"],
    safe_for_cover: true,
  },
};

export function mockProvider(editor: EditorKey): Provider {
  return {
    async judge(input) {
      await new Promise((r) => setTimeout(r, 1200));
      const base = SAMPLE[editor];
      // 原稿にサンプルの引用がなければ、引用は本文の最初の一文にする（検算で消えないように）
      const text = input.user.split("\n本文:\n")[1]?.split("\n---")[0] ?? "";
      const quote = text.includes(base.quote) ? base.quote : firstSentence(text);
      const seed = text.length;
      const placements = ["kanto", "tokushu", "kanmatsu", "namae", "jigo"] as const;
      const placement = text.includes(base.quote) ? base.placement : placements[seed % 5];
      return { ...base, quote, placement, score: 30 + (seed * 7) % 70 };
    },
    async free(input) {
      await new Promise((r) => setTimeout(r, 600));
      return `（モックの編集後記）今日はたくさんの原稿を読みました。${input.user.slice(0, 40)}`;
    },
  };
}

function firstSentence(text: string): string {
  const m = text.match(/^[^。！？\n]{4,60}/);
  return m ? m[0] : text.slice(0, 20);
}
