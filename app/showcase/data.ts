// ─── TYPES ───────────────────────────────────────────────────────────────────
export type CategoryKey = "ea" | "promotion" | "seminar" | "concept";
export type FilterKey = "all" | CategoryKey;

export type ShowcaseItem = {
  id: number;
  file: string; // path under /public/showcase/<file>
  driveId?: string; // Google Drive file id, used as fallback thumbnail source
  title: string;
  subtitle: string;
  category: CategoryKey;
};

// Builds a Drive-hosted thumbnail URL for a given file id.
// Note: this only renders for site visitors if the file's Drive sharing is
// set to "Anyone with the link can view" — otherwise it silently fails and
// the gradient placeholder is shown instead.
export function driveThumb(id: string) {
  return `https://lh3.googleusercontent.com/d/${id}=w800`;
}

// ─── CATEGORY CONFIG ─────────────────────────────────────────────────────────
export const CATEGORY_KEYS: CategoryKey[] = ["ea", "promotion", "seminar", "concept"];

export const CATEGORIES: { key: FilterKey; label: string; icon: string }[] = [
  { key: "all", label: "ทั้งหมด", icon: "✨" },
  { key: "ea", label: "EA / ระบบเทรดอัตโนมัติ", icon: "🤖" },
  { key: "promotion", label: "โปรโมชั่น", icon: "🎁" },
  { key: "seminar", label: "สัมมนา / กิจกรรม", icon: "🎤" },
  { key: "concept", label: "Mindset & Knowledge", icon: "💡" },
];

export const CATEGORY_STYLE: Record<
  CategoryKey,
  { gradient: string; badgeLight: string; badgeDark: string; label: string }
> = {
  ea: {
    gradient: "from-purple-500 via-indigo-500 to-purple-400",
    badgeLight: "bg-purple-100 text-purple-700",
    badgeDark: "bg-purple-500/20 text-purple-300",
    label: "EA / Bot",
  },
  promotion: {
    gradient: "from-pink-500 via-rose-400 to-orange-300",
    badgeLight: "bg-pink-100 text-pink-700",
    badgeDark: "bg-pink-500/20 text-pink-300",
    label: "โปรโมชั่น",
  },
  seminar: {
    gradient: "from-amber-500 via-orange-400 to-yellow-300",
    badgeLight: "bg-amber-100 text-amber-700",
    badgeDark: "bg-amber-500/20 text-amber-300",
    label: "สัมมนา",
  },
  concept: {
    gradient: "from-teal-500 via-emerald-400 to-cyan-300",
    badgeLight: "bg-teal-100 text-teal-700",
    badgeDark: "bg-teal-500/20 text-teal-300",
    label: "Mindset",
  },
};

// ─── FALLBACK CONTENT ────────────────────────────────────────────────────────
// Used only when a category folder under /public/showcase/<category>/ is empty
// or doesn't exist yet. As soon as you drop real images into that folder, these
// demo items are replaced automatically.
export const FALLBACK_ITEMS: ShowcaseItem[] = [
  {
    id: 1,
    file: "ea-shadow-hedge.png",
    driveId: "1ht9ylKYgCe290OX7pMyBbzssLI7XLyWM",
    title: "EA Shadow Hedge",
    subtitle: "เทรดอย่างมั่นใจ กับระบบเทรดอัตโนมัติทรงพลัง",
    category: "ea",
  },
  {
    id: 2,
    file: "ea-super-grid.png",
    driveId: "1GATRwlCPby3qKZxUuFg3uQtcoI9QfzMS",
    title: "กลยุทธ์ Super Grid",
    subtitle: "EA ระบบ Grid + Hedging โอกาสทำกำไรไม่จำกัดล็อต",
    category: "ea",
  },
  {
    id: 3,
    file: "ea-shadow-grid-ultimate.png",
    driveId: "1h3eI-um4igQWpgNE_n9qvH6hMYNx4Y68",
    title: "Shadow Grid Ultimate",
    subtitle: "ระบบเทรดอัตโนมัติเวอร์ชันอัปเกรด พร้อมใช้งานฟรี",
    category: "ea",
  },
  {
    id: 4,
    file: "promo-copy-trading.png",
    driveId: "1sCm7Pm2qj_vsYrUcZy4HyjUjzzOid8da",
    title: "Copy Trading",
    subtitle: "เจาะลึกโซนซื้อ-ขาย ด้วย Demand & Supply",
    category: "promotion",
  },
  {
    id: 5,
    file: "promo-kru-mam.png",
    driveId: "1KV_PyaN8ohdoPrtTpnbYeOCtXhpctUJ6",
    title: "โปรโมชั่นพิเศษ ครูแหม่ม",
    subtitle: "ติดตามเทคนิคการเทรดจากผู้เชี่ยวชาญตัวจริง",
    category: "promotion",
  },
  {
    id: 6,
    file: "promo-trade.png",
    driveId: "14_UFTEb9OZN6sVIRr7oE54pFT4P43VTV",
    title: "Promotion เทรดทอง",
    subtitle: "ข้อเสนอพิเศษสำหรับนักเทรดทอง (Gold)",
    category: "promotion",
  },
  {
    id: 7,
    file: "seminar-demand-supply.png",
    driveId: "1POWtYEgeWEhHi-DkHiJ3Hjj-5ItneUEd",
    title: "เข้าห้อง...จบในโน้ต",
    subtitle: "Workshop เจาะลึก Demand & Supply กับ VT Markets",
    category: "seminar",
  },
  {
    id: 8,
    file: "seminar-pro-trader.png",
    driveId: "1fj8yD2akJkl0McIV8n_InlvBNR9LExYb",
    title: "เริ่มเทรดแบบมือโปร",
    subtitle: "ปูพื้นฐานการเทรดอย่างเป็นระบบตั้งแต่ก้าวแรก",
    category: "seminar",
  },
  {
    id: 9,
    file: "seminar-vt-life.png",
    driveId: "1Z7EPIhHntFceZcQn_5Y6-8Mj6BdXwl-H",
    title: "ชีวิตติดเทรด",
    subtitle: "แรงบันดาลใจจากนักเทรดจริงกับ VT Markets",
    category: "seminar",
  },
  {
    id: 10,
    file: "concept-mindset.png",
    driveId: "1q6NdN-nEpG0PYnyuCqYfX0pF5snGeCk2",
    title: "Mindset",
    subtitle: "ทัศนคติและวิธีคิดของนักเทรดมืออาชีพ",
    category: "concept",
  },
  {
    id: 11,
    file: "concept-money-management.png",
    driveId: "1tPrHgzknpHoHONycrStLuAqIdVKqgji6",
    title: "Money Management",
    subtitle: "การบริหารเงินทุนเพื่อการเทรดอย่างยั่งยืน",
    category: "concept",
  },
  {
    id: 12,
    file: "concept-3m.png",
    driveId: "1MoLFe9Zn7rnMMquJFIggq1pxrk1abyfk",
    title: "3M คืออะไร?",
    subtitle: "Mindset, Money Management, Method — 3 เสาหลักของนักเทรด",
    category: "concept",
  },
];
