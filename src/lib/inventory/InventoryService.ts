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
        .select('stock_quantity, reserved_quantity')
        .eq('id', productId)
        .eq('is_active', true)
        .single() as any);

      if (error || !product) {
        return { available: false, message: 'Product temporarily unavailable' };
      }

      const available = product.stock_quantity - product.reserved_quantity;
      return {
        available: available >= quantity,
        message: available < quantity ? 'Product temporarily unavailable' : undefined
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

  async finalizeOrder(
    orderId: string, 
    customerData?: any, 
    cartItems?: any[], 
    totals?: any
  ): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Finalizing order with data:', { 
        orderId, 
        customerData, 
        cartItems, 
        totals,
        sessionId: this.sessionId 
      });

      const { data, error } = await (supabase.rpc as any)('finalize_order', {
        p_order_id: orderId,
        p_session_id: this.sessionId,
        p_customer_data: customerData || null,
        p_cart_items: cartItems || null,
        p_totals: totals || null
      });

      console.log('Finalize order response:', { data, error });

      if (error) {
        console.error('Finalize order error:', error);
        return { success: false, message: 'Unable to complete order' };
      }

      // Clear session after successful order
      sessionStorage.removeItem('darktides_session_id');
      this.sessionId = this.getOrCreateSessionId();

      return { success: true };
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