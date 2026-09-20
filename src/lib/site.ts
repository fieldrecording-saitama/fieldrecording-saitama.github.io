export const SITE = {
  url: "https://fieldrecording-saitama.github.io",
  name: "フィールドレコーディングクラブさいたま",
  alternateName: "Field Recording Club Saitama",
  tagline: "さいたまの音風景",
  description:
    "さいたまの音風景を記録し、共有するフィールドレコーディングクラブさいたま。音地図や今後のワークショップ、成果展示の情報を紹介します。",
  shortDescription: "さいたまの音風景を記録し、共有する市民クラブ。音地図や今後の活動情報を紹介します。",
  ogImage: "/assets/img/ogp-fieldrecording-saitama.jpg",
  themeColor: "#24483e",
  social: {
    instagram: "https://www.instagram.com/fieldrecording_saitama",
    facebook: "https://www.facebook.com/groups/800702228957228/",
  },
} as const;

export const NAV = [
  { href: "/about/", label: "About" },
  { href: "/events/", label: "Events" },
  { href: "/sound-map/", label: "Sound Map" },
  { href: "/notes/", label: "Notes" },
  { href: "/join/", label: "Join" },
] as const;

/** 旧1ページ構成のアンカーから、分割後のページへの対応表 */
export const LEGACY_HASH_REDIRECTS: Record<string, string> = {
  "#about": "/about/",
  "#workshop": "/events/workshop-001-encounters/",
  "#event": "/events/sound-communication-walk-2026/",
  "#project": "/events/",
  "#program": "/events/",
  "#sound-map": "/sound-map/",
  "#join": "/join/",
};

/** status から schema.org の eventStatus を導く */
export function schemaEventStatus(status: string): string {
  switch (status) {
    case "finished":
      return "https://schema.org/EventCompleted";
    case "closed":
    case "open":
    case "upcoming":
    default:
      return "https://schema.org/EventScheduled";
  }
}

/** 申込みバッジに出す文言 */
export function statusLabel(status: string, override?: string): string {
  if (override) return override;
  switch (status) {
    case "finished":
      return "開催終了";
    case "closed":
      return "受付終了";
    case "open":
      return "申込受付中";
    default:
      return "日程調整中";
  }
}
