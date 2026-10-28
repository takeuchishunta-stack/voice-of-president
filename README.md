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
