import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Search, Filter, MapPin, Star, ChevronRight, Sprout, Truck } from "lucide-react";
import { serverUrl } from "../lib/supabase";
import { publicAnonKey } from '../../../utils/supabase/info';
import type { MarketplaceSeed } from "../types/marketplace";
import { usePlatformCatalog } from "../contexts/PlatformCatalogContext";

async function fetchMarketplaceListings(): Promise<{ seeds: MarketplaceSeed[]; maintenanceMode: boolean }> {
  const response = await fetch(`${serverUrl}/seeds`, {
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("Marketplace seeds fetch failed:", response.status, text || response.statusText);
    throw new Error(`Failed to load marketplace listings (status ${response.status})${text ? `: ${text}` : ''}`);
  }
  const data = await response.json();
  return {
    seeds: Array.isArray(data.seeds) ? data.seeds : [],
    maintenanceMode: data.maintenance_mode === true,
  };
}

export function MarketplacePage() {
  const { seedCategories, supportedVarieties, supportedDistricts, getCategoryLabel, refreshCatalog } =
    usePlatformCatalog();
  const [seeds, setSeeds] = useState<MarketplaceSeed[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariety, setSelectedVariety] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { seeds: listings, maintenanceMode: maintenance } = await fetchMarketplaceListings();
        if (!cancelled) {
          setSeeds(listings);
          setMaintenanceMode(maintenance);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load marketplace");
          setSeeds([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const varieties = useMemo(
    () => ["All Varieties", ...supportedVarieties],
    [supportedVarieties],
  );

  const districts = useMemo(
    () => ["All Districts", ...supportedDistricts],
    [supportedDistricts],
  );

  const categoryFilterOptions = useMemo(
    () => [
      { value: "all", label: "All categories" },
      ...seedCategories.map((c) => ({ value: c.value, label: c.label })),
    ],
    [seedCategories],
  );

  const filteredSeeds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return seeds
      .filter((seed) => {
        const matchesSearch =
          !query ||
          seed.variety?.toLowerCase().includes(query) ||
          getCategoryLabel(seed.category).toLowerCase().includes(query) ||
          seed.producer_name?.toLowerCase().includes(query) ||
          (seed.location?.toLowerCase().includes(query) ?? false);
        const matchesVariety =
          selectedVariety === "all" ||
          seed.variety?.toLowerCase() === selectedVariety.toLowerCase();
        const matchesCategory =
          selectedCategory === "all" || seed.category === selectedCategory;
        const matchesDistrict =
          selectedDistrict === "all" ||
          (seed.location?.toLowerCase().includes(selectedDistrict.toLowerCase()) ?? false);
        return matchesSearch && matchesVariety && matchesCategory && matchesDistrict;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return (a.price || 0) - (b.price || 0);
        if (sortBy === "price-high") return (b.price || 0) - (a.price || 0);
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return (
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      });
  }, [seeds, searchQuery, selectedVariety, selectedCategory, selectedDistrict, sortBy, getCategoryLabel]);

  const clearFilters = () => {
    setSelectedVariety("all");
    setSelectedCategory("all");
    setSelectedDistrict("all");
    setSearchQuery("");
  };

  const primaryImage = (seed: MarketplaceSeed) =>
    seed.images?.[0] || seed.image || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seed Marketplace</h1>
          <p className="text-gray-600">
            Browse potato seed listings from approved producers. The same catalog is shown to
            every visitor and signed-in user.
          </p>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        </div>
      )}

      {maintenanceMode && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900 text-sm">
            The marketplace is temporarily unavailable for maintenance. Please check back later.
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-gray-600">
          {!loading && (
            <span>
              {filteredSeeds.length} {filteredSeeds.length === 1 ? "listing" : "listings"}
            </span>
          )}
          {(searchQuery || selectedVariety !== "all" || selectedCategory !== "all" || selectedDistrict !== "all") && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-green-600 hover:text-green-700"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="mb-4 sticky top-16 z-10 bg-gray-50/95 backdrop-blur-sm py-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex-1 min-w-[140px] sm:min-w-[180px] sm:max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-8 pl-7 pr-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white"
              />
            </div>

            <div
              className={`flex flex-wrap items-center gap-2 ${
                showFilters ? "flex" : "hidden sm:flex"
              }`}
            >
              <select
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                aria-label="Variety"
                className="h-8 min-w-0 flex-1 sm:flex-none sm:max-w-[9rem] px-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 bg-white"
              >
                {varieties.map((v) => (
                  <option key={v} value={v === "All Varieties" ? "all" : v}>
                    {v === "All Varieties" ? "All varieties" : v}
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Category"
                className="h-8 min-w-0 flex-1 sm:flex-none sm:max-w-[9rem] px-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 bg-white"
              >
                {categoryFilterOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                aria-label="Location"
                className="h-8 min-w-0 flex-1 sm:flex-none sm:max-w-[9rem] px-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 bg-white"
              >
                {districts.map((d) => (
                  <option key={d} value={d === "All Districts" ? "all" : d}>
                    {d === "All Districts" ? "All locations" : d}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort by"
                className="h-8 min-w-0 flex-1 sm:flex-none sm:max-w-[8.5rem] px-2 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 bg-white"
              >
                <option value="newest">Newest</option>
                <option value="rating">Top rated</option>
                <option value="price-low">Price ↑</option>
                <option value="price-high">Price ↓</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden h-8 px-2 inline-flex items-center gap-1 text-xs text-gray-600 border border-gray-300 rounded-md bg-white"
              aria-label="Toggle filters"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-sm text-gray-600">Loading listings...</p>
          </div>
        ) : filteredSeeds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSeeds.map((seed) => (
                      <article
                        key={seed.id}
                        className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
                      >
                        <Link
                          to={`/seed/${seed.id}`}
                          className="group block"
                        >
                          <div className="relative h-48 overflow-hidden bg-gray-200">
                            {primaryImage(seed) ? (
                              <img
                                src={primaryImage(seed)!}
                                alt={getCategoryLabel(seed.category)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <Sprout className="w-10 h-10" />
                                <span className="text-sm">No photo</span>
                              </div>
                            )}
                            {seed.certified && (
                              <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                Approved Producer
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="p-5 flex flex-col flex-1">
                          <Link
                            to={`/seed/${seed.id}`}
                            className="hover:text-green-700"
                          >
                            <h3 className="font-bold text-lg text-gray-900 mb-1">
                              {getCategoryLabel(seed.category)}
                            </h3>
                          </Link>
                          {seed.variety && (
                            <p className="text-sm text-gray-600 mb-1">
                              Variety: {seed.variety}
                            </p>
                          )}
                          {seed.producer_id ? (
                            <Link
                              to={`/producer/${seed.producer_id}`}
                              className="text-sm text-green-600 hover:text-green-700 mb-3 inline-block"
                            >
                              {seed.producer_name}
                            </Link>
                          ) : (
                            <p className="text-sm text-gray-600 mb-3">
                              {seed.producer_name}
                            </p>
                          )}

                          {seed.rating != null && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">
                                  {seed.rating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                ({seed.reviews || 0} producer reviews)
                              </span>
                            </div>
                          )}

                          {seed.location && (
                            <div className="flex items-start gap-1 text-sm text-gray-600 mb-2">
                              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>{seed.location}</span>
                            </div>
                          )}
                          {seed.delivery_details && (
                            <div className="flex items-start gap-1 text-sm text-gray-600 mb-4 line-clamp-2">
                              <Truck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>{seed.delivery_details}</span>
                            </div>
                          )}

                          <div className="mt-auto pt-4 border-t border-gray-200 flex items-end justify-between gap-4">
                            <div>
                              <div className="text-2xl font-bold text-green-600">
                                {(seed.price || 0).toLocaleString()} RWF
                              </div>
                              <div className="text-xs text-gray-500">
                                per {seed.unit || "kg"}
                              </div>
                            </div>
                            <Link
                              to={`/seed/${seed.id}`}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm font-medium whitespace-nowrap"
                            >
                              View listing
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>

                          <div className="mt-3 text-xs text-gray-500">
                            Min. order: {seed.minOrder ?? "N/A"} kg • Available:{" "}
                            {(seed.available || 0).toLocaleString()} kg
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Sprout className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-900 font-medium mb-1 text-sm">
              {seeds.length === 0 ? "No listings yet" : "No listings match your filters"}
            </p>
            <p className="text-gray-600 text-sm mb-3">
              {seeds.length === 0
                ? "Approved producers can add listings from their dashboard."
                : "Try adjusting your search or filters."}
            </p>
            {seeds.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
