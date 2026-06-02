export type QuoteStatus =
  | "quote_requested"
  | "quote_sent"
  | "confirmed"
  | "declined";

export interface QuoteMessage {
  id: string;
  sender_id: string;
  sender_role: "buyer" | "producer";
  sender_name: string;
  body: string;
  created_at: string;
}

export interface ProducerQuoteOffer {
  unit_price: number;
  total: number;
  message?: string;
  sent_at: string;
}

export interface QuoteRequest {
  id: string;
  seed_id: string;
  producer_id: string;
  buyer_id: string;
  buyer_name: string;
  producer_name: string;
  seed_category?: string | null;
  seed_variety?: string | null;
  quantity: number;
  listed_unit_price: number;
  status: QuoteStatus;
  messages: QuoteMessage[];
  producer_quote: ProducerQuoteOffer | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
}
