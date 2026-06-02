import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Package, ShoppingBag, TrendingUp, Eye } from "lucide-react";
import { useSearchParams } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { serverUrl } from "../lib/supabase";

export function ProducerDashboard() {
  const { user, accessToken } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "orders" | "add">(
  (searchParams.get("tab") as "overview" | "listings" | "orders" | "add") || "overview");
  
  // Data states
  const [seeds, setSeeds] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newListing, setNewListing] = useState({
    name: "",
    variety: "",
    category: "",
    price: "",
    available: "",
    minOrder: "",
    description: "",
    features: [] as string[],
  });
  const [newFeature, setNewFeature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setFilePreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

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
    if (
      !newListing.name ||
      !newListing.variety ||
      !newListing.category ||
      !newListing.price ||
      !newListing.available ||
      !newListing.minOrder ||
      newListing.features.length === 0 ||
      files.length === 0
    ) {
      alert("Please fill in all required fields and add at least one photo.");
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

      const response = await fetch(`${serverUrl}/seeds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newListing.name,
          variety: newListing.variety,
          category: newListing.category,
          price: parseFloat(newListing.price),
          available: parseFloat(newListing.available),
          minOrder: parseFloat(newListing.minOrder),
          description: newListing.description,
          keyFeatures: newListing.features,
          images: imageUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing');
      }

      alert("Seed listing created successfully!");
      setNewListing({
        name: "",
        variety: "",
        category: "",
        price: "",
        available: "",
        minOrder: "",
        description: "",
        features: [],
      });
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
                            <h3 className="text-lg font-semibold text-gray-900">{seed.name}</h3>
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
                          <p className="text-gray-600 mb-4">Variety: {seed.variety}</p>

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
                          {seed.description && (
                            <p className="text-sm text-gray-600 mt-4">{seed.description}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <Eye className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Management</h2>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-600">Loading orders...</div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    No orders yet
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{order.id}</h3>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "confirmed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {(order.quantity * order.total_price || 0).toLocaleString()} RWF
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-500">Order Type</span>
                          <p className="font-medium text-gray-900">Seed Purchase</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Seed</span>
                          <p className="font-medium text-gray-900">{order.seed_id || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Quantity</span>
                          <p className="font-medium text-gray-900">{order.quantity} kg</p>
                        </div>
                      </div>

                      {order.status === "pending" && (
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            Confirm Order
                          </button>
                          <button className="flex-1 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                            Contact Buyer
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "add" && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Seed Listing</h2>

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
                      <option value="Vegetable">Mini tubers (G1)</option>
                      <option value="Fruit">Apical cuttings(G1)</option>
                      <option value="Grain">Pre basic seed (G2)</option>
                      <option value="Herb">Basic seed (G3)</option>
                      <option value="Flower">Certified seed (G4)</option>
                      <option value="Other">Other</option>
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
                      {submitting ? 'Creating...' : 'Create Listing'}
                    </button>
                    <button
                      onClick={() => setActiveTab("listings")}
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
