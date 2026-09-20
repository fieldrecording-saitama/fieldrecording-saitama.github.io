// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://fieldrecording-saitama.github.io",
  trailingSlash: "always",
  // スコープ付きスタイルで詳細度を変えない（移行前のカスケードを保つ）
  scopedStyleStrategy: "where",
  integrations: [sitemap()],
  build: {
    format: "directory",
  },
});
