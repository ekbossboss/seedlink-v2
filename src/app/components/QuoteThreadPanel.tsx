import { useState } from "react";
import { Link } from "react-router";
import { MessageSquare, Send } from "lucide-react";
import { serverUrl } from "../lib/supabase";
import type { QuoteRequest } from "../types/quotes";
import { getSeedCategoryLabel } from "../lib/seedCategories";

type AuthUser = {
  id: string;
  name: string;
  role: string;
};

interface QuoteThreadPanelProps {
  quote: QuoteRequest;
  user: AuthUser;
  accessToken: string;
  onUpdate: (quote: QuoteRequest) => void;
  listedUnitPrice?: number;
}

const statusLabel: Record<string, string> = {
  quote_requested: "Awaiting producer quote",
  quote_sent: "Quote received — confirm to order",
  confirmed: "Order confirmed on SeedLink",
  declined: "Closed",
};

export function QuoteThreadPanel({
  quote,
  user,
  accessToken,
  onUpdate,
  listedUnitPrice,
}: QuoteThreadPanelProps) {
  const [message, setMessage] = useState("");
  const [unitPrice, setUnitPrice] = useState(
    quote.producer_quote?.unit_price?.toString() ||
      listedUnitPrice?.toString() ||
      "",
  );
  const [producerNote, setProducerNote] = useState(quote.producer_quote?.message || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBuyer = user.id === quote.buyer_id;
  const isProducer = user.id === quote.producer_id;
  const listingLabel = getSeedCategoryLabel(quote.seed_category);

  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/quote-requests/${quote.id}/messages`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ body: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      setMessage("");
      onUpdate(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setBusy(false);
    }
  };

  const sendProducerQuote = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/quote-requests/${quote.id}/respond`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          unit_price: parseFloat(unitPrice),
          message: producerNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send quote");
      onUpdate(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send quote");
    } finally {
      setBusy(false);
    }
  };

  const confirmOrder = async () => {
    if (!confirm("Confirm this order on SeedLink?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/quote-requests/${quote.id}/confirm`, {
        method: "PUT",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm order");
      onUpdate(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setBusy(false);
    }
  };

  const declineQuote = async () => {
    if (!confirm("Close this quote request?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${serverUrl}/quote-requests/${quote.id}/decline`, {
        method: "PUT",
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close quote");
      onUpdate(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close quote");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 border border-green-200 rounded-lg bg-green-50/50 p-4">
      <div className="flex items-start gap-2 mb-3">
        <MessageSquare className="w-5 h-5 text-green-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-gray-900">SeedLink quote conversation</h3>
          <p className="text-sm text-gray-600">
            {listingLabel}
            {quote.seed_variety ? ` · ${quote.seed_variety}` : ""} · {quote.quantity} kg
          </p>
          <p className="text-xs text-green-800 mt-1 font-medium">
            {statusLabel[quote.status] || quote.status}
          </p>
        </div>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-3 mb-4 bg-white rounded-lg p-3 border border-gray-100">
        {quote.messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm ${
              msg.sender_id === user.id ? "text-right" : "text-left"
            }`}
          >
            <p className="text-xs text-gray-500 mb-0.5">
              {msg.sender_name} · {msg.sender_role} ·{" "}
              {new Date(msg.created_at).toLocaleString()}
            </p>
            <p
              className={`inline-block px-3 py-2 rounded-lg ${
                msg.sender_id === user.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {msg.body}
            </p>
          </div>
        ))}
      </div>

      {quote.producer_quote && (
        <div className="bg-white border border-green-200 rounded-lg p-3 mb-4 text-sm">
          <p className="font-semibold text-gray-900">Producer quote</p>
          <p className="text-green-700 font-bold text-lg mt-1">
            {quote.producer_quote.unit_price.toLocaleString()} RWF/kg ·{" "}
            {quote.producer_quote.total.toLocaleString()} RWF total
          </p>
          {quote.producer_quote.message && (
            <p className="text-gray-600 mt-2">{quote.producer_quote.message}</p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      {quote.status !== "confirmed" && quote.status !== "declined" && (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message on SeedLink..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              disabled={busy}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={busy || !message.trim()}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-1"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {isProducer && quote.status === "quote_requested" && (
            <div className="border-t border-green-200 pt-3 space-y-2">
              <p className="text-sm font-medium text-gray-900">Send your quote</p>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Price per kg (RWF)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={busy}
              />
              <textarea
                value={producerNote}
                onChange={(e) => setProducerNote(e.target.value)}
                placeholder="Delivery terms, availability, notes..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={busy}
              />
              <button
                type="button"
                onClick={sendProducerQuote}
                disabled={busy || !unitPrice}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
              >
                Send quote to buyer
              </button>
            </div>
          )}

          {isProducer && quote.status === "quote_sent" && (
            <button
              type="button"
              onClick={sendProducerQuote}
              disabled={busy || !unitPrice}
              className="w-full mb-2 bg-white border border-green-600 text-green-700 py-2 rounded-lg hover:bg-green-50 text-sm"
            >
              Update quote
            </button>
          )}

          {isBuyer && quote.status === "quote_sent" && quote.producer_quote && (
            <button
              type="button"
              onClick={confirmOrder}
              disabled={busy}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium mb-2"
            >
              Confirm order on SeedLink
            </button>
          )}

          <button
            type="button"
            onClick={declineQuote}
            disabled={busy}
            className="w-full text-sm text-gray-600 hover:text-red-600 py-1"
          >
            Close quote request
          </button>
        </>
      )}

      {quote.status === "confirmed" && quote.order_id && (
        <Link
          to="/my-orders"
          className="block text-center text-sm text-green-700 font-medium hover:underline mt-2"
        >
          View order in My Orders →
        </Link>
      )}
    </div>
  );
}
