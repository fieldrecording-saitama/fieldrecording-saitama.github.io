# Field Recording Club Saitama Sound Map

フィールドレコーディングクラブさいたまの公式Webページです。

## 現状のサイト概要

フィールドレコーディングクラブさいたまの活動紹介と、さいたまの音地図を中心にした静的サイトです。Astroで構築し、GitHub Actions経由でGitHub Pagesに公開しています。2026年9月5日・6日に開催した録音ワークショップの記録と、今後のワークショップ・成果展示を案内しています。

現在は以下の役割を持っています。

- 団体のコンセプト紹介
- World Listening Day関連企画として、2026年7月18日・19日に開催したイベントの記録
- 2026年9月5日・6日に開催したフィールドレコーディングワークショップの記録
- 第2回録音ワークショップと冬頃開催予定の成果展示
- Instagram、FacebookグループへのSNS導線
- 今年度の活動予定の紹介
- SoundCloud音源と連動した音地図アーカイブ

## ページ構成

2026年9月にAstroへ移行し、1ページ構成から以下の複数ページ構成に変更しました。

| URL | 内容 |
| --- | --- |
| `/` | ヒーロー、今年度事業の流れ、音地図への導線、聴くための記録の抜粋、年間スケジュール、クラブ紹介、参加導線 |
| `/about/` | フィールドレコーディングクラブさいたまの紹介と今年度事業 |
| `/events/` | 年間スケジュール一覧 |
| `/events/<slug>/` | イベント個別ページ（Markdownで管理） |
| `/sound-map/` | MapLibre GL JSによる音地図 |
| `/notes/` `/notes/<slug>/` | 聴くための短い記録 |
| `/join/` | 参加方法、よくある質問、SNS導線 |

1ページ構成だった頃のアンカー（`/#workshop`、`/#event`、`/#program`、`/#join` など）は、トップページのスクリプトで対応するページへ転送します。

### 共通要素

- ヘッダー：FRCSロゴと主要ナビゲーション（About / Events / Sound Map / Notes / Join）
- フッター：Field Recording Club Saitama / Soundscape Archive
- OGP・構造化データ：ページごとに `Seo.astro` と `JsonLd.astro` が生成

## 実装内容

- 2026年7月18日・19日開催イベントのアーカイブ
- 2026年9月5日・6日開催ワークショップのアーカイブ
- MapLibre GL JSによる音地図
- GeoJSONで管理する録音地点データ
- SoundCloud埋め込みプレイヤー
- Markdownで管理するイベント・記録コンテンツ
- frontmatterから生成する構造化データ（schema.org Event）とサイトマップ

## 今後充実させたい項目

Webディレクター視点では、今後は「信頼」「参加動機」「継続的なアーカイブ性」を強化するとサイトの価値が上がります。

### 1. 活動実績・過去の記録

参加者写真、録音風景、展示の様子、過去イベントのレポートを掲載する。

初訪問者に対して、団体が実際に活動していることが伝わり、イベント申込みやSNSフォローにつながりやすくなります。

### 2. 音源アーカイブ・音地図の本公開

現在は音地図の仕組みが用意されているため、正式音源を追加するとサイトの独自価値が大きく高まります。

各録音地点には以下の情報を持たせると、アーカイブとして見応えが出ます。

- 録音地点
- 録音日時
- 録音者
- 使用機材
- 写真
- 短い聴取メモ
- タグ
- 音源

### 3. 参加者向けFAQ

初参加者の不安を減らすため、申込み前に確認したい情報をまとめる。

- 機材がなくても参加できるか
- 録音経験がなくても大丈夫か
- 子どもは参加できるか
- 雨天時はどうなるか
- どのくらい歩くか
- 当日の持ち物
- 録音した音源の扱い

### 4. 主催者・メンバー紹介

フィールドレコーディングは少し専門的に見えるため、人の顔が見える情報があると参加の心理的ハードルが下がります。

ナビゲーター紹介に加えて、メンバーの関心、活動歴、好きな音、録音エピソードなどを紹介すると、団体の雰囲気が伝わりやすくなります。

### 5. イベント詳細の充実

申込み開始前でも、サイト内でイベント内容を十分に理解できる状態にする。

- 当日のタイムテーブル
- 歩行ルート
- 集合場所マップ
- 持ち物
- 服装
- 注意事項
- 雨天時の対応
- 終了後の流れ

### 6. ニュース・お知らせ

サイトが継続的に更新されていることを伝えるため、トップページに小さな更新欄を追加する。

- ワークショップ募集開始
- 音源追加
- 展示準備
- イベントレポート公開
- メディア掲載
- SNS更新の告知

### 7. 成果展示の予告ページ

冬頃に開催予定の成果展示発表会に向けて、展示の構想や準備過程を見せる。

音源、地図、写真、映像、サウンド・インスタレーションを組み合わせる予定があるため、早い段階から展示の魅力を伝えると、継続的な関心につながります。

### 8. 参加後の導線

単発イベントで終わらせず、次回参加や継続的な関係につなげる。

- メール登録
- 次回案内希望フォーム
- ボランティア・運営協力の案内
- 録音音源の投稿フォーム
- 展示参加・作品提供の案内

## 次に優先したい改善

短期的には、以下の2つを優先すると効果が大きいです。

1. 活動レポートを1本追加する
2. 音地図を正式公開できる形に整える

イベント告知サイトとしてだけでなく、「さいたまの音風景アーカイブ」として育てると、団体の存在意義がより伝わるサイトになります。

## 技術構成

- [Astro](https://astro.build/) 7（静的出力）
- Content Collections（Markdown + zodスキーマ）
- MapLibre GL JS 6（npmパッケージ）
- SoundCloud Widget API
- npm / Node.js 22（`.node-version` で固定）

## 開発

```sh
npm ci          # 依存のインストール
npm run dev     # 開発サーバー（http://localhost:4321/）
npm run build   # dist/ へ静的書き出し
npm run preview # ビルド結果の確認
npm run check   # 型・テンプレートの検査
```

## ディレクトリ構成

```
public/            そのまま公開されるファイル（画像、data/*.geojson、robots.txt など）
src/
  components/      ヘッダー、ヒーロー、音地図、イベントカードなどのコンポーネント
  content/         Markdownコンテンツ
    events/        イベント（frontmatterが一覧・詳細・構造化データの元データ）
    notes/         聴くための記録
    pages/         About / Join の本文
  content.config.ts  コレクションのスキーマ定義
  layouts/         BaseLayout
  lib/site.ts      サイト共通の定数、旧アンカーの転送表
  pages/           ルーティング
  scripts/         hero-slides.js（トップ）、sound-map.js（音地図ページ）
  styles/          tokens / base / utilities / event の共通CSS
scripts/           SoundCloudプレイリスト取得スクリプト
```

コンポーネント固有のCSSは各 `.astro` の `<style>` に置いています。`astro.config.mjs` で `scopedStyleStrategy: "where"` を指定しているため、スコープ付きスタイルは詳細度を上げません。JavaScriptが生成する要素（`.hero-slide`、タグ一覧、SoundCloudのiframeなど）は `:global()` で指定しています。

## コンテンツの更新

イベントを追加・変更する場合は `src/content/events/` にMarkdownファイルを置きます。frontmatterの内容が、年間スケジュール・イベント詳細ページ・構造化データ（schema.org Event）のすべてに反映されます。

```yaml
---
title: イベント正式名称
shortTitle: 一覧で使う短い名前
startDate: 2027-02-01T14:00:00+09:00
dateLabel: 2027年2月1日（月）14:00〜
status: upcoming        # upcoming / open / closed / finished
summary: 一覧とOGPに出る説明文
place: 会場名
facts:                  # 詳細ページの「日時・集合・定員」などの一覧
  - term: 日時
    detail: 2027年2月1日（月）14:00〜
---

本文をMarkdownで書きます。
```

本文中の改行はそのまま改行として表示されます。

## デプロイ

公開先は2系統あり、ブランチごとに別のワークフローが動きます。どちらも `npm ci` → `astro check` → `astro build` を実行します。

| ブランチ | 公開先 | ワークフロー |
| --- | --- | --- |
| `main` | GitHub Pages（本番） | `.github/workflows/deploy-production.yml` |
| `staging` | ロリポップ（SSH + rsync） | `.github/workflows/deploy-staging.yml` |

本番は `main` への push で公開します。プルリクエストではビルド確認のみ行い、公開はしません。GitHub Pages の公開元は「GitHub Actions」です。

### 公開URLの階層（site / base）

ステージングは本番とディレクトリ階層が異なるため、`astro.config.mjs` の `site` / `base` を環境変数で切り替えます。

```sh
SITE_URL=https://example.com BASE_PATH=/staging/ npm run build
```

未指定の場合は本番の値（`https://fieldrecording-saitama.github.io` と `/`）を使います。サイト内のリンク・画像・`fetch` は `src/lib/url.ts` の `withBase()` を通しているため、`base` を変えるだけでサブディレクトリ公開に追随します。

### ステージングに必要な Secrets

| 名前 | 内容 |
| --- | --- |
| `LOLIPOP_SSH_HOST` | 接続先ホスト（例: `ssh.lolipop.jp`） |
| `LOLIPOP_SSH_USER` | SSHユーザー名 |
| `LOLIPOP_SSH_KEY` | SSH秘密鍵（OpenSSH形式・全文） |
| `LOLIPOP_DEPLOY_PATH` | 配置先の絶対パス（例: `/home/users/0/xxx/web/staging`） |
| `STAGING_SITE_URL` | ステージングのオリジン（例: `https://example.com`） |
| `STAGING_BASE_PATH` | 公開ディレクトリ（例: `/staging/`。ドメイン直下なら `/`） |
| `LOLIPOP_SSH_PORT` | 任意。未設定なら `2222` |
| `LOLIPOP_KNOWN_HOSTS` | 任意。未設定時は `ssh-keyscan` で取得 |

BASIC認証はロリポップの管理画面で設定する前提のため、ワークフロー側では設定しません。`rsync --delete` は `.htaccess` / `.htpasswd` / `.user.ini` / `.well-known/` を除外しているので、管理画面で作られた認証用ファイルは削除されません。

## SoundCloudプレイリストデータの生成

SoundCloudプレイリストからトラック一覧のJSONとCSVを生成します。Python標準ライブラリのみで動きます。

```sh
python3 scripts/scrape_soundcloud_playlist.py
```

デフォルトでは以下を生成します。

- `public/data/soundcloud-playlist.json`
- `public/data/soundcloud-playlist.csv`

対象URLや出力先を変える場合:

```sh
python3 scripts/scrape_soundcloud_playlist.py \
  --url "https://soundcloud.com/livingroom-tapes/sets/field-recording-club-saitama" \
  --json public/data/soundcloud-playlist.json \
  --csv public/data/soundcloud-playlist.csv
```
