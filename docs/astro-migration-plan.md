# Astro 移行・複数ページ化 実装プラン

作成日: 2026-09-21 / 作業ブランチ: `astro-migration`（`master` から分岐）

## 1. 背景と目的

現在のサイトは `index.html` 1枚（529行）の静的ランディングページで、リポジトリ全体をそのまま GitHub Pages に公開している。イベント記録や音源アーカイブの追加に伴いコンテンツが増え、1ページが縦に伸びすぎて回遊性・更新性の両面で限界に来ている。

本プランでは以下を実現する。

- コンテンツを複数ページに分割し、情報の構造を明確にする
- コンテンツの大半を Markdown で記述し、非エンジニアでも更新できる状態にする
- 繰り返し要素・共通要素をコンポーネント化する
- Astro + npm でビルドし、GitHub Actions で GitHub Pages に公開する

## 2. 現状

| 項目 | 現状 |
|---|---|
| リポジトリ | `fieldrecording-saitama/fieldrecording-saitama.github.io`（ユーザーサイト、ルート公開・base 不要） |
| 既定ブランチ | `master` |
| HTML | `index.html` 529行（1ページ完結） |
| CSS | `assets/css/style.css` 1382行（単一ファイル） |
| JS | `assets/js/main.js` 476行（ヒーロースライダー ＋ 音地図 ＋ SoundCloud ウィジェット） |
| 地図 | MapLibre GL JS を `assets/vendor/maplibre/` にベンダリング |
| データ | `data/sounds.geojson`, `data/hero-slides.json`, `data/soundcloud-playlist.{json,csv}` をランタイム `fetch` |
| デプロイ | `.github/workflows/static.yml` がリポジトリ全体（`path: '.'`）をアップロード。直近 run は success |
| アクション版 | `actions/configure-pages@v5` / `actions/upload-pages-artifact@v3` / `actions/deploy-pages@v5` |

### 作業前に片付けるもの

- `.astro/` `src/layouts/` `dist/` `output/` `tmp/` が**空ディレクトリとして残存**（過去の Astro 着手の残骸、未トラック）
- `node_modules/` に astro が入っているが `package.json` が無い → 作り直し
- `.gitignore` が存在しない

### 過去の着手ブランチ

| ブランチ | 内容 | 扱い |
|---|---|---|
| `astronization` | 2026-06-21 分岐。`astro.config.mjs` / `package.json` / `src/pages/index.astro` ＋ `src/content/*.md`（1ページのまま Markdown 化）| 設定ファイルのみ参考にする。コンテンツは7月・9月更新前で古いため再利用しない |
| `codex/astro` | ワークフローの Astro ビルド対応の試行 | 参考のみ |

いずれも本移行の完了後にクローズする。

## 3. 技術構成

| 項目 | 選択 | 理由 |
|---|---|---|
| フレームワーク | Astro（`output: 'static'`、UI フレームワーク無し） | 静的出力が GitHub Pages と相性が良く、Markdown とコンポーネントを同居できる |
| パッケージ管理 | npm（`package-lock.json` をコミット、CI は `npm ci`） | 再現性のあるビルド |
| コンテンツ | Markdown ＋ Content Collections（zod スキーマ） | frontmatter を型検証し、一覧・詳細・構造化データで同じデータを使い回す |
| 地図 | `maplibre-gl` を npm 依存化し `assets/vendor/` を削除 | Vite がバンドル・ハッシュ付与するため手動キャッシュバスターが不要になる |
| SoundCloud | Widget API は従来どおり外部 script（`/sound-map/` のみ読み込み） | 外部 API のため npm 化不可 |
| sitemap | `@astrojs/sitemap` で自動生成 | ページ数が増えるため手書き管理をやめる |
| Node | 22 に固定（`engines` ＋ `.node-version` ＋ CI の `setup-node`） | ローカルと CI の一致 |

## 4. ディレクトリ構成

```
package.json / astro.config.mjs / tsconfig.json / .gitignore / .node-version
public/                      ← ビルド時にそのままコピー（URL は現状維持）
  assets/img/…               既存画像
  data/*.geojson, *.json     ランタイム fetch するため public 側
  robots.txt
  googlef11cfc20b6fd060e.html
src/
  layouts/
    BaseLayout.astro
  components/
    SiteHeader.astro / SiteFooter.astro
    Seo.astro / JsonLd.astro
    Hero.astro / SectionHeading.astro / Button.astro / Prose.astro
    EventCard.astro / EventTimeline.astro
    SoundMap.astro / NoteCard.astro
  content/
    config.ts                 ← collection スキーマ定義
    events/
      2026-07-sound-walk.md
      2026-09-workshop-001.md
      2026-12-workshop-002.md
      2027-02-exhibition.md
    notes/*.md                ← 聴くための記録・活動レポート
    pages/about.md, join.md   ← 固定ページ本文
  pages/
    index.astro
    about.astro
    events/index.astro
    events/[...slug].astro
    sound-map.astro
    notes/index.astro
    notes/[...slug].astro
    join.astro
    404.astro
  scripts/
    hero-slides.js
    sound-map.js
  styles/
    tokens.css / base.css / utilities.css
```

## 5. ページ構成（7ページ）

| URL | 内容 | 現 index.html の対応箇所 |
|---|---|---|
| `/` | Hero、About 抜粋、直近イベント、音地図への導線、Join | Hero ＋ 各セクション抜粋 |
| `/about/` | 活動紹介、方針、メンバー・ナビゲーター紹介 | `#about` |
| `/events/` | 年間スケジュール一覧 | `#program` |
| `/events/<slug>/` | イベント個別詳細 | `#workshop`, `#event` |
| `/sound-map/` | 音地図（MapLibre ＋ SoundCloud） | `#sound-map` |
| `/notes/` | 聴くための記録・活動レポート一覧 | Listening Notes |
| `/notes/<slug>/` | 記事個別 | 新規（今後の追加分の受け皿） |
| `/join/` | 参加導線、FAQ、SNS | `#join` |

### 旧アンカーの互換維持

`/#workshop` `/#event` `/#program` `/#join` `/#about` `/#sound-map` は SNS・外部サイトから参照されている可能性があるため、トップページに「旧ハッシュ → 新 URL」のリダイレクトスクリプトを置く。

## 6. コンポーネント化の方針

### Seo.astro / JsonLd.astro

現在 `<head>` に手書きされている OGP・Twitter Card・JSON-LD（`WebSite` / `Organization` / `Event` × 2）を、ページごとの props と events collection の frontmatter から自動生成する。**イベント情報の二重管理がなくなることが本移行の最大の効果**。

### events collection の frontmatter

```yaml
title:        # イベント名
startDate:    # 開始日時
endDate:      # 終了日時
status:       # upcoming | open | closed | finished
place:        # 会場名
address:      # 住所（JSON-LD の PostalAddress 用）
capacity:     # 定員
fee:          # 参加費
navigator:    # ナビゲーター・講師
image:        # メイン画像
ticketUrl:    # Peatix などの申込先
```

一覧・詳細・トップの「直近イベント」・JSON-LD のすべてがこの1ソースを参照する。

### JavaScript の分離

`main.js` を用途別に分割し、必要なページでのみ読み込む。

- `hero-slides.js` … トップページのみ
- `sound-map.js` … `/sound-map/` のみ（MapLibre と SoundCloud Widget API を含む重い処理を隔離）

`hero-slides.json` はビルド時 import に切り替え、ランタイム fetch を 1 往復削減できる。

## 7. CSS 分割の方針

`style.css` 1382行を次のとおり分解する。

| 行き先 | 内容 |
|---|---|
| `src/styles/tokens.css` | CSS 変数（カラー・タイポ・余白スケール） |
| `src/styles/base.css` | reset、`body`、見出し・本文の基本タイポグラフィ |
| `src/styles/utilities.css` | `.button` `.section` `.prose` `.text-keep` など横断ユーティリティ |
| 各 `.astro` の `<style>` | `.hero-*` → Hero.astro、`.sound-*` `.panel-*` → SoundMap.astro、`.timeline` → EventTimeline.astro、`.site-header` `.site-nav` → SiteHeader.astro |

### 注意点（重要）

Astro の scoped style は**ビルド時に存在する要素にしか適用されない**。`main.js` が `innerHTML` で動的生成している以下の箇所は、scoped 化するとスタイルが外れる。

- サウンドパネルのタグリスト（`.tag-list` 配下）
- ヒーロースライドの `div` 群
- SoundCloud プレイヤーの iframe 差し替え周辺

対応は次のいずれか。

1. 該当セレクタを `<style is:global>` に置く
2. 生成側を Astro テンプレートに移し、JS は表示切り替えのみ行う

**フェーズ2で動的生成箇所を先に洗い出してから CSS 分割に着手する。**

また、Markdown 本文に当たるスタイルは scoped が効かないため、`Prose.astro` を `is:global` のラッパーとして用意する。

## 8. GitHub Actions

`static.yml` を削除し `deploy.yml` を新設。build と deploy をジョブ分割し、PR ではビルドのみ実行してデプロイ前に破損を検出する。アクションのバージョンは現在 success している組み合わせを踏襲する。

```yaml
name: Deploy site to Pages

on:
  push:
    branches: ["master"]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    if: github.ref == 'refs/heads/master' && github.event_name != 'pull_request'
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

GitHub Pages の Source は既に「GitHub Actions」のため、リポジトリ設定の変更は不要。

## 9. 作業フェーズ

| # | 内容 | 完了条件 |
|---|---|---|
| 0 | `.gitignore` 追加、残骸ディレクトリ整理、Astro 最小構成、Node 22 固定 | `npm run build` が通る |
| 1 | BaseLayout に現 `index.html` を丸ごと移植（CSS/JS は global のまま） | **見た目が現行と完全一致**。ここを回帰の基準点としてコミット |
| 2 | 動的生成 DOM の棚卸し → コンポーネント分割 ＋ CSS の scoped 移設 | 各コンポーネント単位で見た目差分なし |
| 3 | `maplibre-gl` の npm 化、`main.js` を hero / sound-map に分離 | 音地図の再生・連続再生・前後移動が動作 |
| 4 | Content Collections 定義 ＋ 本文の Markdown 化 | スキーマ検証が通る |
| 5 | 7ページへ分割、ナビ・内部リンク・画像パス絶対化、旧ハッシュ互換 | 全リンクの到達確認 |
| 6 | Seo / JsonLd コンポーネント、`@astrojs/sitemap`、ページ別 OGP | 構造化データテストで検証 |
| 7 | `deploy.yml` 投入 → PR でビルド成功を確認 → `static.yml` 削除 | 本番 URL で動作確認 |
| 8 | README 更新 | — |

フェーズ2〜3が全体の作業量の半分以上を占める。フェーズ1でコミットしておけば、以降どこで崩れても戻せる。

## 10. リスクと注意点

| リスク | 対応 |
|---|---|
| 画像パスが相対（`assets/img/…`）のため下層ページで壊れる | すべて絶対パス（`/assets/…`）へ一括置換。フェーズ5の必須作業 |
| `data/sounds.geojson` の fetch パス | `/data/sounds.geojson` へ変更 |
| Google Search Console 検証ファイル | `googlef11cfc20b6fd060e.html` を `public/` に残す。削除すると検証が切れる |
| 手書き `sitemap.xml` と自動生成の重複 | 手書きを削除し `@astrojs/sitemap` に一本化 |
| Peatix・SNS からの流入先 URL | 旧ハッシュのリダイレクト対応で吸収 |
| 動的生成 DOM の scoped style 外れ | フェーズ2で先に棚卸し（第7章参照） |
| ワークショップ #002 告知と作業の競合 | 移行作業は `astro-migration` ブランチに隔離し、緊急更新は `master` から別ブランチで行う |
