import { supabase } from '../supabase/client';
import type { Reservation } from '../supabase/database.types';

export interface InventoryCheckResult {
  available: boolean;
  message?: string;
}

export interface ReservationResult {
  success: boolean;
  reservationId?: string;
  message?: string;
}

class InventoryService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('darktides_session_id');
    if (stored) return stored;
    
    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('darktides_session_id', newId);
    return newId;
  }

  async checkAvailability(productId: string, quantity: number): Promise<InventoryCheckResult> {
    try {
      const { data: product, error } = await (supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .eq('is_active', true)
        .single() as any);

      if (error || !product) {
        return { available: false, message: 'Product temporarily unavailable' };
      }

      // Just check stock_quantity directly (reservations disabled)
      return {
        available: product.stock_quantity >= quantity,
        message: product.stock_quantity < quantity ? 'Product temporarily unavailable' : undefined
      };
    } catch (error) {
      console.error('Inventory check error:', error);
      return { available: false, message: 'Product temporarily unavailable' };
    }
  }

  async reserveInventory(productId: string, quantity: number): Promise<ReservationResult> {
    try {
      const { data, error } = await (supabase.rpc as any)('reserve_inventory', {
        p_product_id: productId,
        p_quantity: quantity,
        p_session_id: this.sessionId
      });

      if (error) {
        console.error('Reservation error:', error);
        return { success: false, message: 'Product temporarily unavailable' };
      }

      if (!data || !data[0]?.success) {
        return { success: false, message: 'Product temporarily unavailable' };
      }

      return {
        success: true,
        reservationId: data[0].message,
        message: undefined
      };
    } catch (error) {
      console.error('Reserve inventory error:', error);
      return { success: false, message: 'Product temporarily unavailable' };
    }
  }

  async releaseReservation(reservationId: string): Promise<void> {
    try {
      await (supabase.rpc as any)('release_reservation', {
        p_reservation_id: reservationId
      });
    } catch (error) {
      console.error('Release reservation error:', error);
    }
  }

  async getSessionReservations(): Promise<Reservation[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_reservations')
        .select('*')
        .eq('session_id', this.sessionId);

      if (error) {
        console.error('Get reservations error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Get session reservations error:', error);
      return [];
    }
  }

  async validateCart(items: Array<{ id: string; quantity: number }>): Promise<{
    valid: boolean;
    invalidItems: string[];
  }> {
    const invalidItems: string[] = [];

    for (const item of items) {
      const check = await this.checkAvailability(item.id, item.quantity);
      if (!check.available) {
        invalidItems.push(item.id);
      }
    }

    return {
      valid: invalidItems.length === 0,
      invalidItems
    };
  }

  async validateDiscountCode(code: string, subtotal: number): Promise<{
    valid: boolean;
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    discountAmount?: number;
    message?: string;
  }> {
    try {
      const { data, error } = await (supabase.rpc as any)('validate_discount_code', {
        p_code: code,
        p_subtotal: subtotal
      });

      if (error) {
        console.error('Discount validation error:', error);
        return { valid: false, message: 'Unable to validate discount code' };
      }

      if (!data || data.length === 0) {
        return { valid: false, message: 'Invalid discount code' };
      }

      const result = data[0];
      return {
        valid: result.valid,
        discountType: result.discount_type,
        discountValue: result.discount_value,
        discountAmount: result.discount_amount,
        message: result.message
      };
    } catch (error) {
      console.error('Discount validation error:', error);
      return { valid: false, message: 'Unable to validate discount code' };
    }
  }

  async finalizeOrder(
    orderId: string, 
    customerData?: any, 
    cartItems?: any[], 
    totals?: any,
    paymentMethod: string = 'venmo'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('🔥 SERVICE Received orderId:', orderId);
      console.log('Finalizing order with data:', { 
        orderId, 
        customerData, 
        cartItems, 
        totals,
        paymentMethod,
        sessionId: this.sessionId 
      });

      const { data, error } = await (supabase.rpc as any)('finalize_order', {
        p_order_id: orderId,
        p_session_id: this.sessionId,
        p_customer_data: customerData || null,
        p_cart_items: cartItems || null,
        p_totals: totals || null,
        p_payment_method: paymentMethod
      });

      console.log('🔥 SERVICE Database call parameters:', {
        p_order_id: orderId,
        p_session_id: this.sessionId,
      });
      console.log('Finalize order response:', { data, error });

      if (error) {
        console.error('Finalize order error:', error);
        return { success: false, message: error.message || 'Unable to complete order' };
      }

      // Clear session after successful order
      sessionStorage.removeItem('darktides_session_id');
      this.sessionId = this.getOrCreateSessionId();

      // Return the actual order ID from database
      return { 
        success: true, 
        message: data && data[0] ? data[0].message : `Order ${orderId} completed successfully`
      };
    } catch (error) {
      console.error('Finalize order error:', error);
      return { success: false, message: 'Unable to complete order' };
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const inventoryService = new InventoryService();