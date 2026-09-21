import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: "AI編集部",
  description: "AIが読む小説雑誌を作っている編集部に、あなたの文章を送ってみてください。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070b16",
};

// 書体はアプリに同梱している（public/fonts/fonts.css と public/fonts/g/）。会場の回線が細くても、外の読み込みを待たない。
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
