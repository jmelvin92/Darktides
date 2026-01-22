import React, { useEffect, useState } from 'react';
import { CheckCircle2, Home, Package } from 'lucide-react';
import FadeIn from './FadeIn';
import { supabase } from '../src/lib/supabase/client';

interface OrderCompleteProps {
  orderNumber: string | null;
  onReturnHome: () => void;
}

const OrderComplete: React.FC<OrderCompleteProps> = ({ orderNumber, onReturnHome }) => {
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      fetchOrderDetails();
    }
  }, [orderNumber]);

  const fetchOrderDetails = async () => {
    if (!orderNumber) return;
    
    setLoading(true);
    
    // Try to fetch order details (may not exist yet if coming from Coinbase)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (data) {
        console.log('Order details fetched:', data);
        setOrderDetails(data);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center">
        <FadeIn>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 font-mono text-xs">Loading order details...</p>
          </div>
        </FadeIn>
      </section>
    );
  }

  // Determine payment method from order details or assume crypto if coming from redirect
  const paymentMethod = orderDetails?.payment_method || 'crypto';
  const isCryptoPayment = paymentMethod === 'crypto';

  return (
    <section className="pt-32 pb-24 px-6 min-h-screen">
      <FadeIn>
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel p-8 md:p-12 space-y-8 border-t-2 border-t-neon-teal">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-neon-teal/10 rounded-full flex items-center justify-center border-2 border-neon-teal/30">
                <CheckCircle2 className="w-12 h-12 text-neon-teal" />
              </div>
            </div>

            {/* Main Message */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white uppercase tracking-tighter">
                Order Received!
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md mx-auto">
                {isCryptoPayment ? (
                  <>Thank you for your order. Your payment has been confirmed and we'll begin preparing your order shortly.</>
                ) : (
                  <>Thank you for your order. We've received your information and will process it once we confirm your Venmo payment.</>
                )}
              </p>
            </div>

            {/* Order Details Box */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <Package className="w-5 h-5 text-neon-blue" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wide">Order Details</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Order Number</p>
                  <p className="font-mono text-white">{orderNumber || 'N/A'}</p>
                </div>
                {orderDetails && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                      <p className="font-mono text-white">
                        {orderDetails.customer_first_name} {orderDetails.customer_last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                      <p className="font-mono text-white text-sm">{orderDetails.customer_email}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Instructions for Venmo */}
              {!isCryptoPayment && (
                <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-900/30 rounded">
                  <p className="text-yellow-400 text-sm font-semibold mb-2">⚠️ Payment Required</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Please complete your payment via Venmo to <span className="font-mono text-white">@Darktides</span> with your name and a random emoji in the notes. Your order will be processed once payment is confirmed.
                  </p>
                </div>
              )}

              {/* Confirmation for Crypto */}
              {isCryptoPayment && (
                <div className="mt-6 p-4 bg-green-900/20 border border-green-900/30 rounded">
                  <p className="text-green-400 text-sm font-semibold mb-2">✓ Payment Confirmed</p>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Your cryptocurrency payment has been received and confirmed. You should receive an order confirmation email shortly. Your order will ship within 1-2 business days.
                  </p>
                </div>
              )}
            </div>

            {/* What's Next Section */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">What Happens Next?</h3>
              <ol className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-neon-blue font-mono">1.</span>
                  <span className="text-yellow-400 font-semibold">Do not lose your order number - save it for your records</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-blue font-mono">2.</span>
                  <span>{isCryptoPayment ? 'Your order confirmation has been sent to our fulfillment team' : 'Complete your Venmo payment if not already done'}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-blue font-mono">3.</span>
                  <span>We'll begin preparing your order for shipment</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-blue font-mono">4.</span>
                  <span>Your order will be shipped within 1-2 business days</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-blue font-mono">5.</span>
                  <span>Products will arrive via USPS Priority Mail</span>
                </li>
              </ol>
            </div>

            {/* Action Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={onReturnHome}
                className="flex items-center gap-3 px-8 py-4 bg-neon-blue text-obsidian font-bold uppercase tracking-[0.2em] text-xs hover:bg-neon-blue/90 transition-all"
              >
                <Home className="w-4 h-4" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
};

export default OrderComplete;