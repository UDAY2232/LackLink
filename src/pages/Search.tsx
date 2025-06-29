import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import ProductGrid from '../components/Product/ProductGrid';

const Search: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      searchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [query]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          retailer:users(name)
        `)
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
        .order('rating', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <SearchIcon className="h-6 w-6 text-gray-400" />
          <h1 className="text-3xl font-bold text-gray-900">
            {query ? `Search results for "${query}"` : 'Search Products'}
          </h1>
        </div>
        
        {query && (
          <p className="text-gray-600">
            Found {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {query ? (
        <ProductGrid products={products} loading={loading} />
      ) : (
        <div className="text-center py-12">
          <SearchIcon className="h-24 w-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-xl font-medium text-gray-600 mb-2">
            Search for products
          </h2>
          <p className="text-gray-500">
            Use the search bar above to find products you're looking for.
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;