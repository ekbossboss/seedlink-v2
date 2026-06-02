import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Search, Filter, MapPin, Star, ChevronRight, Sprout, Truck } from "lucide-react";
import { serverUrl } from "../lib/supabase";
import type { MarketplaceSeed } from "../types/marketplace";
import { getSeedCategoryLabel } from "../lib/seedCategories";

async function fetchMarketplaceListings(): Promise<MarketplaceSeed[]> {
  const response = await fetch(`${serverUrl}/seeds`);
  if (!response.ok) {
    throw new Error("Failed to load marketplace listings");
  }
  const data = await response.json();
  return Array.isArray(data.seeds) ? data.seeds : [];
}

export function MarketplacePage() {
  const [seeds, setSeeds] = useState<MarketplaceSeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariety, setSelectedVariety] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const listings = await fetchMarketplaceListings();
        if (!cancelled) setSeeds(listings);
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

  const varieties = useMemo(() => {
    const unique = Array.from(
      new Set(seeds.map((s) => s.variety).filter(Boolean)),
    ).sort();
    return ["All Varieties", ...unique];
  }, [seeds]);

  const districts = useMemo(() => {
    const unique = Array.from(
      new Set(seeds.map((s) => s.location).filter(Boolean) as string[]),
    ).sort();
    return ["All Districts", ...unique];
  }, [seeds]);

  const filteredSeeds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return seeds
      .filter((seed) => {
        const matchesSearch =
          !query ||
          seed.variety?.toLowerCase().includes(query) ||
          getSeedCategoryLabel(seed.category).toLowerCase().includes(query) ||
          seed.producer_name?.toLowerCase().includes(query) ||
          (seed.location?.toLowerCase().includes(query) ?? false);
        const matchesVariety =
          selectedVariety === "all" ||
          seed.variety?.toLowerCase() === selectedVariety.toLowerCase();
        const matchesDistrict =
          selectedDistrict === "all" ||
          (seed.location?.toLowerCase().includes(selectedDistrict.toLowerCase()) ?? false);
        return matchesSearch && matchesVariety && matchesDistrict;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return (a.price || 0) - (b.price || 0);
        if (sortBy === "price-high") return (b.price || 0) - (a.price || 0);
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return (
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      });
  }, [seeds, searchQuery, selectedVariety, selectedDistrict, sortBy]);

  const clearFilters = () => {
    setSelectedVariety("all");
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                  aria-label="Toggle filters"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variety
                  </label>
                  <select
                    value={selectedVariety}
                    onChange={(e) => setSelectedVariety(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {varieties.map((v) => (
                      <option
                        key={v}
                        value={v === "All Varieties" ? "all" : v}
                      >
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d === "All Districts" ? "all" : d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="newest">Newest Listings</option>
                    <option value="rating">Highest Rated Producer</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="w-full text-sm text-green-600 hover:text-green-700"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search varieties, producers, or locations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <p className="text-gray-600">Loading marketplace listings...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {filteredSeeds.length}{" "}
                  {filteredSeeds.length === 1 ? "listing" : "listings"} from approved
                  producers
                </div>

                {filteredSeeds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                alt={getSeedCategoryLabel(seed.category)}
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
                              {getSeedCategoryLabel(seed.category)}
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
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Sprout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-900 font-medium mb-2">
                      {seeds.length === 0
                        ? "No listings yet"
                        : "No listings match your filters"}
                    </p>
                    <p className="text-gray-600 mb-4">
                      {seeds.length === 0
                        ? "Approved producers can add potato seed listings from their dashboard. Listings appear here for everyone."
                        : "Try adjusting your search or filters."}
                    </p>
                    {seeds.length > 0 && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
