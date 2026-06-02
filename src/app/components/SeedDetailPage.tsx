import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { MapPin, Star, ShieldCheck, Truck, Phone, Mail, ArrowLeft, Minus, Plus } from "lucide-react";
import { serverUrl } from "../lib/supabase";

export function SeedDetailPage() {
  const { id } = useParams();
  const { accessToken } = useAuth();
  const [quantity, setQuantity] = useState(50);
  const [seed, setSeed] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  type ProducerReview = {
    id: string;
    reviewer_name?: string;
    rating?: number;
    comment?: string;
    created_at?: string;
  };

  const reviews: ProducerReview[] = Array.isArray(seed?.producerReviews)
    ? (seed.producerReviews as ProducerReview[])
    : [];
  const featureList = Array.isArray(seed?.features) ? (seed.features as string[]) : [];
  const certificationList = Array.isArray(seed?.producerInfo?.certifications)
    ? (seed.producerInfo.certifications as string[])
    : [];

  useEffect(() => {
    const fetchSeed = async () => {
      try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
        const res = await fetch(`${serverUrl}/seeds/${id}`, { headers });
        if (!res.ok) throw new Error('Failed to load seed');
        const data = await res.json();
        setSeed(data.seed || null);
      } catch (err) {
        console.error('Error fetching seed:', err);
        setSeed(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchSeed();
  }, [id, accessToken]);

  const [selectedImage, setSelectedImage] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading seed...</div>
    );
  }

  if (!seed) {
    return (
      <div className="min-h-screen flex items-center justify-center">Seed not found</div>
    );
  }

  const minOrder = seed?.minOrder ?? 1;
  const total = quantity * (seed.price || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/marketplace" className="flex items-center gap-2 text-gray-600 hover:text-green-600">
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="bg-white rounded-lg overflow-hidden mb-4">
              <img
                src={(seed.images && seed.images.length > 0) ? seed.images[selectedImage] : (seed.image || '')}
                alt={seed.name}
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {((seed.images && seed.images.length > 0) ? seed.images : (seed.image ? [seed.image] : [])).map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`rounded-lg overflow-hidden border-2 ${
                    selectedImage === idx ? "border-green-600" : "border-gray-200"
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{seed.name || seed.variety || 'Seed'}</h1>
                <p className="text-lg text-gray-600">{seed.variety ? `${seed.variety} Variety` : 'Variety'}</p>
              </div>
              {seed.certified && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1 text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  Certified
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{seed.producerRating?.toFixed(1) ?? seed.rating ?? 'N/A'}</span>
                <span className="text-gray-500">({seed.producerReviews?.length ?? seed.reviews ?? 0} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{seed.location ?? seed.producerInfo?.location ?? 'Location unavailable'}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-4xl font-bold text-green-600 mb-1">
                {(seed.price ?? 0).toLocaleString()} RWF
              </div>
              <div className="text-gray-600">per {seed.unit || 'kg'}</div>
              <div className="text-sm text-gray-500 mt-2">
                Available: {(seed.available ?? 0).toLocaleString()} kg • Min. order: {seed.minOrder ?? 'N/A'} kg
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quantity (kg)
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(minOrder, quantity - 10))}
                  className="bg-white border border-gray-300 p-2 rounded-lg hover:bg-gray-100"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(minOrder, parseInt(e.target.value) || minOrder))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center"
                  min={minOrder}
                />
                <button
                  onClick={() => setQuantity(quantity + 10)}
                  className="bg-white border border-gray-300 p-2 rounded-lg hover:bg-gray-100"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 text-lg font-semibold text-gray-900">
                Total: {total.toLocaleString()} RWF
              </div>
            </div>

            <button className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors mb-3">
              Place Order
            </button>
            <button className="w-full bg-white text-gray-700 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              Contact Producer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Description</h2>
                  <p className="text-sm text-gray-500 mt-1">Real seed details and producer information below.</p>
                </div>
                <Link to={`/producer/${seed.producer_id}`} className="text-green-600 font-medium hover:underline">
                  View producer profile
                </Link>
              </div>
              <p className="text-gray-700 mb-6">{seed.description}</p>

              <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {featureList.map((feature: any, idx: any) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="bg-green-600 rounded-full p-0.5 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet for this producer.</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-gray-600">
                              {review.reviewer_name?.charAt(0) ?? 'B'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{review.reviewer_name || 'Buyer'}</p>
                            <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating || 0)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Producer Information</h2>

              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                  <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {seed.producerInfo?.name ? seed.producerInfo.name.charAt(0) : '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      <Link to={`/producer/${seed.producer_id}`} className="hover:underline">
                        {seed.producerInfo?.name ?? 'Producer'}
                      </Link>
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{seed.producerRating ? seed.producerRating.toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="text-sm">
                  <span className="text-gray-600">Member since:</span>
                  <p className="font-medium text-gray-900">
                    {seed.producerInfo?.since ? new Date(seed.producerInfo.since).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Certifications:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {certificationList.length === 0 ? (
                      <span className="text-gray-500">None available</span>
                    ) : (
                      certificationList.map((cert: any, idx: any) => (
                        <span
                          key={idx}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                        >
                          {cert}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={seed.producerInfo?.phone ? `tel:${seed.producerInfo.phone}` : '#'}
                  className="flex items-center gap-2 text-gray-700 hover:text-green-600"
                >
                  <Phone className="w-5 h-5" />
                  <span>{seed.producerInfo?.phone ?? 'N/A'}</span>
                </a>
                <a
                  href={seed.producerInfo?.email ? `mailto:${seed.producerInfo.email}` : '#'}
                  className="flex items-center gap-2 text-gray-700 hover:text-green-600"
                >
                  <Mail className="w-5 h-5" />
                  <span>{seed.producerInfo?.email ?? 'N/A'}</span>
                </a>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Truck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>Delivery available across Rwanda. Contact producer for delivery terms.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
