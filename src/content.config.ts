import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/** 住所（JSON-LD の PostalAddress に対応） */
const address = z.object({
  street: z.string(),
  locality: z.string(),
  region: z.string(),
  country: z.string().default("JP"),
});

/** イベントの出演者・ナビゲーター */
const performer = z.object({
  type: z.enum(["Person", "Organization"]).default("Person"),
  name: z.string(),
  description: z.string().optional(),
});

const events = defineCollection({
  loader: glob({ base: "./src/content/events", pattern: "**/*.md" }),
  schema: z.object({
    /** 正式名称。JSON-LD の name とページ見出しに使う */
    title: z.string(),
    /** 一覧やカードで使う短い表記 */
    shortTitle: z.string().optional(),
    /** セクション上部の小見出し */
    kicker: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    /** 「2026年9月5日（土）・6日（日）16:00〜20:00」のような表示用の日付 */
    dateLabel: z.string(),
    status: z.enum(["upcoming", "open", "closed", "finished"]),
    /** 申込ボタン・バッジの文言 */
    statusLabel: z.string().optional(),
    /** 一覧・OGP・JSON-LD の説明文 */
    summary: z.string(),
    /** 詳細ページ冒頭のリード文 */
    lead: z.string().optional(),
    place: z.string().optional(),
    address: address.optional(),
    capacity: z.number().optional(),
    capacityNote: z.string().optional(),
    fee: z.string().optional(),
    language: z.string().optional(),
    bring: z.string().optional(),
    /** 事実一覧（dl）に並べる項目 */
    facts: z.array(z.object({ term: z.string(), detail: z.string() })).default([]),
    /** 年間スケジュールに出す補足行 */
    timelineDetails: z.array(z.string()).default([]),
    performers: z.array(performer).default([]),
    image: z.string().optional(),
    ticketUrl: z.url().optional(),
    /** ポスター風の見出しブロック */
    poster: z
      .object({
        mainTitle: z.array(z.string()),
        japanese: z.string().optional(),
        artist: z.string().optional(),
        credit: z.string().optional(),
      })
      .optional(),
    /** トップページに出すかどうか */
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const notes = defineCollection({
  loader: glob({ base: "./src/content/notes", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** 一覧とトップページの抜粋に使う一文 */
    excerpt: z.string(),
    place: z.string().optional(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ base: "./src/content/pages", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    kicker: z.string().optional(),
    description: z.string(),
  }),
});

export const collections = { events, notes, pages };
