/**
 * 公開先のサブディレクトリ（Astro の `base`）を考慮してURLを組み立てる。
 *
 * 本番（ドメイン直下）では `base` が "/" なので素通しになり、
 * ステージング（例: /staging/）では先頭に基準パスが付く。
 */

/** Astro が正規化した基準パス。末尾は必ず "/"（base 未設定なら "/"） */
const BASE_URL = import.meta.env.BASE_URL;

/** 設定済みの site。JSON-LD や canonical の絶対URL生成に使う */
export const SITE_URL = import.meta.env.SITE ?? "https://fieldrecording-saitama.github.io";

/**
 * 検索エンジンに載せたくないビルドで true。
 * ステージングのワークフローが NOINDEX=true を渡す。
 */
export const NOINDEX = String(import.meta.env.NOINDEX) === "true";

/** 外部URL・ハッシュ・スキーム付きはそのまま返す */
function isExternal(path: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//") || path.startsWith("#");
}

/**
 * サイト内の絶対パス（"/about/" など）に基準パスを付ける。
 *
 * @example
 * withBase("/about/")  // base="/"         -> "/about/"
 * withBase("/about/")  // base="/staging/" -> "/staging/about/"
 */
export function withBase(path: string): string {
  if (isExternal(path)) {
    return path;
  }

  const prefix = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const suffix = path.startsWith("/") ? path : `/${path}`;

  return `${prefix}${suffix}`;
}

/**
 * サイト内パスから公開URL（絶対URL）を組み立てる。
 * `site` に `base` を含めない運用でも正しい階層になるよう withBase を通す。
 */
export function absoluteUrl(path: string): string {
  if (isExternal(path)) {
    return path;
  }

  return new URL(withBase(path), SITE_URL).href;
}
