import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { serverUrl } from "../lib/supabase";
import { Package, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { usePlatformCatalog } from "../contexts/PlatformCatalogContext";
import type { QuoteRequest } from "../types/quotes";
import { QuoteThreadPanel } from "./QuoteThreadPanel";

interface Order {
  id: string;
  seed_name: string;
  producer_name: string;
  quantity: number;
  total: number;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  created_at: string;
}

export function MyOrdersPage() {
  const { user, accessToken } = useAuth();
  const { getCategoryLabel } = usePlatformCatalog();
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"orders" | "quotes">("quotes");
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

  const fetchData = async () => {
    try {
      const [ordersRes, quotesRes] = await Promise.all([
        fetch(`${serverUrl}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${serverUrl}/quote-requests/my`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }
      if (quotesRes.ok) {
        const data = await quotesRes.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "quote_requested":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
      case "quote_sent":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "quote_requested":
        return <Clock className="w-5 h-5" />;
      case "confirmed":
      case "quote_sent":
        return <CheckCircle className="w-5 h-5" />;
      case "delivered":
        return <Package className="w-5 h-5" />;
      case "cancelled":
      case "declined":
        return <XCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your orders.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders & Quotes</h1>

        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("quotes")}
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              tab === "quotes"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-600"
            }`}
          >
            Quote requests ({quotes.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`pb-3 px-1 font-medium border-b-2 transition-colors ${
              tab === "orders"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-600"
            }`}
          >
            Confirmed orders ({orders.length})
          </button>
        </div>

        {tab === "quotes" && (
          <>
            {quotes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No quote requests</h2>
                <p className="text-gray-600 mb-6">
                  Request a quote on a marketplace listing to start a conversation with a
                  producer on SeedLink.
                </p>
                <Link
                  to="/marketplace"
                  className="inline-flex bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.map((q) => (
                  <div key={q.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {getCategoryLabel(q.seed_category)}
                          {q.seed_variety ? ` · ${q.seed_variety}` : ""}
                        </h3>
                        <p className="text-sm text-gray-600">from {q.producer_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {q.quantity} kg ·{" "}
                          <Link
                            to={`/seed/${q.seed_id}`}
                            className="text-green-600 hover:underline"
                          >
                            View listing
                          </Link>
                        </p>
                      </div>
                      <span
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(q.status)}`}
                      >
                        {getStatusIcon(q.status)}
                        {q.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {expandedQuoteId === q.id && accessToken ? (
                      <QuoteThreadPanel
                        quote={q}
                        user={user}
                        accessToken={accessToken}
                        onUpdate={(updated) => {
                          setQuotes((prev) =>
                            prev.map((item) => (item.id === updated.id ? updated : item)),
                          );
                          fetchData();
                        }}
                        listedUnitPrice={q.listed_unit_price}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedQuoteId(expandedQuoteId === q.id ? null : q.id)
                        }
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        {expandedQuoteId === q.id ? "Hide" : "Open"} conversation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "orders" && (
          <>
            {orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
                <p className="text-gray-600 mb-6">
                  Confirm a producer quote to create an order on SeedLink.
                </p>
                <Link
                  to="/marketplace"
                  className="inline-flex bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{order.seed_name}</h3>
                        <p className="text-sm text-gray-600">from {order.producer_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Order ID: {order.id} ·{" "}
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-200 pt-4">
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <p className="font-medium text-gray-900">{order.quantity} kg</p>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-600">Total:</span>
                        <p className="font-bold text-green-600 text-lg">
                          {(order.total || 0).toLocaleString()} RWF
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
