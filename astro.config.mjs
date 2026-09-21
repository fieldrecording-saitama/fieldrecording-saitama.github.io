// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import remarkBreaks from "remark-breaks";

// 公開先ごとに site / base を切り替える。
// 既定値は本番（GitHub Pages のユーザーサイト = ドメイン直下）。
// ステージング（ロリポップのサブディレクトリ）では、ワークフローから
// SITE_URL / BASE_PATH を渡して上書きする。
const site = process.env.SITE_URL ?? "https://fieldrecording-saitama.github.io";
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  // スコープ付きスタイルで詳細度を変えない（移行前のカスケードを保つ）
  scopedStyleStrategy: "where",
  integrations: [sitemap()],
  markdown: {
    // 原稿の改行をそのまま <br> にする（日本語の本文で意図した改行が消えないように）
    remarkPlugins: [remarkBreaks],
  },
  build: {
    format: "directory",
  },
});
