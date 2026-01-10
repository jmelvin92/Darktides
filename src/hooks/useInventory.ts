import { useState, useCallback } from 'react';
import { inventoryService } from '../lib/inventory/InventoryService';

export function useInventory() {
  const [checking, setChecking] = useState(false);

  const checkAndReserve = useCallback(async (productId: string, quantity: number) => {
    setChecking(true);
    try {
      // First check availability
      const availabilityCheck = await inventoryService.checkAvailability(productId, quantity);
      
      if (!availabilityCheck.available) {
        return {
          success: false,
          message: availabilityCheck.message || 'Product temporarily unavailable'
        };
      }

      // If available, reserve it
      const reservation = await inventoryService.reserveInventory(productId, quantity);
      
      return {
        success: reservation.success,
        message: reservation.message,
        reservationId: reservation.reservationId
      };
    } catch (error) {
      console.error('Check and reserve error:', error);
      return {
        success: false,
        message: 'Product temporarily unavailable'
      };
    } finally {
      setChecking(false);
    }
  }, []);

  const validateCart = useCallback(async (items: Array<{ id: string; quantity: number }>) => {
    const result = await inventoryService.validateCart(items);
    return result;
  }, []);

  const finalizeOrder = useCallback(async (
    orderId: string, 
    customerData?: any, 
    cartItems?: any[], 
    totals?: any
  ) => {
    return await inventoryService.finalizeOrder(orderId, customerData, cartItems, totals);
  }, []);

  return {
    checkAndReserve,
    validateCart,
    finalizeOrder,
    checking
  };
}