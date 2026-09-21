# AI編集部

AIが読む小説雑誌を作っている編集部に、来場者が自分の文章を送る体験アプリです。
企画は docs/concept.md、画面は docs/wireframes.md、技術は docs/tech.md、見た目は docs/design.md にあります。

## 手元で動かす

```
npm install
cp .env.example .env.local   # 中身を埋める。空のままでもモックで動く
npm run dev
```

- http://localhost:3000 が入口。
- http://localhost:3000/screen がブースの大画面。
- http://localhost:3000/admin が管理画面（合言葉は ADMIN_PASSWORD）。
- DATABASE_URL が空なら、data/pglite にPostgresの形で保存します（PGlite）。
- APIキーが空の編集者は、AIを呼ばずに例の結果を返します（モック）。

## 本番（Vercel）に置く

1. Vercelで新しいプロジェクトを作り、このリポジトリをつなぐ。
2. Vercelの Storage から Neon（Postgres）を作ると、DATABASE_URL が自動で入る。
   別に作ったNeonを使うなら、接続先を DATABASE_URL に入れる。
3. 環境変数を入れる（.env.example の一覧）。
   - ANTHROPIC_API_KEY、GEMINI_API_KEY、OPENAI_API_KEY
   - ADMIN_PASSWORD（管理画面の合言葉）
   - APP_URL（公開先のURL。例 https://xxxx.vercel.app）
4. デプロイする。表は最初のアクセスで自動で作られる。
5. /admin を開いて、告知ツイートのURL、号、受付中、を確かめる。

## 当日の朝

1. /admin で「受付中」にする。上限回数を確かめる。
2. 告知ツイートを投稿し、そのURLを /admin に入れる。
3. ブースのMacBookで /screen を全画面で開く。
4. 自分のスマホで1回、入口から結果まで通す。

## 当日の終わり

1. /admin で「表紙を固める（発行）」を押す。受付が終了し、3人の編集後記ができる。
2. 編集後記を読んで、直したければその場で直す。
3. /cover と /screen で発行後の表紙を確かめる。

## 試験用の道具

- `MOCK_EDITORS=1` で、キーがあってもAIを呼ばない。
- `npm run judge-all` は、テスト用の原稿の束を3人に見せて結果を並べる（段階7で使う）。
