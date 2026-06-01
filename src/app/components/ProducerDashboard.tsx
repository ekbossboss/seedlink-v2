import { useState } from "react";
import { Plus, Edit, Trash2, Package, ShoppingBag, TrendingUp, Eye } from "lucide-react";
import { useSearchParams } from "react-router";

const MOCK_PRODUCER_SEEDS = [
  {
    id: "1",
    name: "Kinigi Premium",
    variety: "Kinigi",
    price: 800,
    available: 5000,
    sold: 2300,
    status: "active",
  },
  {
    id: "2",
    name: "Victoria Premium",
    variety: "Victoria",
    price: 850,
    available: 3000,
    sold: 1800,
    status: "active",
  },
  {
    id: "3",
    name: "Cruza Elite",
    variety: "Cruza",
    price: 780,
    available: 0,
    sold: 4500,
    status: "out_of_stock",
  },
];

const MOCK_ORDERS = [
  {
    id: "ORD-001",
    customer: "Jean Claude Nkurunziza",
    seed: "Kinigi Premium",
    quantity: 200,
    total: 160000,
    status: "pending",
    date: "2026-05-20",
  },
  {
    id: "ORD-002",
    customer: "Marie Uwimana",
    seed: "Victoria Premium",
    quantity: 150,
    total: 127500,
    status: "confirmed",
    date: "2026-05-19",
  },
  {
    id: "ORD-003",
    customer: "Patrick Habimana",
    seed: "Kinigi Premium",
    quantity: 300,
    total: 240000,
    status: "delivered",
    date: "2026-05-18",
  },
];

export function ProducerDashboard() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "orders" | "add">(
  (searchParams.get("tab") as "overview" | "listings" | "orders" | "add") || "overview");
  const [newListing, setNewListing] = useState({
    name: "",
    variety: "",
    price: "",
    available: "",
    minOrder: "",
    description: "",
  });

  const handleNewListingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewListing({ ...newListing, [e.target.name]: e.target.value });
  };

  const handleSubmitListing = () => {
    alert("New seed listing created successfully!");
    setActiveTab("listings");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Producer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your seed listings and orders</p>
        </div>
      </div>

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
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Total Sales</h3>
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">8,600 kg</p>
                    <p className="text-sm text-green-600 mt-1">+12% this month</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Active Listings</h3>
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">2</p>
                    <p className="text-sm text-gray-600 mt-1">1 out of stock</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Pending Orders</h3>
                      <ShoppingBag className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">1</p>
                    <p className="text-sm text-gray-600 mt-1">Requires action</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {MOCK_ORDERS.slice(0, 3).map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{order.customer}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{order.seed}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{order.quantity} kg</td>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

                {MOCK_PRODUCER_SEEDS.map((seed) => (
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
                            <span className="text-gray-500">Total Sold</span>
                            <p className="font-semibold text-gray-900">{seed.sold} kg</p>
                          </div>
                        </div>
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
                ))}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Management</h2>

                {MOCK_ORDERS.map((order) => (
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
                        <p className="text-sm text-gray-600">{order.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {order.total.toLocaleString()} RWF
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Customer</span>
                        <p className="font-medium text-gray-900">{order.customer}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Product</span>
                        <p className="font-medium text-gray-900">{order.seed}</p>
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
                          Contact Customer
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "add" && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Seed Listing</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seed Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newListing.name}
                      onChange={handleNewListingChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Kinigi Premium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variety *
                    </label>
                    <select
                      name="variety"
                      value={newListing.variety}
                      onChange={handleNewListingChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Describe your seed quality, growing conditions, etc."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleSubmitListing}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Create Listing
                    </button>
                    <button
                      onClick={() => setActiveTab("listings")}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
