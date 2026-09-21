export type EditorKey = "kurodo" | "nina" | "sol";
export type Placement = "kanto" | "tokushu" | "kanmatsu" | "namae" | "jigo";
export type WorkType = "日記" | "手紙" | "小説" | "詩" | "つぶやき" | "AIが書いたもの" | "コピペ";

export const PLACEMENTS: Placement[] = ["kanto", "tokushu", "kanmatsu", "namae", "jigo"];
export const PLACEMENT_LABEL: Record<Placement, string> = {
  kanto: "巻頭",
  tokushu: "特集",
  kanmatsu: "巻末",
  namae: "名前だけ",
  jigo: "次号待ち",
};
// 判定の印のすぐ下に出す説明は lib/lines.ts の placementNote にある（いまの掲載で言い方が変わるため）。
export const PLACEMENT_BASE: Record<Placement, number> = {
  kanto: 400,
  tokushu: 300,
  kanmatsu: 200,
  namae: 100,
  jigo: 0,
};
export const WORK_TYPES: WorkType[] = ["日記", "手紙", "小説", "詩", "つぶやき", "AIが書いたもの", "コピペ"];

// 理由の札。AIはこの中から最大2つ選ぶ。
export const REASON_TAGS = [
  "決まり文句が多い",
  "先が読めた",
  "先が読めなかった",
  "固有名詞がいい",
  "数字が細かい",
  "体の実感がある",
  "時間の実感がある",
  "宛先がある",
  "宛先がない",
  "理由を書かずに終わる",
  "説明が多すぎる",
  "うちの読者にも書けそうだ",
  "どこかで読んだ",
] as const;

export interface EditorProfile {
  key: EditorKey;
  name: string;
  fullName: string;
  yomi: string;
  magazine: string;
  magazineEn: string;
  inside: string; // 中身の会社名
  motto: string;
  looks: string;
  greet: string;
  reading: string[]; // 読んでいる間の表示
  quirks: string[]; // 癖。毎回1つか2つ選んで指示文に入れる
  system: string; // 固定の指示文（この編集者ぶん）
  strictness: Record<"amai" | "futsu" | "kibishii", string>;
  famousReply: (title: string) => string; // 有名作品だったときの決まった返事
  typeHints: Partial<Record<WorkType, string>>; // 作品の種類ごとの見るところ
}

export interface Judgement {
  work_type: WorkType;
  placement: Placement;
  score: number; // 0から100
  title: string;
  title_alt: string;
  quote: string;
  comment: string;
  next_request: string;
  reason_tags: string[];
  safe_for_cover: boolean;
}
