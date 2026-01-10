import { useState, useCallback } from 'react';
import { inventoryService } from '../lib/inventory/InventoryService';

export function useInventory() {
  const [checking, setChecking] = useState(false);

  const checkAndReserve = useCallback(async (productId: string, quantity: number) => {
    setChecking(true);
    console.log('Checking and reserving:', { productId, quantity });
    try {
      // First check availability
      const availabilityCheck = await inventoryService.checkAvailability(productId, quantity);
      console.log('Availability check result:', availabilityCheck);
      
      if (!availabilityCheck.available) {
        console.log('Product not available:', availabilityCheck.message);
        return {
          success: false,
          message: availabilityCheck.message || 'Product temporarily unavailable'
        };
      }

      // If available, reserve it
      const reservation = await inventoryService.reserveInventory(productId, quantity);
      console.log('Reservation result:', reservation);
      
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

  const finalizeOrder = useCallback(async (orderId: string) => {
    return await inventoryService.finalizeOrder(orderId);
  }, []);

  return {
    checkAndReserve,
    validateCart,
    finalizeOrder,
    checking
  };
}