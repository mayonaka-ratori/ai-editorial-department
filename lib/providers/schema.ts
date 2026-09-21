import { z } from "zod";
import { PLACEMENTS, REASON_TAGS, WORK_TYPES, type Placement } from "../editors/types";

// 3社に共通で「この形で返して」と渡す形。
export const JudgementSchema = z.object({
  work_type: z.enum(WORK_TYPES),
  placement: z.enum(PLACEMENTS as [Placement, ...Placement[]]),
  score: z.number().int().min(0).max(100),
  title: z.string(),
  title_alt: z.string(),
  quote: z.string(),
  comment: z.string(),
  next_request: z.string(),
  reason_tags: z.array(z.string()),
  safe_for_cover: z.boolean(),
});

export type RawJudgement = z.infer<typeof JudgementSchema>;

// JSON Schema（OpenAIとGoogle用）。zodの形と同じ内容。
export const JUDGEMENT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    work_type: { type: "string", enum: [...WORK_TYPES] },
    placement: { type: "string", enum: [...PLACEMENTS] },
    score: { type: "integer", minimum: 0, maximum: 100 },
    title: { type: "string" },
    title_alt: { type: "string" },
    quote: { type: "string" },
    comment: { type: "string" },
    next_request: { type: "string" },
    reason_tags: { type: "array", items: { type: "string", enum: [...REASON_TAGS] } },
    safe_for_cover: { type: "boolean" },
  },
  required: ["work_type", "placement", "score", "title", "title_alt", "quote", "comment", "next_request", "reason_tags", "safe_for_cover"],
} as const;

export interface ProviderInput {
  system: string; // 固定の指示文（共通 + 編集者）
  user: string; // 毎回の入力（原稿、ペンネーム、癖、厳しさ、割合、前回）
  timeoutMs: number;
}

export interface Provider {
  judge(input: ProviderInput): Promise<RawJudgement>;
  free?(input: { system: string; user: string; timeoutMs: number }): Promise<string>; // 編集後記など、自由な文章
}
