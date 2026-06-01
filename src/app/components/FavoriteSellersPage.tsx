import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { serverUrl } from "../lib/supabase";
import { Heart, Star, MapPin, Trash2 } from "lucide-react";
import { Link } from "react-router";

interface Producer {
  id: string;
  name: string;
  business_name?: string;
  email: string;
  location?: string;
  rating?: number;
  total_sales?: number;
}

interface Favorite {
  id: string;
  producer_id: string;
  created_at: string;
  producer?: Producer;
}

export function FavoriteSellersPage() {
  const { user, accessToken } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      fetchFavorites();
    }
  }, [accessToken]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${serverUrl}/favorites`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites);

        // Fetch producer details for each favorite
        const producerPromises = data.favorites.map((fav: Favorite) =>
          fetch(`${serverUrl}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }).then(res => res.json())
        );

        const producerData = await Promise.all(producerPromises);
        setProducers(producerData.map(d => d.profile));
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (producerId: string) => {
    try {
      const response = await fetch(`${serverUrl}/favorites/${producerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setFavorites(favorites.filter(f => f.producer_id !== producerId));
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your favorite sellers.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Favorite Sellers</h1>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No favorite sellers yet</h2>
            <p className="text-gray-600 mb-6">Browse the marketplace and save your favorite producers.</p>
            <Link
              to="/marketplace"
              className="inline-flex bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite, index) => {
              const producer = producers[index];
              return (
                <div key={favorite.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {producer?.business_name?.charAt(0) || producer?.name?.charAt(0) || 'P'}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFavorite(favorite.producer_id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {producer?.business_name || producer?.name || 'Producer'}
                  </h3>

                  {producer?.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{producer.location}</span>
                    </div>
                  )}

                  {producer?.rating && (
                    <div className="flex items-center gap-1 mb-4">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{producer.rating}</span>
                    </div>
                  )}

                  <Link
                    to={`/marketplace`}
                    className="block text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Seeds
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
