import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { JudgementSchema, type Provider } from "./schema";

// 蔵人（季刊フェーブル）。Anthropic公式SDK。
export function anthropicProvider(): Provider {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";
  return {
    async judge(input) {
      const res = await client.messages.parse(
        {
          model,
          max_tokens: 2000,
          system: [{ type: "text", text: input.system, cache_control: { type: "ephemeral" } }],
          messages: [{ role: "user", content: input.user }],
          output_config: { format: zodOutputFormat(JudgementSchema), effort: "low" },
        },
        { timeout: input.timeoutMs },
      );
      if (res.stop_reason === "refusal") throw new Error("anthropic refusal");
      if (!res.parsed_output) throw new Error("anthropic: no parsed output");
      return res.parsed_output;
    },
    async free(input) {
      const res = await client.messages.create(
        {
          model,
          max_tokens: 800,
          system: input.system,
          messages: [{ role: "user", content: input.user }],
          output_config: { effort: "low" },
        },
        { timeout: input.timeoutMs },
      );
      const text = res.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
      return text.trim();
    },
  };
}
