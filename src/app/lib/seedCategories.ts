import {
  DEFAULT_SEED_CATEGORIES,
  type SeedCategoryOption,
} from "./platformCatalogDefaults";

/** @deprecated Use usePlatformCatalog().seedCategories — kept as fallback */
export const SEED_CATEGORIES = DEFAULT_SEED_CATEGORIES;

const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  Vegetable: "Mini tubers (G1)",
  Fruit: "Apical cuttings (G1)",
  Grain: "Pre basic seed (G2)",
  Herb: "Basic seed (G3)",
  Flower: "Certified seed (G4)",
  Other: "Other",
};

export function buildCategoryLabelMap(
  categories: SeedCategoryOption[],
): Record<string, string> {
  const map: Record<string, string> = { ...LEGACY_CATEGORY_LABELS };
  for (const cat of categories) {
    map[cat.value] = cat.label;
  }
  return map;
}

const DEFAULT_LABEL_MAP = buildCategoryLabelMap(DEFAULT_SEED_CATEGORIES);

export function getSeedCategoryLabel(
  category?: string | null,
  labelMap: Record<string, string> = DEFAULT_LABEL_MAP,
): string {
  if (!category) return "Seed listing";
  return labelMap[category] ?? category;
}

export function getSeedFeatures(seed: {
  features?: string[];
  keyFeatures?: string[];
}): string[] {
  const fromFeatures = Array.isArray(seed.features) ? seed.features : [];
  const fromKey = Array.isArray(seed.keyFeatures) ? seed.keyFeatures : [];
  return [...fromFeatures, ...fromKey].filter(
    (item, index, arr) => item && arr.indexOf(item) === index,
  );
}
