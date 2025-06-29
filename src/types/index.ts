export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'retailer';
  avatar_url?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  category: string;
  subcategory?: string;
  brand: string;
  images: string[];
  stock_quantity: number;
  specifications: Record<string, string>;
  retailer_id: string;
  retailer?: User;
  rating: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: string;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed';
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  price: number;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  user?: User;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  subcategories?: Category[];
}