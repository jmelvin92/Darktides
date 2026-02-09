-- Migration 013: Remove database email triggers
--
-- Email notifications are now sent from the OrderComplete component (frontend)
-- for both Venmo and crypto orders. The database trigger is no longer needed
-- and was causing premature emails (firing on INSERT before payment completes).

DROP TRIGGER IF EXISTS trigger_order_confirmed_email ON orders;
DROP TRIGGER IF EXISTS trigger_new_order_email ON orders;

-- Keep the functions around in case they're needed for manual use,
-- but they will no longer fire automatically.
