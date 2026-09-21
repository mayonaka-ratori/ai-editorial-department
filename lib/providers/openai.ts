import OpenAI from "openai";
import { JudgementSchema, JUDGEMENT_JSON_SCHEMA, type Provider } from "./schema";

// ソル（月刊アストラ）。OpenAI公式SDK。
export function openaiProvider(): Provider {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna";
  return {
    async judge(input) {
      const res = await client.responses.create(
        {
          model,
          instructions: input.system,
          input: input.user,
          text: {
            format: {
              type: "json_schema",
              name: "judgement",
              schema: JUDGEMENT_JSON_SCHEMA as unknown as Record<string, unknown>,
              strict: true,
            },
          },
        },
        { timeout: input.timeoutMs },
      );
      return JudgementSchema.parse(JSON.parse(res.output_text));
    },
    async free(input) {
      const res = await client.responses.create(
        { model, instructions: input.system, input: input.user },
        { timeout: input.timeoutMs },
      );
      return res.output_text.trim();
    },
  };
}
