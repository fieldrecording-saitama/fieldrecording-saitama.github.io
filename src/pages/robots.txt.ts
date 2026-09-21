import type { APIRoute } from "astro";
import { NOINDEX, absoluteUrl } from "../lib/url";

/**
 * robots.txt は公開先ごとに内容を変える。
 * ステージング（NOINDEX ビルド）はクロールを禁止し、サイトマップも案内しない。
 */
export const GET: APIRoute = () => {
  const body = NOINDEX
    ? ["User-agent: *", "Disallow: /", ""].join("\n")
    : ["User-agent: *", "Allow: /", "", `Sitemap: ${absoluteUrl("/sitemap-index.xml")}`, ""].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
