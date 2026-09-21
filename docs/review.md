# 全体確認で見つかった直しどころと、直し方の計画（第1版）

2026年9月21日。段階0から6まで作ったあとに、企画資料とコードを全部読み、モックの編集者でスマホ幅（390px）で入口から結果、表紙、自分の結果、書き直し、見本、有名作品、受付終了、管理、大画面、X用の画像まで通した記録です。
「再現済み」と書いたものは、実際に動かして確かめました。

直す順番は、上から順です。段階6.5として、段階7（3社のキーで試す）の前に入れます。

## 1. 当日に困るもの（先に直す）

| 何が起きるか | どこ | どう直すか |
|---|---|---|
| 会場のWi-Fiだと、ブース全体で1時間に7回しか送れない。端末とは別にIPアドレスごとにも7回の上限がある | lib/precheck.ts の ip: の hit | IPの上限を外す。残すなら1時間100回など、荒らし止めの大きさにする |
| 編集者側のエラーのあと、同じ文章を送り直せない。送る前に「送った文章」を記録し、同じ間はボタンを押せなくしている（再現済み） | components/SubmitFlow.tsx の sentKey の保存 | 記録するのは結果が返って成功したときだけにする |
| 混んでいるときの自動やり直しが「同じ原稿は2回送れません」で必ず失敗する。本文のハッシュをAIを呼ぶ前に覚えている（再現済み。58件同時で8件がbusy、やり直しは全部dup） | lib/precheck.ts の rememberHash、lib/judge.ts | ハッシュを覚えるのを判定が成功したあと（保存の直後）に移す。事前チェックでは「あるかどうか」だけ見る |

## 2. 直したほうがいいもの

| 何が起きるか | どこ | どう直すか |
|---|---|---|
| Xの投稿で、告知ツイートの引用と結果の画像カードは両立しない | components/ResultView.tsx の投稿文 | どちらを取るか決める（docs/concept.md 14の5）。画像を取るなら告知URLを外す |
| X用の画像の書体が本番（Vercel）で読めない可能性がある。process.cwd() からTTFを読んでいる | app/r/[id]/opengraph-image.tsx | next.config.ts の outputFileTracingIncludes で public/fonts/*.ttf を含める。公開後に結果URLをXに貼って確かめる |
| APP_URL が空だと投稿文のURLがドメインなしになる | components/ResultView.tsx、app/submit、app/r/[id] | サーバー側でAPP_URLが空ならリクエストのhostから組み立てる |
| 結果画面で「載ります」と「載っていません」が同時に出る。前の作品のほうが高いとき（再現済み）と、safe_for_cover が偽のとき | components/ResultView.tsx の sealnote と NOW | NOWの文を状況で変える。「あなたの前の作品のほうが点数が高いので、こちらは目次です」「作品名か引用に人前に出せない言葉があるので、表紙と目次には出しません」 |
| 禁止語で送信ごと断っている。企画は「判定は返して、表紙と目次に出さない」 | lib/precheck.ts の NG_WORDS | 決めを待つ（docs/concept.md 14の6）。変えるなら、禁止語は hidden にするだけにして判定は返す。差別語などの短い一覧だけ送信を断る |
| 見本の原稿が下書きに残り、自分の作品として送れてしまう | components/SubmitFlow.tsx の setText と下書きの保存 | 見本のときは下書きに保存しない。演出用の本文は別の変数に持つ |
| コメントが出ている途中、見えない「Xに投稿する」が押せる（再現済み） | app/globals.css の .fade | .fade に visibility:hidden と pointer-events:none を足し、.fade.in で戻す |
| 大画面の表紙が小さく、離れた場所から名前が読めない。3冊が下半分に並び、上半分が空いている | app/globals.css の .desk .scene、.shelf | 真ん中の1冊を高さいっぱい（画面の80%ほど）に出し、左右は小さく脇に置く。棚を画面の中央に上げる |
| 大画面の下に流れる「目次」が、表紙に載っていない人だけ。1人載っていても「まだ誰も載っていません」 | components/ScreenClient.tsx の tocLine | スマホと同じく、表紙の10枠と目次を合わせた全員を流す |
| 投稿文の「次号待ちにしてくれました」「名前だけにしてくれました」が変 | components/ResultView.tsx | 判定ごとに文を持つ。巻頭、特集、巻末は「〜にしてくれました」、名前だけは「目次に名前を載せてくれました」、次号待ちは「次号待ちになりました」 |

## 3. 小さいもの（直し方の計画）

まとめて半日ほどです。上から順に、動く状態で止めながら進めます。

| 何が起きるか | どう直すか | どこ | 大きさ |
|---|---|---|---|
| iPhoneでは傾きの視差が動かない。iOS13以降は許可が要る | 傾きは使わず、スマホでは視差を止める。理由: 許可のダイアログは体験の邪魔になり、視差は飾りなので。パソコンではマウスの位置で今まで通り動く | components/Space.tsx | 小 |
| 読んでいる間の単語が7秒で全部消え、そのあと空になる | 全部消えたら1秒置いて最初から光らせ直す。結果が来るまで繰り返す | components/SubmitFlow.tsx の lit の interval | 小 |
| 「時間がかかっています」「もう一度」が未実装。回線が切れると読んでいる画面のまま | 送ってから30秒で状態の文を「時間がかかっています」に変える。60秒で「もう一度」ボタンを出し、押すと同じ本文で送り直す（上の1で再送できるようにしてから） | components/SubmitFlow.tsx | 中 |
| 同点のとき、あとから来た作品が上に入る（再現済み） | 並べ替えを「点数が高い順、同点なら早く送った順」にする | lib/cover.ts の sort | 小 |
| 管理画面の上限回数に数字以外を入れると、入口が受付終了になる | 数字以外なら保存せず「数字を入れてください」と出す。サーバー側でも daily_cap を Number にできないときは3000に倒す | components/AdminClient.tsx、app/api/admin/route.ts | 小 |
| 管理画面の合言葉が Enter で送れない | 合言葉の欄とボタンを form にして、Enter で送る | components/AdminClient.tsx | 小 |
| 見本は1端末1日1回だが、画面には3つ並び、2つ目から怒られる | 見出しに「1回だけ試せます」と書く。1回使ったら3つとも押せなくして「見本は今日はもう使いました」と出す | components/SubmitFlow.tsx | 小 |
| 見本も3000回の上限を消費する | 見本のときは countDay を呼ばない | app/api/submit/route.ts | 小 |
| 有名作品のときの「次は」が2つ出て食い違う | famousReply から「次は〜」の文を取り、next_request 側に編集者ごとの一文を置く | lib/editors/*.ts の famousReply、lib/judge.ts | 小 |
| GEMINIの札が「GEMINI　GEMINI WEEKLY」と重なって見える | magazineEn を「ジェミニ」のような読みには使わず、札の2行目は「WEEKLY」だけにする。他の2誌は今のまま | components/MagazinePicker.tsx | 小 |
| GEMINIの送る画面で「← 別の雑誌にする」が水色で読みにくい | inline の color を外し、.onlight .back-btn の色に任せる | components/SubmitFlow.tsx | 小 |
| 飾りのウィンドウがペンネームの見出しや「二ナからの頼み」に重なる | 飾りのウィンドウを画面の上30%より下には置かない。frontの層は文字の後ろで薄く（opacity .5） | components/Space.tsx、app/globals.css | 小 |
| favicon がなく、全ページで404が出る | app/icon.svg を置く（入口の六角形と同じ形、水色） | app/icon.svg | 小 |
| next dev を動かすと CLAUDE.md に文が追記される | next.config.ts に agentRules: false を入れる | next.config.ts | 小 |
| public/fonts/shippori-800.ttf（8MB）が使われていない | 消す。表紙の題字は woff2 のほうを使っているので影響なし | public/fonts | 小 |
| 「COREにモデル名まで出す」（ペルソナの課題）が未対応 | 管理画面に「中身の表示: 会社名だけ / モデル名まで」の切り替えを置き、雑誌を選ぶ画面の札に出す。モデル名は環境変数の値 | components/AdminClient.tsx、lib/settings.ts、components/MagazinePicker.tsx | 中 |

## 4. 企画資料のずれ（直した）

2026年9月21日に、次を実装に合わせて直しました。

- docs/samples.md: 投稿文の例を今の形（AI編集部、#AI編集部、編集者の一文つき）にし、「読みました」の行を画面の通りにした。
- docs/wireframes.md: 受付終了の画面から古い雑誌名を消し、「自分の結果を見る」を足した。読んでいる間の切り替えを3秒ほどに。投稿文の形と、引用と画像カードが両立しない注意を足した。
- docs/tech.md（第6版）: 端末の目印はクッキーに決めた。表に title_alt、prev_score、issue_label、errors を足した。環境変数にモデル名と PGLITE_DIR を足した。フォルダに mine と api/r/[id] を足した。
- docs/plan.md: 段階0を素のCSSとSQL直書きとPGliteに。1時間5回を7回に。
- docs/concept.md（第10版）: 13にこの資料を足した。14にXの引用か画像か、禁止語の扱い、を足した。
- docs/design.md: 雑誌を選ぶ画面の説明を表紙を並べる形に。
- app/globals.css: コメントの古い雑誌名を直した。

## 5. 確かめられなかったこと

- 3社の本物の呼び出し。キーがないので通していない。SDKの呼び方（messages.parse と output_config、responses.create の json_schema、genai の responseSchema と abortSignal）は今入っているSDKの型と合っている。
- gemini-3.7-flash と gpt-5.6-luna のモデル名。.env.example で差し替えられるので、段階7で確かめる。
- Vercel での OG画像の書体（上の2）。
