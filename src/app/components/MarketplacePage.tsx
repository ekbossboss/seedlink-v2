import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, Filter, MapPin, Star, ShoppingCart } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { serverUrl } from "../lib/supabase";

export function MarketplacePage() {
  const { accessToken } = useAuth();
  const [seeds, setSeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariety, setSelectedVariety] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch seeds from API
  useEffect(() => {
    const fetchSeeds = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${serverUrl}/seeds`, {
          headers: accessToken ? {
            'Authorization': `Bearer ${accessToken}`,
          } : {},
        });

        if (!response.ok) throw new Error('Failed to fetch seeds');
        const data = await response.json();
        setSeeds(data.seeds || []);
      } catch (err) {
        console.error('Error fetching seeds:', err);
        setError(err instanceof Error ? err.message : 'Failed to load seeds');
        // Set empty array to show "no seeds" message instead of error breaking the page
        setSeeds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSeeds();
  }, [accessToken]);

  // Extract unique varieties and locations from seeds
  const varieties = Array.from(new Set(['All Varieties', ...seeds.map(s => s.variety || '').filter(Boolean)]));
  const districts = Array.from(new Set(['All Districts', ...seeds.map(s => s.location || '').filter(Boolean)]));

  // Filter and sort seeds
  const filteredSeeds = seeds
    .filter((seed) => {
      const matchesSearch = (seed.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (seed.producer_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      const matchesVariety = selectedVariety === "all" || seed.variety?.toLowerCase() === selectedVariety.toLowerCase();
      const matchesDistrict = selectedDistrict === "all" || (seed.location?.includes(selectedDistrict) ?? false);
      return matchesSearch && matchesVariety && matchesDistrict;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price-high") return (b.price || 0) - (a.price || 0);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seed Marketplace</h1>
          <p className="text-gray-600">Browse certified potato seeds from verified producers</p>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
            Note: {error}. Showing available seeds.
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
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
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
                      <option key={v} value={v === "All Varieties" ? "all" : v.toLowerCase()}>
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
                    <option value="rating">Highest Rated</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setSelectedVariety("all");
                    setSelectedDistrict("all");
                    setSearchQuery("");
                  }}
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
                  placeholder="Search seeds or producers..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-gray-600">Loading seeds...</div>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {filteredSeeds.length} {filteredSeeds.length === 1 ? 'result' : 'results'}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSeeds.map((seed) => (
                    <Link
                      key={seed.id}
                      to={`/seed/${seed.id}`}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
                    >
                      <div className="relative h-48 overflow-hidden bg-gray-200">
                        {((seed.images && seed.images.length > 0) ? seed.images[0] : seed.image) ? (
                          <img
                            src={(seed.images && seed.images.length > 0) ? seed.images[0] : seed.image}
                            alt={seed.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                        {seed.certified && (
                          <div className="absolute top-3 right-3 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                            Certified
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{seed.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">{seed.producer_name || 'Producer'}</p>

                        {seed.rating && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{seed.rating}</span>
                            </div>
                            <span className="text-sm text-gray-500">({seed.reviews || 0} reviews)</span>
                          </div>
                        )}

                        {seed.location && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                            <MapPin className="w-4 h-4" />
                            <span>{seed.location}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {(seed.price || 0).toLocaleString()} RWF
                            </div>
                            <div className="text-xs text-gray-500">per {seed.unit || 'kg'}</div>
                          </div>
                          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            Order
                          </button>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          Min. order: {seed.minOrder || 'N/A'} kg • Available: {(seed.available || 0).toLocaleString()} kg
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {filteredSeeds.length === 0 && (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-600">No seeds found matching your criteria.</p>
                    <button
                      onClick={() => {
                        setSelectedVariety("all");
                        setSelectedDistrict("all");
                        setSearchQuery("");
                      }}
                      className="mt-4 text-green-600 hover:text-green-700"
                    >
                      Clear filters
                    </button>
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
