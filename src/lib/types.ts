/** Pour chaque couleur d'un article : teinte de la pastille et photo associée. */
export type ColorOptions = Record<string, { hex?: string; image?: string }>;

/** Point relais choisi par la cliente (renvoyé par la carte Mondial Relay). */
export type Relay = {
  id: string;
  name: string;
  address: string;
  postcode: string;
  city: string;
  country: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cents: number;
  images: string[];
  sizes: string[];
  colors: string[];
  color_options: ColorOptions;
  category: string | null;
  stock: number;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  created_at: string;
};

export type OrderItem = {
  product_id: string | null;
  name: string;
  size: string | null;
  color?: string | null;
  quantity: number;
  unit_amount_cents: number;
};

export type Order = {
  id: string;
  stripe_session_id: string;
  email: string | null;
  customer_name: string | null;
  amount_total_cents: number;
  shipping_address: Record<string, string | null> | null;
  billing_address: Record<string, string | null> | null;
  items: OrderItem[];
  status: string;
  shipping_method: "relay" | "home" | null;
  relay: Relay | null;
  phone: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  /** Dates d'envoi des e-mails à la cliente. */
  notifications: Partial<
    Record<"shipped" | "delivered" | "refunded" | "cancelled" | "restocked", string>
  > | null;
  created_at: string;
};

export type ReturnRequest = {
  id: string;
  order_id: string;
  user_id: string | null;
  items: { product_id: string | null; name: string; quantity: number }[];
  reason: string;
  message: string | null;
  status: "en attente" | "acceptée" | "refusée";
  admin_note: string | null;
  created_at: string;
  decided_at: string | null;
};
