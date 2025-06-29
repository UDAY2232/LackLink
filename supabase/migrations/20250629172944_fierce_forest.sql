/*
  # Complete E-commerce Marketplace Schema

  1. New Tables
    - `users` - User profiles for both customers and retailers
    - `categories` - Product categories with hierarchy support
    - `products` - Product catalog with full specifications
    - `cart_items` - Shopping cart functionality
    - `orders` - Order management system
    - `order_items` - Order line items
    - `reviews` - Product reviews and ratings
    - `wishlists` - Customer wishlist functionality
    - `addresses` - User shipping addresses

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    - Secure user data and order information

  3. Features
    - Support for both customer and retailer roles
    - Inventory tracking and management
    - Order fulfillment workflow
    - Product ratings and reviews
    - Wishlist functionality
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'retailer')),
    avatar_url text,
    phone text,
    address text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    parent_id uuid REFERENCES categories(id),
    image_url text,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text NOT NULL,
    price decimal(10,2) NOT NULL,
    discount_price decimal(10,2),
    category_id uuid REFERENCES categories(id),
    subcategory text,
    brand text NOT NULL,
    images text[] DEFAULT '{}',
    stock_quantity integer DEFAULT 0,
    specifications jsonb DEFAULT '{}',
    retailer_id uuid REFERENCES users(id) NOT NULL,
    rating decimal(3,2) DEFAULT 0,
    review_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) NOT NULL,
    product_id uuid REFERENCES products(id) NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) NOT NULL,
    total_amount decimal(10,2) NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    shipping_address jsonb NOT NULL,
    payment_method text NOT NULL,
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) NOT NULL,
    product_id uuid REFERENCES products(id) NOT NULL,
    quantity integer NOT NULL,
    price decimal(10,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES products(id) NOT NULL,
    user_id uuid REFERENCES users(id) NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(product_id, user_id)
);

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) NOT NULL,
    product_id uuid REFERENCES products(id) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Addresses table
CREATE TABLE IF NOT EXISTS addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) NOT NULL,
    type text DEFAULT 'shipping' CHECK (type IN ('shipping', 'billing')),
    name text NOT NULL,
    phone text,
    address_line_1 text NOT NULL,
    address_line_2 text,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text DEFAULT 'US',
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Anyone can read retailer profiles" ON users
    FOR SELECT TO anon, authenticated
    USING (role = 'retailer');

-- Categories policies
CREATE POLICY "Anyone can read categories" ON categories
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

-- Products policies
CREATE POLICY "Anyone can read active products" ON products
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Retailers can manage own products" ON products
    FOR ALL TO authenticated
    USING (retailer_id = auth.uid());

-- Cart items policies
CREATE POLICY "Users can manage own cart" ON cart_items
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- Orders policies
CREATE POLICY "Users can read own orders" ON orders
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Retailers can read orders for their products" ON orders
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = orders.id AND p.retailer_id = auth.uid()
        )
    );

-- Order items policies
CREATE POLICY "Users can read own order items" ON order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
        )
    );

CREATE POLICY "Retailers can read order items for their products" ON order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM products p
            WHERE p.id = order_items.product_id AND p.retailer_id = auth.uid()
        )
    );

-- Reviews policies
CREATE POLICY "Anyone can read reviews" ON reviews
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Wishlists policies
CREATE POLICY "Users can manage own wishlist" ON wishlists
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- Addresses policies
CREATE POLICY "Users can manage own addresses" ON addresses
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_retailer ON products(retailer_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);

-- Insert sample categories
INSERT INTO categories (name, slug, image_url) VALUES
('Electronics', 'electronics', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg'),
('Fashion', 'fashion', 'https://images.pexels.com/photos/994517/pexels-photo-994517.jpeg'),
('Home & Garden', 'home-garden', 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg'),
('Sports & Fitness', 'sports-fitness', 'https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg'),
('Books', 'books', 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg'),
('Beauty & Health', 'beauty-health', 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg')
ON CONFLICT (slug) DO NOTHING;

-- Function to update product ratings
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
        )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update product ratings when reviews change
DROP TRIGGER IF EXISTS trigger_update_product_rating ON reviews;
CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();