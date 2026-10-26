/** Response and request shapes, mirroring `components.schemas` in /openapi.json. */

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  birthDate: string;
  country: string;
  newsletter: boolean;
  isDemo: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate: string;
  country: string;
  password: string;
  newsletter?: boolean;
}

export interface LoginResponse {
  token: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: User;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  reviewsCount: number;
  stock: number;
  image: string;
  hue: number;
  description: string;
  specs: Record<string, string>;
  variants: { sizes?: string[]; colors?: string[] };
}

export interface ProductList {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
}

export interface Promo {
  code: string;
  type: 'percent' | 'shipping';
  value?: number;
  min?: number;
  label: string;
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  vat: number;
  promoCode: string | null;
  promoValid: boolean;
  promoNote: string;
  freeShippingLeft: number;
  shippingMethod: string;
}

export interface CartItem {
  id: number;
  productId: string;
  name: string;
  price: number;
  stock: number;
  size: string | null;
  color: string | null;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  items: CartItem[];
  itemCount: number;
  promo: Promo | null;
  totals: Totals;
}

export interface AddCartItemRequest {
  productId: string;
  quantity?: number;
  size?: string;
  color?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  postal: string;
  notes?: string;
}

export type DeliveryMethod = 'courier' | 'parcel' | 'pickup';
export type PaymentMethod = 'card' | 'bank' | 'cash';

export interface OrderRequest {
  address: Address;
  delivery: { method: DeliveryMethod; location?: string };
  payment: {
    method: PaymentMethod;
    card?: { holder: string; number: string; expiry: string; cvc: string };
    bank?: string;
  };
}

export interface Order {
  id: string;
  status: 'processing' | 'cancelled';
  statusLabel: string;
  createdAt: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size: string | null;
    color: string | null;
  }[];
  totals: Totals;
  address: Address;
  delivery: { method: DeliveryMethod; label: string; eta: string; location?: string };
  payment: { method: PaymentMethod; last4?: string; bank?: string };
}

export interface Review {
  id: number;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface ContactMessageRequest {
  name: string;
  email: string;
  topic: 'order' | 'return' | 'account' | 'other';
  orderNumber?: string;
  message: string;
  sendCopy?: boolean;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: Record<string, string> };
}
