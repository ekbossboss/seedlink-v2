import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { MapPin, Star, ShieldCheck, Truck, ArrowLeft, Minus, Plus, FileText } from "lucide-react";
import { serverUrl } from "../lib/supabase";
import { getSeedCategoryLabel, getSeedFeatures } from "../lib/seedCategories";
import { QuoteThreadPanel } from "./QuoteThreadPanel";
import type { QuoteRequest } from "../types/quotes";

type ProducerReview = {
  id: string;
  reviewer_name?: string;
  rating?: number;
  comment?: string;
  created_at?: string;
};

type SeedListing = {
  id: string;
  variety?: string;
  category?: string;
  producer_id: string;
  producer_name?: string;
  location?: string | null;
  delivery_details?: string | null;
  price?: number;
  unit?: string;
  minOrder?: number;
  available?: number;
  description?: string;
  features?: string[];
  keyFeatures?: string[];
  images?: string[];
  image?: string;
  certified?: boolean;
  producerRating?: number | null;
  producerReviews?: ProducerReview[];
  producerInfo?: {
    name?: string;
    email?: string;
    phone?: string | null;
    certifications?: string[];
    since?: string;
    location?: string | null;
  };
};

export function SeedDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();
  const [seed, setSeed] = useState<SeedListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(50);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quote, setQuote] = useState<QuoteRequest | null>(null);
  const [quoteNote, setQuoteNote] = useState("");
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  useEffect(() => {
    const fetchSeed = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        const res = await fetch(`${serverUrl}/seeds/${id}`, { headers });
        if (!res.ok) throw new Error("Failed to load seed");
        const data = await res.json();
        const listing = data.seed as SeedListing | null;
        setSeed(listing);
        if (listing?.minOrder) {
          setQuantity(Math.max(listing.minOrder, 50));
        }
        setSelectedImage(0);
      } catch (err) {
        console.error("Error fetching seed:", err);
        setSeed(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSeed();
  }, [id, accessToken]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id || !accessToken || !user) {
        setQuote(null);
        return;
      }
      try {
        const res = await fetch(`${serverUrl}/quote-requests/seed/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setQuote(data.quote || null);
        }
      } catch {
        setQuote(null);
      }
    };
    fetchQuote();
  }, [id, accessToken, user]);

  const categoryLabel = getSeedCategoryLabel(seed?.category);
  const featureList = useMemo(
    () => (seed ? getSeedFeatures(seed) : []),
    [seed],
  );
  const images = useMemo(() => {
    if (!seed) return [] as string[];
    if (seed.images?.length) return seed.images;
    if (seed.image) return [seed.image];
    return [];
  }, [seed]);

  const reviews: ProducerReview[] = Array.isArray(seed?.producerReviews)
    ? seed.producerReviews
    : [];
  const producerDisplayName =
    seed?.producer_name || seed?.producerInfo?.name || "Producer";
  const certificationList = Array.isArray(seed?.producerInfo?.certifications)
    ? seed.producerInfo.certifications
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading listing...
      </div>
    );
  }

  if (!seed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 font-medium mb-2">Listing not found</p>
          <Link to="/marketplace" className="text-green-600 hover:text-green-700">
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  const minOrder = seed.minOrder ?? 1;
  const total = quantity * (seed.price || 0);
  const isOwnListing = user?.id === seed.producer_id;
  const canRequestQuote = !!user && !isOwnListing;

  const submitQuoteRequest = async () => {
    if (!accessToken || !seed) return;
    if (!user) {
      navigate("/login");
      return;
    }
    setQuoteBusy(true);
    setQuoteError(null);
    try {
      const res = await fetch(`${serverUrl}/quote-requests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seed_id: seed.id,
          quantity,
          message: quoteNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to request quote");
      setQuote(data.quote);
      setShowQuoteForm(false);
      setQuoteNote("");
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Failed to request quote");
    } finally {
      setQuoteBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/marketplace"
            className="flex items-center gap-2 text-gray-600 hover:text-green-600"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="bg-white rounded-lg overflow-hidden mb-4">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={categoryLabel}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center bg-gray-100 text-gray-400">
                  No photos provided
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? "border-green-600" : "border-gray-200"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${categoryLabel} ${idx + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{categoryLabel}</h1>
                {seed.variety && (
                  <p className="text-lg text-gray-600 mt-1">Variety: {seed.variety}</p>
                )}
                <Link
                  to={`/producer/${seed.producer_id}`}
                  className="text-green-600 hover:text-green-700 font-medium mt-2 inline-block"
                >
                  {producerDisplayName}
                </Link>
              </div>
              {seed.certified && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1 text-sm shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                  Approved producer
                </div>
              )}
            </div>

            <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 text-sm text-gray-700">
              {seed.producerRating != null && (
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{seed.producerRating.toFixed(1)}</span>
                  <span className="text-gray-500">
                    ({reviews.length} producer review{reviews.length === 1 ? "" : "s"})
                  </span>
                </div>
              )}
              {seed.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{seed.location}</span>
                </div>
              )}
              {seed.delivery_details && (
                <div className="flex items-start gap-2">
                  <Truck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{seed.delivery_details}</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="text-4xl font-bold text-green-600 mb-1">
                {(seed.price ?? 0).toLocaleString()} RWF
              </div>
              <div className="text-gray-600">per {seed.unit || "kg"}</div>
              <div className="text-sm text-gray-500 mt-2">
                Available: {(seed.available ?? 0).toLocaleString()} kg • Min. order:{" "}
                {seed.minOrder ?? "N/A"} kg
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quantity (kg)
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(minOrder, quantity - 10))}
                  className="bg-white border border-gray-300 p-2 rounded-lg hover:bg-gray-100"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(minOrder, parseInt(e.target.value, 10) || minOrder))
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center"
                  min={minOrder}
                />
                <button
                  type="button"
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

            {quote && user && accessToken ? (
              <QuoteThreadPanel
                quote={quote}
                user={user}
                accessToken={accessToken}
                onUpdate={setQuote}
                listedUnitPrice={seed.price}
              />
            ) : (
              <>
                {canRequestQuote && (
                  <>
                    {!showQuoteForm ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            navigate("/login");
                            return;
                          }
                          setShowQuoteForm(true);
                        }}
                        className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors mb-3 flex items-center justify-center gap-2 font-medium"
                      >
                        <FileText className="w-5 h-5" />
                        Request Quote
                      </button>
                    ) : (
                      <div className="mb-4 p-4 border border-green-200 rounded-lg bg-green-50">
                        <p className="text-sm text-gray-700 mb-3">
                          Request a quote for <strong>{quantity} kg</strong>. The producer
                          will respond on SeedLink; you can confirm your order here once
                          you agree on terms.
                        </p>
                        <textarea
                          value={quoteNote}
                          onChange={(e) => setQuoteNote(e.target.value)}
                          placeholder="Optional: delivery location, timing, questions..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
                          disabled={quoteBusy}
                        />
                        {quoteError && (
                          <p className="text-sm text-red-600 mb-2">{quoteError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={submitQuoteRequest}
                            disabled={quoteBusy}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                          >
                            {quoteBusy ? "Sending..." : "Submit quote request"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowQuoteForm(false)}
                            disabled={quoteBusy}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 text-center mb-4">
                      Estimated at list price: {total.toLocaleString()} RWF (final price
                      from producer)
                    </p>
                  </>
                )}
                {!user && (
                  <Link
                    to="/login"
                    className="w-full block text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors mb-3 font-medium"
                  >
                    Sign in to request a quote
                  </Link>
                )}
                {isOwnListing && (
                  <p className="text-sm text-gray-600 text-center mb-4">
                    This is your listing. Manage it from your{" "}
                    <Link to="/producer/dashboard" className="text-green-600 hover:underline">
                      producer dashboard
                    </Link>
                    .
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Listing details</h2>
                <Link
                  to={`/producer/${seed.producer_id}`}
                  className="text-green-600 font-medium hover:underline text-sm"
                >
                  View producer profile
                </Link>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <dt className="text-gray-500">Seed category</dt>
                  <dd className="font-medium text-gray-900">{categoryLabel}</dd>
                </div>
                {seed.variety && (
                  <div>
                    <dt className="text-gray-500">Variety</dt>
                    <dd className="font-medium text-gray-900">{seed.variety}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Producer</dt>
                  <dd className="font-medium text-gray-900">{producerDisplayName}</dd>
                </div>
                {seed.location && (
                  <div>
                    <dt className="text-gray-500">Seed location</dt>
                    <dd className="font-medium text-gray-900">{seed.location}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Price</dt>
                  <dd className="font-medium text-gray-900">
                    {(seed.price ?? 0).toLocaleString()} RWF / {seed.unit || "kg"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Available stock</dt>
                  <dd className="font-medium text-gray-900">
                    {(seed.available ?? 0).toLocaleString()} kg
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Minimum order</dt>
                  <dd className="font-medium text-gray-900">{seed.minOrder ?? "N/A"} kg</dd>
                </div>
              </dl>

              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 mb-6 whitespace-pre-wrap">
                {seed.description?.trim() || "No description provided by the producer."}
              </p>

              <h3 className="font-semibold text-gray-900 mb-3">Key features</h3>
              {featureList.length > 0 ? (
                <ul className="space-y-2">
                  {featureList.map((feature, idx) => (
                    <li key={`${feature}-${idx}`} className="flex items-start gap-2">
                      <div className="bg-green-600 rounded-full p-0.5 mt-1">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No key features listed.</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Producer reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet for this producer.</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-200 pb-6 last:border-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-gray-600">
                              {review.reviewer_name?.charAt(0) ?? "B"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.reviewer_name || "Buyer"}
                            </p>
                            {review.created_at && (
                              <p className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating || 0)].map((_, i) => (
                            <Star
                              key={i}
                              className="w-4 h-4 fill-yellow-400 text-yellow-400"
                            />
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Producer</h2>

              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {producerDisplayName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    <Link
                      to={`/producer/${seed.producer_id}`}
                      className="hover:underline"
                    >
                      {producerDisplayName}
                    </Link>
                  </h3>
                  {seed.producerRating != null && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{seed.producerRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                {seed.producerInfo?.since && (
                  <div>
                    <span className="text-gray-600">Member since</span>
                    <p className="font-medium text-gray-900">
                      {new Date(seed.producerInfo.since).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {certificationList.length > 0 && (
                  <div>
                    <span className="text-gray-600">Certifications</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {certificationList.map((cert, idx) => (
                        <span
                          key={idx}
                          className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Use <strong>Request Quote</strong> to message this producer on SeedLink.
                Quotes and orders stay on the platform so both sides have a clear record.
              </p>

              {seed.delivery_details && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <Truck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{seed.delivery_details}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
