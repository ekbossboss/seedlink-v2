import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, ShoppingBag, TrendingUp, Eye } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { serverUrl } from "../lib/supabase";
import { RWANDA_DISTRICTS } from "../lib/rwandaDistricts";
import { SEED_CATEGORIES, getSeedCategoryLabel } from "../lib/seedCategories";
import type { QuoteRequest } from "../types/quotes";
import { QuoteThreadPanel } from "./QuoteThreadPanel";

const emptyListingForm = () => ({
  variety: "",
  category: "",
  price: "",
  available: "",
  minOrder: "",
  location: "",
  locationDetail: "",
  deliveryDetails: "",
  description: "",
  features: [] as string[],
});

const formatListingLocation = (district: string, detail: string) => {
  const base = district.trim();
  const extra = detail.trim();
  if (!base) return "";
  return extra ? `${base}, ${extra}` : base;
};

const parseStoredLocation = (stored?: string | null) => {
  if (!stored) return { location: "", locationDetail: "" };
  const district = RWANDA_DISTRICTS.find(
    (d) => stored === d || stored.startsWith(`${d},`),
  );
  if (district) {
    return {
      location: district,
      locationDetail: stored.slice(district.length).replace(/^,\s*/, ""),
    };
  }
  return { location: "", locationDetail: stored };
};

export function ProducerDashboard() {
  const { user, accessToken } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "orders" | "add">(
  (searchParams.get("tab") as "overview" | "listings" | "orders" | "add") || "overview");
  
  // Data states
  const [seeds, setSeeds] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newListing, setNewListing] = useState(emptyListingForm);
  const [newFeature, setNewFeature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [editingSeedId, setEditingSeedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setFilePreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const fetchProducerSeeds = async (token?: string) => {
    if (!user?.id || !token) return;
    try {
      const seedsRes = await fetch(`${serverUrl}/seeds/producer/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!seedsRes.ok) return;
      const seedsData = await seedsRes.json();
      setSeeds(seedsData.seeds || []);
    } catch (err) {
      console.error('Error fetching seeds:', err);
    }
  };

  // Fetch producer's seeds and orders
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch producer's seeds
        const seedsRes = await fetch(`${serverUrl}/seeds/producer/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!seedsRes.ok) throw new Error('Failed to fetch seeds');
        const seedsData = await seedsRes.json();
        setSeeds(seedsData.seeds || []);

        // Fetch producer's orders
        const ordersRes = await fetch(`${serverUrl}/orders/producer-orders`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!ordersRes.ok) throw new Error('Failed to fetch orders');
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders || []);

        const quotesRes = await fetch(`${serverUrl}/quote-requests/inbox`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (quotesRes.ok) {
          const quotesData = await quotesRes.json();
          setQuotes(quotesData.quotes || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, accessToken]);

  const handleNewListingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewListing({ ...newListing, [e.target.name]: e.target.value });
  };

  const handleSubmitListing = async () => {
    const missing: string[] = [];
    if (!newListing.variety) missing.push('Variety');
    if (!newListing.category) missing.push('Seed Category');
    if (!newListing.price) missing.push('Price per kg');
    if (!newListing.available) missing.push('Available quantity');
    if (!newListing.minOrder) missing.push('Minimum order');
    if (!newListing.location) missing.push('Seed location (district)');
    if (!newListing.deliveryDetails.trim()) missing.push('Delivery details');
    if (newListing.features.length === 0) missing.push('Key features (add at least one)');
    if (files.length === 0 && existingImages.length === 0) missing.push('Photos (add at least one)');

    if (missing.length > 0) {
      alert('Please provide the following required fields:\n- ' + missing.join('\n- '));
      return;
    }

    if (!accessToken) {
      alert("Not authenticated");
      return;
    }

    try {
      setSubmitting(true);
      // If files selected, upload each and collect signed URLs
      const imageUrls: string[] = [];
      for (const file of files) {
        try {
          const form = new FormData();
          form.append('file', file);
          form.append('type', 'seed_image');

          const uploadRes = await fetch(`${serverUrl}/upload-document`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: form,
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            console.warn('Upload failed for file', file.name, err);
            continue;
          }

          const uploadData = await uploadRes.json();
          if (uploadData?.url) imageUrls.push(uploadData.url);
        } catch (uErr) {
          console.error('File upload error', uErr);
        }
      }

      const listingLocation = formatListingLocation(
        newListing.location,
        newListing.locationDetail,
      );
      const deliveryDetails = newListing.deliveryDetails.trim();

      if (editingSeedId) {
        // Update existing listing
        const combinedImages = [...existingImages, ...imageUrls];
        const res = await fetch(`${serverUrl}/seeds/${editingSeedId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            variety: newListing.variety,
            category: newListing.category,
            price: parseFloat(newListing.price),
            available: parseFloat(newListing.available),
            minOrder: parseFloat(newListing.minOrder),
            location: listingLocation,
            delivery_details: deliveryDetails,
            description: newListing.description,
            keyFeatures: newListing.features,
            features: newListing.features,
            images: combinedImages,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to update listing');
        }

        alert('Listing updated successfully!');
        setEditingSeedId(null);
        setExistingImages([]);
      } else {
        const response = await fetch(`${serverUrl}/seeds`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            variety: newListing.variety,
            category: newListing.category,
            price: parseFloat(newListing.price),
            available: parseFloat(newListing.available),
            minOrder: parseFloat(newListing.minOrder),
            location: listingLocation,
            delivery_details: deliveryDetails,
            description: newListing.description,
            keyFeatures: newListing.features,
            features: newListing.features,
            images: imageUrls,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create listing');
        }

        alert("Seed listing created successfully!");
      }
      setNewListing(emptyListingForm());
      setNewFeature("");
      
      // Refresh seeds list
      if (user?.id) {
        const seedsRes = await fetch(`${serverUrl}/seeds/producer/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (seedsRes.ok) {
          const seedsData = await seedsRes.json();
          setSeeds(seedsData.seeds || []);
        }
      }

      // clear files
      setFiles([]);
      
      setActiveTab("listings");
    } catch (err) {
      console.error('Error creating listing:', err);
      alert(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = (seedId: string) => {
    navigate(`/seed/${seedId}`);
  };

  const handleEdit = (seed: any) => {
    const { location, locationDetail } = parseStoredLocation(seed.location);
    setEditingSeedId(seed.id);
    setActiveTab('add');
    setNewListing({
      variety: seed.variety || '',
      category: seed.category || '',
      price: String(seed.price || ''),
      available: String(seed.available || ''),
      minOrder: String(seed.minOrder || ''),
      location,
      locationDetail,
      deliveryDetails: seed.delivery_details || '',
      description: seed.description || '',
      features: seed.features || seed.keyFeatures || [],
    });
    setExistingImages(seed.images || (seed.image ? [seed.image] : []));
    setFiles([]);
    setFilePreviews([]);
  };

  const handleDelete = async (seedId: string) => {
    if (!confirm('Delete this listing? This action cannot be undone.')) return;
    if (!accessToken) {
      alert('Not authenticated');
      return;
    }
    try {
      const res = await fetch(`${serverUrl}/seeds/${seedId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete listing');
      }
      // refresh list
      await fetchProducerSeeds(accessToken);
    } catch (err) {
      console.error('Delete error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete listing');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Producer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your seed listings and orders</p>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            Error: {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { key: "overview", label: "Overview", icon: TrendingUp },
                { key: "listings", label: "My Listings", icon: Package },
                { key: "orders", label: "Orders", icon: ShoppingBag },
                { key: "add", label: "Add Listing", icon: Plus },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-green-600 text-green-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading && activeTab === "overview" ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-600">Loading dashboard...</div>
              </div>
            ) : activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Total Sales</h3>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {seeds.reduce((sum, seed) => sum + (seed.available || 0), 0).toLocaleString()} kg
                    </p>
                    <p className="text-sm text-green-600 mt-1">Available in stock</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Active Listings</h3>
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{seeds.length}</p>
                    <p className="text-sm text-gray-600 mt-1">Seed varieties</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Pending Orders</h3>
                      <ShoppingBag className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {orders.filter(o => o.status === 'pending').length}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Requires action</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    {orders.length === 0 ? (
                      <div className="px-6 py-8 text-center text-gray-600">
                        No orders yet
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {orders.slice(0, 3).map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{order.seed_id || 'N/A'}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{order.quantity || 0} kg</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                    order.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : order.status === "confirmed"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {new Date(order.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "listings" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Seed Listings</h2>
                  <button
                    onClick={() => setActiveTab("add")}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add New Listing
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-600">Loading listings...</div>
                  </div>
                ) : seeds.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    No seed listings yet. Click "Add New Listing" to create one.
                  </div>
                ) : (
                  seeds.map((seed) => (
                    <div
                      key={seed.id}
                      className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {getSeedCategoryLabel(seed.category)}
                            </h3>
                            {seed.category && seed.variety && (
                              <p className="text-sm text-gray-500">Variety: {seed.variety}</p>
                            )}
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                seed.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {seed.status === "active" ? "Active" : "Out of Stock"}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Price</span>
                              <p className="font-semibold text-gray-900">{seed.price} RWF/kg</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Available</span>
                              <p className="font-semibold text-gray-900">{seed.available} kg</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Min Order</span>
                              <p className="font-semibold text-gray-900">{seed.minOrder || 'N/A'} kg</p>
                            </div>
                          </div>
                          {(seed.location || seed.delivery_details) && (
                            <div className="text-sm text-gray-600 mt-3 space-y-1">
                              {seed.location && (
                                <p>
                                  <span className="text-gray-500">Location:</span> {seed.location}
                                </p>
                              )}
                              {seed.delivery_details && (
                                <p>
                                  <span className="text-gray-500">Delivery:</span>{" "}
                                  {seed.delivery_details}
                                </p>
                              )}
                            </div>
                          )}
                          {seed.description && (
                            <p className="text-sm text-gray-600 mt-2">{seed.description}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => handlePreview(seed.id)} className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleEdit(seed)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(seed.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote requests</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Respond to farmers on SeedLink. When they confirm, an order is created
                    automatically.
                  </p>

                  {loading ? (
                    <div className="text-gray-600">Loading...</div>
                  ) : quotes.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 border border-dashed border-gray-300 rounded-lg">
                      No quote requests yet
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quotes.map((q) => (
                        <div
                          key={q.id}
                          className="border border-gray-200 rounded-lg p-6"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {getSeedCategoryLabel(q.seed_category)}
                                {q.seed_variety ? ` · ${q.seed_variety}` : ""}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {q.buyer_name} · {q.quantity} kg
                              </p>
                              <button
                                type="button"
                                onClick={() => navigate(`/seed/${q.seed_id}`)}
                                className="text-sm text-green-600 hover:underline mt-1"
                              >
                                View listing
                              </button>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                              {q.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          {expandedQuoteId === q.id && accessToken && user ? (
                            <QuoteThreadPanel
                              quote={q}
                              user={user}
                              accessToken={accessToken}
                              onUpdate={(updated) => {
                                setQuotes((prev) =>
                                  prev.map((item) =>
                                    item.id === updated.id ? updated : item,
                                  ),
                                );
                              }}
                              listedUnitPrice={q.listed_unit_price}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedQuoteId(
                                  expandedQuoteId === q.id ? null : q.id,
                                )
                              }
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              {expandedQuoteId === q.id ? "Hide" : "Respond on SeedLink"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Confirmed orders</h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      No confirmed orders yet
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-6 mb-4"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {order.seed_name || order.seed_id}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString()} ·{" "}
                              {order.status}
                            </p>
                          </div>
                          <p className="text-xl font-bold text-green-600">
                            {(order.total || order.quantity * (order.unit_price || 0) || 0).toLocaleString()}{" "}
                            RWF
                          </p>
                        </div>
                        <p className="text-sm text-gray-700">{order.quantity} kg</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "add" && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {editingSeedId ? "Edit Seed Listing" : "Add New Seed Listing"}
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variety *
                    </label>
                    <select
                      name="variety"
                      value={newListing.variety}
                      onChange={handleNewListingChange}
                      disabled={submitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select variety</option>
                      <option value="Kinigi">Kinigi</option>
                      <option value="Cruza">Cruza</option>
                      <option value="Victoria">Victoria</option>
                      <option value="Kirundo">Kirundo</option>
                      <option value="Sangwe">Sangwe</option>
                      <option value="Mabondo">Mabondo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seed Category *
                    </label>
                    <select
                      name="category"
                      value={newListing.category}
                      onChange={handleNewListingChange}
                      disabled={submitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select category</option>
                      {SEED_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price per kg (RWF) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={newListing.price}
                        onChange={handleNewListingChange}
                        disabled={submitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Order (kg) *
                      </label>
                      <input
                        type="number"
                        name="minOrder"
                        value={newListing.minOrder}
                        onChange={handleNewListingChange}
                        disabled={submitting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Quantity (kg) *
                    </label>
                    <input
                      type="number"
                      name="available"
                      value={newListing.available}
                      onChange={handleNewListingChange}
                      disabled={submitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seed location (district) *
                    </label>
                    <select
                      name="location"
                      value={newListing.location}
                      onChange={handleNewListingChange}
                      disabled={submitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="">Select district where seeds are stored</option>
                      {RWANDA_DISTRICTS.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Area / sector (optional)
                    </label>
                    <input
                      type="text"
                      name="locationDetail"
                      value={newListing.locationDetail}
                      onChange={handleNewListingChange}
                      disabled={submitting}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="e.g. Kinigi sector, near main road"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery details *
                    </label>
                    <textarea
                      name="deliveryDetails"
                      value={newListing.deliveryDetails}
                      onChange={handleNewListingChange}
                      disabled={submitting}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="e.g. Delivery available across Rwanda. Pickup in Musanze. 2–3 day lead time for Kigali."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Explain where you can deliver, pickup options, and typical timelines.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={newListing.description}
                      onChange={handleNewListingChange}
                      disabled={submitting}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Describe your seed quality, growing conditions, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key Features *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="Add a feature, e.g., drought tolerant"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newFeature.trim()) return;
                          setNewListing((prev) => ({
                            ...prev,
                            features: [...prev.features, newFeature.trim()],
                          }));
                          setNewFeature("");
                        }}
                        disabled={submitting}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                    {newListing.features.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {newListing.features.map((feature, index) => (
                          <span
                            key={`${feature}-${index}`}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-sm text-green-700"
                          >
                            {feature}
                            <button
                              type="button"
                              onClick={() =>
                                setNewListing((prev) => ({
                                  ...prev,
                                  features: prev.features.filter((_, i) => i !== index),
                                }))
                              }
                              className="text-green-700 hover:text-green-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photos *</label>
                    <label className="inline-flex items-center justify-center w-full px-4 py-3 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors bg-white text-gray-700">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        disabled={submitting}
                        className="hidden"
                      />
                      <span className="text-sm font-medium">Select photos or drag them here</span>
                    </label>
                    {existingImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {existingImages.map((url, idx) => (
                          <div key={url} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <img src={url} alt={`Existing ${idx + 1}`} className="h-28 w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setExistingImages((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute top-2 right-2 bg-white rounded-full p-1 text-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {files.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filePreviews.map((preview, index) => (
                          <div key={preview} className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white">
                            <img src={preview} alt={`Preview ${index + 1}`} className="h-28 w-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-xs text-white text-center">
                              {files[index]?.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleSubmitListing}
                      disabled={submitting}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {submitting ? (editingSeedId ? 'Updating...' : 'Creating...') : (editingSeedId ? 'Update Listing' : 'Create Listing')}
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("listings");
                        if (editingSeedId) {
                          setEditingSeedId(null);
                          setExistingImages([]);
                          setNewListing(emptyListingForm());
                        }
                      }}
                      disabled={submitting}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
