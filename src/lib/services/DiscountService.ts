import { supabase } from '../supabase/client';

export interface DiscountCode {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface DiscountStats {
  total_usage: number;
  total_revenue: number;
  total_discounts: number;
}

class DiscountService {
  async getAllDiscountCodes(): Promise<DiscountCode[]> {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching discount codes:', error);
      return [];
    }
  }

  async addDiscountCode(
    code: string,
    description: string,
    type: 'percentage' | 'fixed',
    value: number
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .insert({
          code: code.toUpperCase(),
          description,
          discount_type: type,
          discount_value: value,
          is_active: true
        });

      if (error) {
        if (error.code === '23505') {
          return { success: false, message: 'This code already exists' };
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error adding discount code:', error);
      return { success: false, message: 'Failed to add discount code' };
    }
  }

  async updateDiscountCode(
    id: string,
    updates: Partial<{
      description: string;
      discount_type: 'percentage' | 'fixed';
      discount_value: number;
      is_active: boolean;
    }>
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating discount code:', error);
      return { success: false, message: 'Failed to update discount code' };
    }
  }

  async toggleDiscountCode(id: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling discount code:', error);
      return false;
    }
  }

  async deleteDiscountCode(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting discount code:', error);
      return false;
    }
  }

  async getDiscountStats(code: string): Promise<DiscountStats | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('total, discount_amount')
        .eq('discount_code', code)
        .eq('status', 'confirmed');

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          total_usage: 0,
          total_revenue: 0,
          total_discounts: 0
        };
      }

      const stats = data.reduce((acc, order) => {
        return {
          total_usage: acc.total_usage + 1,
          total_revenue: acc.total_revenue + (order.total || 0),
          total_discounts: acc.total_discounts + (order.discount_amount || 0)
        };
      }, {
        total_usage: 0,
        total_revenue: 0,
        total_discounts: 0
      });

      return stats;
    } catch (error) {
      console.error('Error fetching discount stats:', error);
      return null;
    }
  }
}

export const discountService = new DiscountService();