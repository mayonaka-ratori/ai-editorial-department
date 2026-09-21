import { GoogleGenAI } from "@google/genai";
import { JudgementSchema, JUDGEMENT_JSON_SCHEMA, type Provider } from "./schema";

// 二ナ（GEMINI）。Google公式SDK。
export function googleProvider(): Provider {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.7-flash";
  return {
    async judge(input) {
      const res = await ai.models.generateContent({
        model,
        contents: input.user,
        config: {
          systemInstruction: input.system,
          responseMimeType: "application/json",
          responseSchema: stripForGoogle(JUDGEMENT_JSON_SCHEMA),
          abortSignal: AbortSignal.timeout(input.timeoutMs),
        },
      });
      const text = res.text ?? "";
      return JudgementSchema.parse(JSON.parse(text));
    },
    async free(input) {
      const res = await ai.models.generateContent({
        model,
        contents: input.user,
        config: { systemInstruction: input.system, abortSignal: AbortSignal.timeout(input.timeoutMs) },
      });
      return (res.text ?? "").trim();
    },
  };
}

// Googleの responseSchema は additionalProperties を受け付けないので外す。
function stripForGoogle(schema: unknown): Record<string, unknown> {
  const s = JSON.parse(JSON.stringify(schema)) as Record<string, unknown>;
  delete s.additionalProperties;
  return s;
}
