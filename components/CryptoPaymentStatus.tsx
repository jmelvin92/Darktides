import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import FadeIn from './FadeIn';
import { supabase } from '../src/lib/supabase/client';

interface CryptoPaymentStatusProps {
  orderNumber: string;
  onComplete: () => void;
  onBack: () => void;
}

const CryptoPaymentStatus: React.FC<CryptoPaymentStatusProps> = ({ orderNumber, onComplete, onBack }) => {
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'failed' | 'expired'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial order status
    checkOrderStatus();

    // Subscribe to order updates
    const subscription = supabase
      .channel(`order_${orderNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `order_number=eq.${orderNumber}`,
        },
        (payload) => {
          const newStatus = payload.new.payment_status;
          if (newStatus === 'confirmed') {
            setPaymentStatus('confirmed');
            setTimeout(onComplete, 2000); // Auto-redirect after 2 seconds
          } else if (newStatus === 'failed') {
            setPaymentStatus('failed');
          } else if (newStatus === 'expired') {
            setPaymentStatus('expired');
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [orderNumber, onComplete]);

  const checkOrderStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('payment_status')
        .eq('order_number', orderNumber)
        .single();

      if (!error && data) {
        if (data.payment_status === 'confirmed') {
          setPaymentStatus('confirmed');
          setTimeout(onComplete, 2000);
        } else if (data.payment_status === 'failed') {
          setPaymentStatus('failed');
        } else if (data.payment_status === 'expired') {
          setPaymentStatus('expired');
        } else {
          setPaymentStatus('pending');
        }
      }
    } catch (error) {
      console.error('Error checking order status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center">
        <FadeIn>
          <div className="text-center space-y-6">
            <RefreshCw className="w-12 h-12 text-neon-blue mx-auto animate-spin" />
            <h2 className="text-2xl text-white font-bold uppercase tracking-widest">Checking Payment Status...</h2>
            <p className="text-gray-500 text-sm">Order: {orderNumber}</p>
          </div>
        </FadeIn>
      </section>
    );
  }

  return (
    <section className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center">
      <FadeIn>
        <div className="glass-panel p-12 max-w-lg w-full text-center space-y-8 border-t-2 border-t-neon-teal">
          {paymentStatus === 'pending' && (
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20">
                  <Clock className="w-10 h-10 text-yellow-500 animate-pulse" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Payment Pending</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  We're waiting for your cryptocurrency payment to be confirmed on the blockchain. This usually takes a few minutes.
                </p>
                <p className="text-xs text-gray-500 font-mono">Order: {orderNumber}</p>
              </div>
              <button
                onClick={checkOrderStatus}
                className="w-full bg-white/10 text-white font-mono py-3 text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/20"
              >
                Refresh Status
              </button>
            </>
          )}

          {paymentStatus === 'confirmed' && (
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-neon-teal/10 rounded-full flex items-center justify-center border border-neon-teal/20">
                  <CheckCircle2 className="w-10 h-10 text-neon-teal" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Payment Confirmed!</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your cryptocurrency payment has been confirmed. Your order is being processed and will be shipped soon.
                </p>
                <p className="text-xs text-gray-500 font-mono">Order: {orderNumber}</p>
              </div>
              <div className="text-xs text-gray-600">Redirecting to order complete...</div>
            </>
          )}

          {paymentStatus === 'failed' && (
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Payment Failed</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  There was an issue with your payment. Please try again or contact support if the problem persists.
                </p>
                <p className="text-xs text-gray-500 font-mono">Order: {orderNumber}</p>
              </div>
              <button
                onClick={onBack}
                className="w-full bg-neon-blue text-obsidian font-bold py-4 uppercase tracking-[0.2em] text-xs hover:bg-neon-blue/90 transition-all"
              >
                Try Again
              </button>
            </>
          )}

          {paymentStatus === 'expired' && (
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/20">
                  <Clock className="w-10 h-10 text-orange-500" />
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Payment Expired</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The payment window has expired. Please create a new order to complete your purchase.
                </p>
                <p className="text-xs text-gray-500 font-mono">Order: {orderNumber}</p>
              </div>
              <button
                onClick={onBack}
                className="w-full bg-neon-blue text-obsidian font-bold py-4 uppercase tracking-[0.2em] text-xs hover:bg-neon-blue/90 transition-all"
              >
                Start New Order
              </button>
            </>
          )}
        </div>
      </FadeIn>
    </section>
  );
};

export default CryptoPaymentStatus;