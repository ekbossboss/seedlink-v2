/** Seed category options for producer listings (value stored in DB, label shown in UI). */
export const SEED_CATEGORIES = [
  { value: "mini_tubers_g1", label: "Mini tubers (G1)" },
  { value: "apical_cuttings_g1", label: "Apical cuttings (G1)" },
  { value: "pre_basic_g2", label: "Pre basic seed (G2)" },
  { value: "basic_g3", label: "Basic seed (G3)" },
  { value: "certified_g4", label: "Certified seed (G4)" },
  { value: "other", label: "Other" },
] as const;

/** Maps legacy and current stored category values to display labels. */
const CATEGORY_LABEL_MAP: Record<string, string> = {
  mini_tubers_g1: "Mini tubers (G1)",
  apical_cuttings_g1: "Apical cuttings (G1)",
  pre_basic_g2: "Pre basic seed (G2)",
  basic_g3: "Basic seed (G3)",
  certified_g4: "Certified seed (G4)",
  other: "Other",
  // Legacy values from earlier form options
  Vegetable: "Mini tubers (G1)",
  Fruit: "Apical cuttings (G1)",
  Grain: "Pre basic seed (G2)",
  Herb: "Basic seed (G3)",
  Flower: "Certified seed (G4)",
  Other: "Other",
};

export function getSeedCategoryLabel(category?: string | null): string {
  if (!category) return "Seed listing";
  return CATEGORY_LABEL_MAP[category] ?? category;
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
