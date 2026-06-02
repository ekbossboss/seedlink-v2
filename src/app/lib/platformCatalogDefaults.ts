export interface SeedCategoryOption {
  value: string;
  label: string;
}

export const DEFAULT_SEED_CATEGORIES: SeedCategoryOption[] = [
  { value: "mini_tubers_g1", label: "Mini tubers (G1)" },
  { value: "apical_cuttings_g1", label: "Apical cuttings (G1)" },
  { value: "pre_basic_g2", label: "Pre basic seed (G2)" },
  { value: "basic_g3", label: "Basic seed (G3)" },
  { value: "certified_g4", label: "Certified seed (G4)" },
  { value: "other", label: "Other" },
];

export const DEFAULT_SUPPORTED_VARIETIES: string[] = [
  "Kinigi",
  "Cruza",
  "Victoria",
  "Kirundo",
  "Sangwe",
  "Mabondo",
];

export const DEFAULT_SUPPORTED_DISTRICTS: string[] = [
  "Kigali",
  "Nyarugenge",
  "Gasabo",
  "Kicukiro",
  "Musanze",
  "Rubavu",
  "Burera",
  "Gicumbi",
  "Rulindo",
  "Karongi",
  "Rusizi",
  "Nyamasheke",
  "Huye",
  "Nyanza",
  "Nyagatare",
  "Rwamagana",
];

export function slugifyCategoryValue(label: string): string {
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return slug || "category";
}
