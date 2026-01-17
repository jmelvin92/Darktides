export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          short_name: string | null
          dosage: string | null
          price: number
          old_price: number | null
          sku: string
          description: string | null
          stock_quantity: number
          reserved_quantity: number
          is_active: boolean
          display_order: number | null
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          short_name?: string | null
          dosage?: string | null
          price: number
          old_price?: number | null
          sku: string
          description?: string | null
          stock_quantity?: number
          reserved_quantity?: number
          is_active?: boolean
          display_order?: number | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string | null
          dosage?: string | null
          price?: number
          old_price?: number | null
          sku?: string
          description?: string | null
          stock_quantity?: number
          reserved_quantity?: number
          is_active?: boolean
          display_order?: number | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_reservations: {
        Row: {
          id: string
          session_id: string
          product_id: string
          quantity: number
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          product_id: string
          quantity: number
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          product_id?: string
          quantity?: number
          expires_at?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          items: Json
          total: number
          customer_data: Json
          status: string
          payment_status?: string
          payment_method?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_email?: string
          customer_phone?: string
          shipping_address?: string
          shipping_city?: string
          shipping_state?: string
          shipping_zip?: string
          order_notes?: string
          subtotal?: number
          shipping_cost?: number
          discount_code?: string
          discount_amount?: number
          session_id?: string
          coinbase_charge_code?: string
          crypto_payment_details?: Json
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          order_number: string
          items: Json
          total: number
          customer_data?: Json
          status?: string
          payment_status?: string
          payment_method?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_email?: string
          customer_phone?: string
          shipping_address?: string
          shipping_city?: string
          shipping_state?: string
          shipping_zip?: string
          order_notes?: string
          subtotal?: number
          shipping_cost?: number
          discount_code?: string
          discount_amount?: number
          session_id?: string
          coinbase_charge_code?: string
          crypto_payment_details?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          items?: Json
          total?: number
          customer_data?: Json
          status?: string
          payment_status?: string
          payment_method?: string
          customer_first_name?: string
          customer_last_name?: string
          customer_email?: string
          customer_phone?: string
          shipping_address?: string
          shipping_city?: string
          shipping_state?: string
          shipping_zip?: string
          order_notes?: string
          subtotal?: number
          shipping_cost?: number
          discount_code?: string
          discount_amount?: number
          session_id?: string
          coinbase_charge_code?: string
          crypto_payment_details?: Json
          created_at?: string
          updated_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          product_id: string
          transaction_type: string
          quantity_change: number
          balance_after: number
          order_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          transaction_type: string
          quantity_change: number
          balance_after: number
          order_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          transaction_type?: string
          quantity_change?: number
          balance_after?: number
          order_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      discount_codes: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          usage_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          usage_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          usage_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reserve_inventory: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_session_id: string
        }
        Returns: {
          success: boolean
          message: string
        }
      }
      release_reservation: {
        Args: {
          p_reservation_id: string
        }
        Returns: void
      }
      finalize_order: {
        Args: {
          p_order_id: string
          p_session_id: string
        }
        Returns: {
          success: boolean
          message: string
        }
      }
      cleanup_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type Reservation = Database['public']['Tables']['inventory_reservations']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type DiscountCode = Database['public']['Tables']['discount_codes']['Row'];