import fs from "fs";
import path from "path";
import ShowcaseClient from "./ShowcaseClient";
import { CATEGORY_KEYS, CategoryKey, FALLBACK_ITEMS, ShowcaseItem } from "./data";

// Image extensions auto-detected when scanning each category folder.
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

// Turns "01-shadow-hedge.png" into "01 shadow hedge". Rename the file to
// change the title shown on the card.
function titleFromFilename(filename: string) {
  const name = filename.replace(/\.[^/.]+$/, "");
  return name.replace(/[-_]+/g, " ").trim();
}

// Reads /public/showcase/<category>/ for image files. If the folder is empty
// or doesn't exist yet, falls back to the curated demo items for that
// category (which use Google Drive thumbnails).
function getCategoryItems(category: CategoryKey): Omit<ShowcaseItem, "id">[] {
  const dir = path.join(process.cwd(), "public", "showcase", category);
  let files: string[] = [];
  try {
    files = fs
      .readdirSync(dir)
      .filter((f) => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .sort();
  } catch {
    files = [];
  }

  if (files.length === 0) {
    return FALLBACK_ITEMS.filter((item) => item.category === category).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ id: _id, ...rest }) => rest
    );
  }

  return files.map((file) => ({
    file: `${category}/${file}`,
    title: titleFromFilename(file),
    subtitle: "",
    category,
  }));
}

export default function ShowcasePage() {
  const items: ShowcaseItem[] = CATEGORY_KEYS.flatMap(getCategoryItems).map((item, index) => ({
    ...item,
    id: index + 1,
  }));

  return <ShowcaseClient items={items} />;
}
