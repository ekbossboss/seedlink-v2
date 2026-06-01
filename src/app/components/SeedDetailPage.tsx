import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { MapPin, Star, ShieldCheck, Truck, Phone, Mail, ArrowLeft, Minus, Plus } from "lucide-react";
import { serverUrl } from "../lib/supabase";

export function SeedDetailPage() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(50);
  const [seed, setSeed] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeed = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${serverUrl}/seeds/${id}`);
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
  }, [id]);

  const reviews = [
    {
      id: 1,
      author: "Jean Baptiste",
      rating: 5,
      date: "2026-05-15",
      comment: "Excellent quality seeds. Very high germination rate and the yield was impressive.",
    },
    {
      id: 2,
      author: "Alice Mukamana",
      rating: 5,
      date: "2026-05-10",
      comment: "Great service and quality seeds. The producer was very helpful with planting guidance.",
    },
    {
      id: 3,
      author: "David Niyonzima",
      rating: 4,
      date: "2026-05-05",
      comment: "Good seeds, delivered on time. Would order again.",
    },
  ];

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{seed.name}</h1>
                <p className="text-lg text-gray-600">{seed.variety} Variety</p>
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
                <span className="font-semibold">{seed.rating}</span>
                <span className="text-gray-500">({seed.reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{seed.location}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-4xl font-bold text-green-600 mb-1">
                {seed.price.toLocaleString()} RWF
              </div>
              <div className="text-gray-600">per {seed.unit}</div>
              <div className="text-sm text-gray-500 mt-2">
                Available: {seed.available.toLocaleString()} kg • Min. order: {seed.minOrder} kg
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quantity (kg)
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(seed.minOrder, quantity - 10))}
                  className="bg-white border border-gray-300 p-2 rounded-lg hover:bg-gray-100"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(seed.minOrder, parseInt(e.target.value) || seed.minOrder))}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center"
                  min={seed.minOrder}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 mb-6">{seed.description}</p>

              <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
              <ul className="space-y-2">
                {seed.features.map((feature, idx) => (
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
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-gray-600">
                            {review.author.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{review.author}</p>
                          <p className="text-sm text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Producer Information</h2>

              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {seed.producerInfo.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{seed.producerInfo.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{seed.producerRating}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="text-sm">
                  <span className="text-gray-600">Member since:</span>
                  <p className="font-medium text-gray-900">{seed.producerInfo.since}</p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Certifications:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {seed.producerInfo.certifications.map((cert, idx) => (
                      <span
                        key={idx}
                        className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={`tel:${seed.producerInfo.phone}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-green-600"
                >
                  <Phone className="w-5 h-5" />
                  <span>{seed.producerInfo.phone}</span>
                </a>
                <a
                  href={`mailto:${seed.producerInfo.email}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-green-600"
                >
                  <Mail className="w-5 h-5" />
                  <span>{seed.producerInfo.email}</span>
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
