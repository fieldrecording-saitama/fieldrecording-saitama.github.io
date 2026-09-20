// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import remarkBreaks from "remark-breaks";

export default defineConfig({
  site: "https://fieldrecording-saitama.github.io",
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
