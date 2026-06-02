import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { serverUrl } from "../lib/supabase";
import {
  DEFAULT_SEED_CATEGORIES,
  DEFAULT_SUPPORTED_DISTRICTS,
  DEFAULT_SUPPORTED_VARIETIES,
  type SeedCategoryOption,
} from "../lib/platformCatalogDefaults";
import { buildCategoryLabelMap, getSeedCategoryLabel as resolveCategoryLabel } from "../lib/seedCategories";

interface PlatformCatalogContextType {
  seedCategories: SeedCategoryOption[];
  supportedVarieties: string[];
  supportedDistricts: string[];
  loading: boolean;
  refreshCatalog: () => Promise<void>;
  getCategoryLabel: (category?: string | null) => string;
}

const PlatformCatalogContext = createContext<PlatformCatalogContextType | undefined>(
  undefined,
);

export function PlatformCatalogProvider({ children }: { children: ReactNode }) {
  const [seedCategories, setSeedCategories] = useState<SeedCategoryOption[]>(
    DEFAULT_SEED_CATEGORIES,
  );
  const [supportedVarieties, setSupportedVarieties] = useState<string[]>(
    DEFAULT_SUPPORTED_VARIETIES,
  );
  const [supportedDistricts, setSupportedDistricts] = useState<string[]>(
    DEFAULT_SUPPORTED_DISTRICTS,
  );
  const [loading, setLoading] = useState(true);
  const [labelMap, setLabelMap] = useState(() =>
    buildCategoryLabelMap(DEFAULT_SEED_CATEGORIES),
  );

  const refreshCatalog = useCallback(async () => {
    try {
      const res = await fetch(`${serverUrl}/platform/catalog`);
      if (res.ok) {
        const data = await res.json();
        const categories =
          Array.isArray(data.seed_categories) && data.seed_categories.length > 0
            ? data.seed_categories
            : DEFAULT_SEED_CATEGORIES;
        const varieties =
          Array.isArray(data.supported_varieties) &&
          data.supported_varieties.length > 0
            ? data.supported_varieties
            : DEFAULT_SUPPORTED_VARIETIES;
        const districts =
          Array.isArray(data.supported_districts) &&
          data.supported_districts.length > 0
            ? data.supported_districts
            : DEFAULT_SUPPORTED_DISTRICTS;
        setSeedCategories(categories);
        setSupportedVarieties(varieties);
        setSupportedDistricts(districts);
        setLabelMap(buildCategoryLabelMap(categories));
      }
    } catch (error) {
      console.error("Failed to load platform catalog:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const getCategoryLabel = useCallback(
    (category?: string | null) => resolveCategoryLabel(category, labelMap),
    [labelMap],
  );

  return (
    <PlatformCatalogContext.Provider
      value={{
        seedCategories,
        supportedVarieties,
        supportedDistricts,
        loading,
        refreshCatalog,
        getCategoryLabel,
      }}
    >
      {children}
    </PlatformCatalogContext.Provider>
  );
}

export function usePlatformCatalog() {
  const context = useContext(PlatformCatalogContext);
  if (context === undefined) {
    throw new Error("usePlatformCatalog must be used within PlatformCatalogProvider");
  }
  return context;
}
