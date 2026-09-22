import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next dev が CLAUDE.md に文を追記するのを止める。
  agentRules: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  // X用の画像は public/fonts の日本語フォントを読む。
  // Vercelの関数には public/ が入らないことがあるので、明示的に同梱する。
  outputFileTracingIncludes: {
    "/r/[id]/opengraph-image": ["./public/fonts/**"],
  },
};

export default nextConfig;
