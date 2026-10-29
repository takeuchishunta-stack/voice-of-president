# VOICE OF PRESIDENT

経営者インタビューメディア（静的サイト・Vercel）。記事データは `articles-data.js`。

## 記事ページの書き出し（2026-10 Furutori 追加）

記事データの正は今までどおり `articles-data.js`。公開のたびに Vercel が `node scripts/build.mjs` を走らせて、次を作る（vercel.json）。

- `/interview/{記事id}/` … 記事ごとのページ（スマホ対応・検索用の情報・OGP・関連記事・シェア・姉妹メディアへの導線）
- `/archive.html`（連載一覧）・`/search.html`（記事を探す）・`/sitemap.xml`・`/robots.txt`
- 旧 URL `article.html?id=xx` は `/interview/xx/` へ恒久転送（301）

手元で確かめる時は `node scripts/build.mjs` のあと `python3 -m http.server` などで開く。
設定は `scripts/site.config.json`（独自ドメインに移ったら siteUrl を変える。PR 枠は pr.enabled と href）。
姉妹メディアの記事一覧は `scripts/network.json`（同じ方の別メディアの記事を出すのに使う）。
`interview/`・`archive.html`・`search.html`・`sitemap.xml`・`robots.txt` はビルドで作り直されるので、直接は編集しない。

## アクセス解析（GA4）

- タグは本番（Vercel の production）だけで出る。手元で確かめる時は `GA4_FORCE=1 GA4_ID=G-xxxx node scripts/build.mjs`（終わったら ID 無しでもう一度 build して index.html を戻す）。
- 測定ID は `scripts/site.config.json` の `analytics.ga4MeasurementId`（または Vercel の環境変数 `GA4_ID`）。空ならタグは出ない。
- 4サイトで1つの GA4 に送り、`media_id`（このサイトは `vop`）で見分ける。
- 記事ページのイベント（`assets/article.js`）：`article_end_view`（本文の末尾が見えた＋表で開いていた時間の合計30秒・1回）／`related_article_click`／`sister_media_click`／`pr_impression`（PR 枠の50%が1秒・1回）／`pr_click`／`share_click`。共通の値は `media_id`・`article_id`・`placement`・`destination_media`・`banner_id`。
- GA4 の管理画面で、上の値をカスタム ディメンション（イベント スコープ）に登録すると、レポートで見られる。

## 見出し画像と強調引用（2026-10 試作）

- 言葉は `scripts/og-quotes.json`（本文にある言葉そのまま。無ければ build が止まる）。画像は `node scripts/make-og.mjs` で `images/og/` に作る（playwright が要る）。
- 本人の了承を取ったら `approved` に日付を書く。了承の無い記事は、Vercel のプレビューと手元でだけ出て、本番の build では画像ごと消える。
