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
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      handleCryptoOrderCompletion();
    }
  }, [orderNumber]);

  const sendOrderEmail = async (orderData: any) => {
    try {
      console.log('Sending order email notification...');
      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: {
          record: orderData
        }
      });
      
      if (error) {
        console.error('Error sending email:', error);
        return false;
      }
      
      console.log('Email sent successfully:', data);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  };

  const handleCryptoOrderCompletion = async () => {
    if (!orderNumber) return;
    
    setLoading(true);
    let orderData: any = null;
    let retries = 0;
    const maxRetries = 5;
    
    // Step 1: Try to fetch the order with retries
    while (retries < maxRetries && !orderData) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .maybeSingle();

        if (data) {
          console.log('Order fetched:', data);
          orderData = data;
          setOrderDetails(data);
          break;
        }
        
        retries++;
        if (retries < maxRetries) {
          console.log(`Retry ${retries}/${maxRetries} - waiting 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Step 2: If we have order data and it's a crypto order that needs confirmation
    if (orderData && orderData.payment_method === 'crypto') {
      console.log('Processing crypto order - Status:', orderData.status);
      
      // Only process if we haven't sent email yet
      if (!emailSent) {
        // First, update order status to confirmed if it's not already
        if (orderData.status !== 'confirmed') {
          console.log('Updating order status to confirmed...');
          const { data: updateData, error: updateError } = await (supabase
            .from('orders') as any)
            .update({ 
              status: 'confirmed',
              payment_status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('order_number', orderNumber)
            .select()
            .single();
          
          if (updateError) {
            console.error('Error updating order status:', updateError);
          } else {
            console.log('Order status updated to confirmed');
            orderData = updateData; // Use the updated order data
          }
        }
        
        // Now send the email with the confirmed order data
        console.log('Sending email for crypto order...');
        const emailSuccess = await sendOrderEmail(orderData);
        
        if (emailSuccess) {
          setEmailSent(true);
          console.log('Email notification sent successfully for crypto order');
        } else {
          console.error('Failed to send email notification');
          // Try one more time after a delay
          setTimeout(async () => {
            console.log('Retrying email send...');
            await sendOrderEmail(orderData);
          }, 3000);
        }
      }
    }
    // Step 3: If no order was found but we have an order number (likely coming from Coinbase)
    else if (!orderData && orderNumber) {
      console.log('No order found in database, but have order number - likely Coinbase redirect');
      // Create a minimal order object for display purposes
      setOrderDetails({
        order_number: orderNumber,
        payment_method: 'crypto',
        status: 'pending'
      });
      
      // Try to confirm the order and send email anyway
      console.log('Attempting to confirm crypto order via RPC...');
      const { data: rpcData, error: rpcError } = await (supabase as any)
        .rpc('confirm_crypto_order', { p_order_number: orderNumber });
      
      if (!rpcError) {
        // Wait a bit then try to fetch and send email
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: confirmedOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .single();
        
        if (confirmedOrder && !emailSent) {
          await sendOrderEmail(confirmedOrder);
          setEmailSent(true);
        }
      }
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center">
        <FadeIn>
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 font-mono text-xs">Processing your order...</p>
          </div>
        </FadeIn>
      </section>
    );
  }

  // Determine payment method from order details or context
  const isComingFromCoinbase = orderNumber && (!orderDetails || orderDetails.payment_method === 'crypto');
  const paymentMethod = orderDetails?.payment_method || (isComingFromCoinbase ? 'crypto' : 'venmo');
  const isCryptoPayment = paymentMethod === 'crypto' || isComingFromCoinbase;

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
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Payment Method</p>
                  <p className="font-mono text-white capitalize">{paymentMethod === 'crypto' ? 'Cryptocurrency' : 'Venmo'}</p>
                </div>
                {orderDetails && orderDetails.customer_first_name && (
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
                    Your cryptocurrency payment has been received and confirmed. We've sent you an order confirmation email. Your order will ship within 1-2 business days.
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
                  <span>{isCryptoPayment ? 'Your order has been confirmed and we\'ve been notified' : 'Complete your Venmo payment if not already done'}</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-blue font-mono">2.</span>
                  <span>We'll begin preparing your order for shipment</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-blue font-mono">3.</span>
                  <span>Your order will be shipped within 1-2 business days</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-blue font-mono">4.</span>
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