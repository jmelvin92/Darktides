import { useState, useEffect } from 'react';
import { productService, type ProductDisplay } from '../lib/services/ProductService';

export function useProducts() {
  const [products, setProducts] = useState<ProductDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getProducts();
        setProducts(data);
        setError(null);

        // Subscribe to real-time updates
        unsubscribe = productService.subscribeToUpdates((updatedProducts) => {
          setProducts(updatedProducts);
        });
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Unable to load products');
        // Use fallback products
        const fallback = await productService.getProducts();
        setProducts(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { products, loading, error };
}