import type { EditorKey } from "../editors/types";
import type { Provider } from "./schema";
import { mockProvider } from "./mock";

// 編集者の名前から、どの会社を呼ぶかを決める。キーがなければモック。
export function providerFor(editor: EditorKey): { provider: Provider; isMock: boolean } {
  if (process.env.MOCK_EDITORS === "1") return { provider: mockProvider(editor), isMock: true };
  if (editor === "kurodo" && process.env.ANTHROPIC_API_KEY) {
    const { anthropicProvider } = require("./anthropic") as typeof import("./anthropic");
    return { provider: anthropicProvider(), isMock: false };
  }
  if (editor === "nina" && process.env.GEMINI_API_KEY) {
    const { googleProvider } = require("./google") as typeof import("./google");
    return { provider: googleProvider(), isMock: false };
  }
  if (editor === "sol" && process.env.OPENAI_API_KEY) {
    const { openaiProvider } = require("./openai") as typeof import("./openai");
    return { provider: openaiProvider(), isMock: false };
  }
  return { provider: mockProvider(editor), isMock: true };
}
