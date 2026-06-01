import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { serverUrl } from "../lib/supabase";
import { Package, Clock, CheckCircle, XCircle } from "lucide-react";

interface Order {
  id: string;
  seed_name: string;
  producer_name: string;
  quantity: number;
  total: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at: string;
}

export function MyOrdersPage() {
  const { user, accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      fetchOrders();
    }
  }, [accessToken]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${serverUrl}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'confirmed': return <CheckCircle className="w-5 h-5" />;
      case 'delivered': return <Package className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      default: return null;
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
        <p className="text-gray-600">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">Start browsing the marketplace to place your first order.</p>
            <a
              href="/marketplace"
              className="inline-flex bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Marketplace
            </a>
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
                      Order ID: {order.id} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
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
                    <p className="font-bold text-green-600 text-lg">{order.total.toLocaleString()} RWF</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
