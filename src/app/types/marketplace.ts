export interface MarketplaceSeed {
  id: string;
  variety: string;
  category?: string;
  producer_id: string;
  producer_name: string;
  location?: string | null;
  delivery_details?: string | null;
  price: number;
  unit?: string;
  minOrder?: number;
  available?: number;
  rating?: number | null;
  reviews?: number;
  certified?: boolean;
  images?: string[];
  image?: string;
  category?: string;
  description?: string;
  status?: string;
  created_at?: string;
}
