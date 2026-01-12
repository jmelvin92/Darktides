import { supabase } from '../supabase/client';
import type { Product } from '../supabase/database.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ProductDisplay {
  id: string;
  name: string;
  shortName: string;
  dosage: string;
  price: number;
  oldPrice: number;
  sku: string;
  description: string;
  stockQuantity: number;
}

class ProductService {
  private realtimeChannel: RealtimeChannel | null = null;
  private subscribers: Set<(products: ProductDisplay[]) => void> = new Set();

  async getProducts(): Promise<ProductDisplay[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching products:', error);
        return this.getFallbackProducts();
      }

      const products = (data || []).map(this.mapToDisplayProduct);
      return products;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      return this.getFallbackProducts();
    }
  }

  private mapToDisplayProduct(product: Product): ProductDisplay {
    return {
      id: product.id,
      name: product.name,
      shortName: product.short_name || product.name,
      dosage: product.dosage || '',
      price: Number(product.price),
      oldPrice: Number(product.old_price || product.price),
      sku: product.sku,
      description: product.description || '',
      stockQuantity: product.stock_quantity
    };
  }

  private getFallbackProducts(): ProductDisplay[] {
    // Fallback to hardcoded products if Supabase is unavailable
    return [
      {
        id: 'glp3-10',
        name: 'GLP-3 (RT) 10mg',
        shortName: 'GLP-3',
        dosage: '10 MG',
        price: 40.00,
        oldPrice: 75.00,
        sku: 'DT-GLP3-010',
        description: 'GLP-3 is an investigational peptide and triple receptor agonist (GLP-1, GIP, and glucagon) studied for its potential role in metabolic regulation, including glucose balance, energy expenditure, and weight management pathways. For research use only.',
        stockQuantity: 50
      },
      {
        id: 'glp3-20',
        name: 'GLP-3 (RT) 20mg',
        shortName: 'GLP-3',
        dosage: '20 MG',
        price: 80.00,
        oldPrice: 145.00,
        sku: 'DT-GLP3-020',
        description: 'GLP-3 is an investigational peptide and triple receptor agonist (GLP-1, GIP, and glucagon) studied for its potential role in metabolic regulation, including glucose balance, energy expenditure, and weight management pathways. For research use only.',
        stockQuantity: 30
      },
      {
        id: 'ghkcu-100',
        name: 'GHK-Cu 100MG',
        shortName: 'GHK-Cu',
        dosage: '100 MG',
        price: 30.00,
        oldPrice: 45.00,
        sku: 'DT-GHKC-100',
        description: 'GHK-Cu is a copper peptide studied in research for its role in tissue repair, wound healing, and regenerative processes. For research use only.',
        stockQuantity: 100
      },
      {
        id: 'motsc-10',
        name: 'MOTS-C 10 MG',
        shortName: 'MOTS-C',
        dosage: '10 MG',
        price: 30.00,
        oldPrice: 45.00,
        sku: 'DT-MOTS-010',
        description: 'MOTS-C is a mitochondrial-derived peptide studied for its potential role in supporting metabolism, energy regulation, and overall cellular health. For research use only.',
        stockQuantity: 75
      }
    ];
  }

  subscribeToUpdates(callback: (products: ProductDisplay[]) => void): () => void {
    this.subscribers.add(callback);
    
    // Start real-time subscription if not already active
    if (!this.realtimeChannel) {
      this.startRealtimeSubscription();
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0 && this.realtimeChannel) {
        this.stopRealtimeSubscription();
      }
    };
  }

  private async startRealtimeSubscription() {
    try {
      this.realtimeChannel = supabase
        .channel('product-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products'
          },
          async () => {
            // Refetch products when any change occurs
            const products = await this.getProducts();
            this.notifySubscribers(products);
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Failed to start realtime subscription:', error);
    }
  }

  private stopRealtimeSubscription() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  private notifySubscribers(products: ProductDisplay[]) {
    this.subscribers.forEach(callback => callback(products));
  }

  async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('products')
        .insert({
          ...product,
          id: `${product.sku.toLowerCase()}-${Date.now()}`
        } as any) as any);

      if (error) {
        console.error('Error adding product:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to add product:', error);
      return false;
    }
  }

  async updateStock(productId: string, newQuantity: number): Promise<boolean> {
    try {
      const { error } = await ((supabase
        .from('products') as any)
        .update({ 
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId));

      if (error) {
        console.error('Error updating stock:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update stock:', error);
      return false;
    }
  }
}

export const productService = new ProductService();