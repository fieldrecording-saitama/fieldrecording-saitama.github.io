// ビルド出力の内部リンクとアセット参照が解決するか確認する。
//
//   node scripts/check-links.mjs [出力ディレクトリ] [基準パス]
//
// 基準パス（Astro の base）を渡すと、その接頭辞を取り除いてから
// ファイルの実在を確認する。

import { readdirSync, existsSync, readFileSync, statSync } from "node:fs";
import { join, relative, posix } from "node:path";

const distDir = process.argv[2] ?? "dist";
const basePath = process.argv[3] ?? "/";

function htmlFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...htmlFiles(full));
    else if (entry.name.endsWith(".html")) found.push(full);
  }
  return found;
}

const pages = htmlFiles(distDir);
const prefix = basePath.endsWith("/") ? basePath : `${basePath}/`;
const problems = [];

for (const page of pages) {
  const html = readFileSync(page, "utf8");
  const refs = [
    ...html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g),
  ].map((match) => match[1]);

  for (const ref of new Set(refs)) {
    if (basePath !== "/" && !ref.startsWith(prefix)) {
      problems.push(`${relative(distDir, page)}: 基準パスが付いていません -> ${ref}`);
      continue;
    }

    const withoutBase = basePath === "/" ? ref : ref.slice(prefix.length - 1);
    let target = join(distDir, withoutBase);
    if (ref.endsWith("/")) target = join(target, "index.html");

    if (!existsSync(target) || statSync(target).isDirectory()) {
      problems.push(`${relative(distDir, page)}: 参照先がありません -> ${ref}`);
    }
  }
}

console.log(`検査ページ数: ${pages.length} / 基準パス: ${basePath}`);

if (pages.length === 0) {
  console.error(`${distDir} にHTMLがありません。ビルドが失敗している可能性があります`);
  process.exit(1);
}

if (problems.length > 0) {
  console.error(`未解決の参照 ${problems.length} 件:`);
  for (const problem of problems.slice(0, 50)) console.error(`  ${problem}`);
  process.exit(1);
}

console.log("内部リンク・アセット参照: すべて解決");
