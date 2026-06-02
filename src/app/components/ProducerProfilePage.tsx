import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, Star, MapPin, ShieldCheck, Phone, Mail } from "lucide-react";
import { serverUrl } from "../lib/supabase";

export function ProducerProfilePage() {
  const { id } = useParams();
  const { accessToken, user } = useAuth();
  const [producer, setProducer] = useState<any | null>(null);
  const [seeds, setSeeds] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducer = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const headers: Record<string, string> = {};
        if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

        const res = await fetch(`${serverUrl}/producers/${id}`, { headers });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load producer profile');
        }

        const data = await res.json();
        setProducer(data.producer || null);
        setSeeds(data.seeds || []);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Error fetching producer profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load producer profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProducer();
  }, [id, accessToken]);

  const handleSubmitReview = async () => {
    if (!accessToken) {
      alert('Please login to leave a review.');
      return;
    }
    if (!comment.trim()) {
      alert('Please enter your review comment.');
      return;
    }
    if (!id) return;

    setSubmitting(true);

    try {
      const response = await fetch(`${serverUrl}/producers/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      const data = await response.json();
      setComment("");
      setRating(5);
      setReviews((prev) => [data.review, ...prev]);
    } catch (err) {
      console.error('Review submit error:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = producer?.business_name || producer?.name || 'Producer';
  const averageRating = producer?.averageRating ?? (reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : null);
  const reviewCount = producer?.reviewCount ?? reviews.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading producer profile...</div>
    );
  }

  if (error || !producer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-red-600">{error || 'Producer profile not found.'}</p>
          <Link to="/marketplace" className="mt-4 inline-flex text-green-600 hover:underline">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === id;

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{displayName}</h1>
                  <p className="text-gray-600 mt-2">{producer.business_name ? 'Verified seed producer' : 'Seed producer on SeedLink'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-green-50 text-green-700 px-3 py-2 text-sm font-semibold">
                    {reviewCount} review{reviewCount === 1 ? '' : 's'}
                  </div>
                  <div className="rounded-full bg-yellow-50 text-yellow-800 px-3 py-2 text-sm font-semibold">
                    {averageRating ? averageRating.toFixed(1) : 'No rating yet'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm text-gray-600">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500">Joined</p>
                  <p className="font-medium text-gray-900">{new Date(producer.created_at).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500">Location</p>
                  <p className="font-medium text-gray-900">{producer.district || producer.address || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-500">Certifications</p>
                  <p className="font-medium text-gray-900">{producer.certificationBody || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">About the Producer</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Business name</p>
                  <p className="font-medium text-gray-900">{producer.business_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Owner name</p>
                  <p className="font-medium text-gray-900">{producer.name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{producer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{producer.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Seeds from {displayName}</h2>
              {seeds.length === 0 ? (
                <div className="text-gray-600">No active listings available yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {seeds.map((seed) => (
                    <Link
                      key={seed.id}
                      to={`/seed/${seed.id}`}
                      className="block border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden">
                          <img
                            src={(seed.images && seed.images.length > 0) ? seed.images[0] : (seed.image || '')}
                            alt={seed.variety || seed.name || 'Seed'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{seed.variety || seed.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{seed.location || 'Location unknown'}</p>
                          <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
                            <span>{seed.price?.toLocaleString() ?? 0} RWF/kg</span>
                            <span>{seed.available ?? 0} kg</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Ratings & Reviews</h2>
                <div className="text-sm text-gray-600">{reviewCount} review{reviewCount === 1 ? '' : 's'}</div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-gray-600">No reviews yet. Be the first to leave feedback.</div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{review.reviewer_name || 'Customer'}</p>
                          <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          {[...Array(review.rating || 0)].map((_, index) => (
                            <Star key={index} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="mt-3 text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  <span>{producer.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-600" />
                  <span>{producer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span>{producer.district || producer.address || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  <span>{producer.producer_verified ? 'Verified producer' : 'Not yet verified'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave a Review</h2>
              {isOwnProfile ? (
                <p className="text-sm text-gray-600">You cannot review your own profile.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <div className="mt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`rounded-full p-2 ${value <= rating ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comment</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="mt-2 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Share your experience with this producer..."
                    />
                  </div>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
