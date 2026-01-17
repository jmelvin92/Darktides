
import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Lock, CheckCircle2, Package, AlertTriangle, Bitcoin, ExternalLink } from 'lucide-react';
import FadeIn from './FadeIn';
import PaymentMethodSelector from './PaymentMethodSelector';
import { CartItem } from '../src/components/MainSite';
import { useInventory } from '../src/hooks/useInventory';
import { inventoryService } from '../src/lib/inventory/InventoryService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
console.log('DEBUG: Supabase URL:', supabaseUrl);
console.log('DEBUG: Has Anon Key:', !!supabaseAnonKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CheckoutProps {
  cart: CartItem[];
  onBack: () => void;
  onClearCart: () => void;
  onOrderComplete?: (orderId: string) => void;
}

interface ShippingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  orderNotes: string;
}

const Checkout: React.FC<CheckoutProps> = ({ cart, onBack, onClearCart, onOrderComplete }) => {
  const [step, setStep] = useState<'shipping' | 'payment-method' | 'payment' | 'complete'>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<'venmo' | 'crypto'>('venmo');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [processingCrypto, setProcessingCrypto] = useState(false);
  const [shippingData, setShippingData] = useState<ShippingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    orderNotes: '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const { validateCart, finalizeOrder } = useInventory();

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = 0.00; // Temporarily disabled for testing
  const discountAmount = discountApplied?.amount || 0;
  const total = subtotal + shipping - discountAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShippingData({ ...shippingData, [e.target.name]: e.target.value });
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    
    setCheckingDiscount(true);
    setDiscountError(null);
    
    const result = await inventoryService.validateDiscountCode(discountCode, subtotal);
    
    if (result.valid && result.discountAmount) {
      setDiscountApplied({
        code: discountCode.toUpperCase(),
        type: result.discountType as 'percentage' | 'fixed',
        value: result.discountValue || 0,
        amount: result.discountAmount
      });
      setDiscountError(null);
    } else {
      setDiscountError(result.message || 'Invalid discount code');
      setDiscountApplied(null);
    }
    
    setCheckingDiscount(false);
  };

  const handleRemoveDiscount = () => {
    setDiscountApplied(null);
    setDiscountCode('');
    setDiscountError(null);
  };

  const isFormValid = () => {
    const { orderNotes, ...requiredFields } = shippingData;
    return Object.values(requiredFields).every((value: string) => value.trim() !== '');
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      setValidationError(null);
      
      // Validate cart inventory before proceeding to payment
      const validation = await validateCart(cart.map(item => ({ id: item.id, quantity: item.quantity })));
      
      if (!validation.valid) {
        setValidationError('Some items in your cart are no longer available. Please review your cart and try again.');
        return;
      }
      
      setStep('payment-method');
    }
  };

  const handlePaymentMethodContinue = async () => {
    console.log('Payment method selected:', paymentMethod);
    if (paymentMethod === 'crypto') {
      console.log('Processing crypto payment...');
      // Skip the payment screen and go straight to Coinbase
      await handleCryptoPayment();
    } else {
      console.log('Showing Venmo payment screen...');
      // Show Venmo payment screen
      setStep('payment');
    }
  };

  const handleCryptoPayment = async () => {
    alert('DEBUG: handleCryptoPayment called!');
    console.log('=== STARTING CRYPTO PAYMENT PROCESS ===');
    console.log('Cart:', cart);
    console.log('Shipping data:', shippingData);
    
    setProcessingCrypto(true);
    setValidationError(null);
    
    // Generate order ID
    const finalOrderId = `DT-${Math.random().toString(36).substring(7).toUpperCase()}`;
    console.log('Generated order ID:', finalOrderId);
    
    try {
      // First, finalize the order in our database
      const customerData = {
        firstName: shippingData.firstName,
        lastName: shippingData.lastName,
        email: shippingData.email,
        phone: shippingData.phone,
        address: shippingData.address,
        city: shippingData.city,
        state: shippingData.state,
        zip: shippingData.zip,
        orderNotes: shippingData.orderNotes
      };

      const cartItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        price: item.price,
        quantity: item.quantity
      }));

      const totals = {
        subtotal,
        shipping,
        total,
        discount_code: discountApplied?.code || null,
        discount_amount: discountApplied?.amount || 0
      };
      
      // Finalize the order - try with 5 parameters first (old version)
      console.log('Creating crypto order with ID:', finalOrderId);
      console.log('Customer data:', customerData);
      console.log('Cart items:', cartItems);
      console.log('Totals:', totals);
      
      // First check if we can even connect to the database
      console.log('Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('Database connection error:', testError);
        throw new Error('Cannot connect to database');
      }
      console.log('Database connection OK');
      
      // First try the 5-parameter version (without payment_method)
      console.log('Calling finalizeOrder with 5 parameters...');
      let result = await finalizeOrder(finalOrderId, customerData, cartItems, totals);
      console.log('Finalize order result (5 params):', result);
      
      if (!result.success) {
        // If 5-param fails, try 6-param version
        console.log('Trying 6-parameter version with crypto payment method');
        result = await finalizeOrder(finalOrderId, customerData, cartItems, totals, 'crypto');
        console.log('Finalize order result (6 params):', result);
      } else {
        // If 5-param succeeded, update the payment method
        console.log('Updating payment method to crypto');
        
        type OrderUpdate = {
          payment_method?: string;
          payment_status?: string;
        };
        
        const updatePayload: OrderUpdate = { 
          payment_method: 'crypto', 
          payment_status: 'pending_crypto' 
        };
        
        const { error: updateError } = await supabase
          .from('orders')
          .update(updatePayload as any) // TypeScript issue with generated types
          .eq('order_number', finalOrderId);
          
        if (updateError) {
          console.error('Failed to update payment method:', updateError);
        }
      }
      
      if (!result.success) {
        console.error('Order creation failed:', result);
        setValidationError(`Unable to process order: ${result.message || 'Unknown error'}`);
        setProcessingCrypto(false);
        return;
      }
      
      // Wait a moment for the database to commit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Manually trigger email for crypto orders (since trigger might not be working)
      try {
        console.log('Fetching order for email:', finalOrderId);
        const { data: orderData, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', finalOrderId)
          .single();
        
        if (fetchError) {
          console.error('Error fetching order for email:', fetchError);
        }
        
        if (orderData) {
          console.log('Sending email for order:', orderData);
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-order-email', {
            body: { record: orderData }
          });
          
          if (emailError) {
            console.error('Email send error:', emailError);
          } else {
            console.log('Email sent successfully:', emailResult);
          }
        } else {
          console.error('No order data found to send email');
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't block the order, just log the error
      }
      
      // Create Coinbase charge
      const { data, error } = await supabase.functions.invoke('create-coinbase-charge', {
        body: {
          orderNumber: finalOrderId,
          amount: total,
          customerEmail: shippingData.email,
          customerName: `${shippingData.firstName} ${shippingData.lastName}`,
          items: cartItems
        }
      });
      
      if (error || !data?.success) {
        setValidationError('Unable to create payment. Please try again.');
        setProcessingCrypto(false);
        return;
      }
      
      // Redirect to Coinbase checkout
      window.location.href = data.hostedUrl;
      
    } catch (error: any) {
      console.error('=== CRYPTO PAYMENT ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      setValidationError(`Payment processing failed: ${error?.message || 'Unknown error'}`);
      setProcessingCrypto(false);
    }
  };

  const handleVenmoConfirm = async () => {
    // Generate a single order ID for everything
    const finalOrderId = `DT-${Math.random().toString(36).substring(7).toUpperCase()}`;
    console.log('🔥 FRONTEND Generated Order ID:', finalOrderId);
    
    // Prepare order data for email notification
    const customerData = {
      firstName: shippingData.firstName,
      lastName: shippingData.lastName,
      email: shippingData.email,
      phone: shippingData.phone,
      address: shippingData.address,
      city: shippingData.city,
      state: shippingData.state,
      zip: shippingData.zip,
      orderNotes: shippingData.orderNotes
    };

    const cartItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity
    }));

    const totals = {
      subtotal,
      shipping,
      total,
      discount_code: discountApplied?.code || null,
      discount_amount: discountApplied?.amount || 0
    };
    
    // Finalize the order (deduct from inventory and send email) with venmo payment method
    console.log('🔥 FRONTEND Calling finalizeOrder with ID:', finalOrderId);
    const result = await finalizeOrder(finalOrderId, customerData, cartItems, totals, 'venmo');
    console.log('🔥 FRONTEND finalizeOrder result:', result);
    
    if (result.success) {
      // Set the order ID in state AFTER successful database call
      setOrderId(finalOrderId);
      console.log('🔥 FRONTEND Set state order ID:', finalOrderId);
      onClearCart();
      if (onOrderComplete) {
        onOrderComplete(finalOrderId);
      } else {
        setStep('complete');
      }
    } else {
      setValidationError('Unable to complete order. Please try again.');
    }
  };

  const handleReturnToHome = () => {
    if (onOrderComplete && orderId) {
      onOrderComplete(orderId);
    } else {
      onBack();
    }
  };

  const RequiredLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required = true }) => (
    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1">
      {children}
      {required && <span className="text-red-500 font-bold">*</span>}
    </label>
  );

  if (cart.length === 0 && step !== 'complete') {
    return (
      <section className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <h2 className="text-2xl text-white font-bold uppercase tracking-widest">Your Cart is Empty</h2>
          <p className="text-gray-500">You haven't added any products to your cart yet.</p>
          <button onClick={onBack} className="text-neon-blue font-mono text-xs uppercase tracking-[0.2em] border border-neon-blue/20 px-8 py-3 hover:bg-neon-blue/10 transition-all">
            Return to Products
          </button>
        </div>
      </section>
    );
  }

  if (step === 'complete') {
    return (
      <section className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center">
        <FadeIn>
          <div className="glass-panel p-12 max-w-lg w-full text-center space-y-8 border-t-2 border-t-neon-teal">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-neon-teal/10 rounded-full flex items-center justify-center border border-neon-teal/20">
                <CheckCircle2 className="w-10 h-10 text-neon-teal" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Order Received</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Thank you for your order, <span className="text-white font-semibold">{shippingData.firstName}</span>. Your order has been received and will be processed once we confirm your Venmo payment.
              </p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded font-mono text-[10px] text-gray-500 uppercase tracking-widest">
              Order ID: {orderId || 'Loading...'} // Status: Awaiting Payment
            </div>
            <button 
              onClick={handleReturnToHome} 
              className="w-full bg-neon-teal text-obsidian font-bold py-4 uppercase tracking-[0.2em] text-xs hover:bg-neon-teal/90 transition-all"
            >
              Back to Catalog
            </button>
          </div>
        </FadeIn>
      </section>
    );
  }

  return (
    <section className="pt-32 pb-24 px-6 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-gray-400 hover:text-neon-blue mb-12 transition-colors font-mono text-xs tracking-widest uppercase"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Continue Shopping
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Flow */}
          <div className="lg:col-span-7 space-y-8">
            <FadeIn>
              <div className="glass-panel p-8 md:p-10 border-t-2 border-t-neon-blue/20">
                <div className="flex items-center gap-3 mb-8">
                  {step === 'shipping' && <Truck className="text-neon-blue w-6 h-6" />}
                  {step === 'payment-method' && <CreditCard className="text-neon-blue w-6 h-6" />}
                  {step === 'payment' && <CreditCard className="text-neon-blue w-6 h-6" />}
                  <h2 className="text-xl font-bold text-white uppercase tracking-widest font-mono">
                    {step === 'shipping' && 'Shipping Information'}
                    {step === 'payment-method' && 'Payment Method'}
                    {step === 'payment' && `Pay with ${paymentMethod === 'venmo' ? 'Venmo' : 'Coinbase'}`}
                  </h2>
                </div>

                {step === 'shipping' ? (
                  <form onSubmit={handleInitiatePayment} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <RequiredLabel>First Name</RequiredLabel>
                        <input required name="firstName" value={shippingData.firstName} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-light" placeholder="Jane" />
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel>Last Name</RequiredLabel>
                        <input required name="lastName" value={shippingData.lastName} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-light" placeholder="Smith" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <RequiredLabel>Email Address</RequiredLabel>
                        <input required type="email" name="email" value={shippingData.email} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-light" placeholder="email@example.com" />
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel>Phone Number</RequiredLabel>
                        <input required type="tel" name="phone" value={shippingData.phone} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-light" placeholder="(555) 000-0000" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel>Street Address</RequiredLabel>
                      <input required name="address" value={shippingData.address} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-light" placeholder="123 Street Name" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <RequiredLabel>Town/City</RequiredLabel>
                        <input required name="city" value={shippingData.city} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-light" placeholder="New York" />
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel>State</RequiredLabel>
                        <input required name="state" value={shippingData.state} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-light" placeholder="NY" />
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel>ZIP Code</RequiredLabel>
                        <input required name="zip" value={shippingData.zip} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-light" placeholder="10001" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel required={false}>Order notes (optional)</RequiredLabel>
                      <textarea 
                        name="orderNotes" 
                        value={shippingData.orderNotes} 
                        onChange={handleInputChange} 
                        className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-light min-h-[100px] resize-y" 
                        placeholder="Notes about your order, e.g. special instructions for delivery."
                      />
                    </div>
                    <div className="space-y-2">
                      <RequiredLabel required={false}>Discount Code</RequiredLabel>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          placeholder="ENTER CODE"
                          disabled={discountApplied !== null}
                          className="flex-1 bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-blue transition-all font-mono uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {!discountApplied ? (
                          <button
                            type="button"
                            onClick={handleApplyDiscount}
                            disabled={checkingDiscount || !discountCode.trim()}
                            className="px-6 py-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-mono text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {checkingDiscount ? 'Checking...' : 'Apply'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleRemoveDiscount}
                            className="px-6 py-3 bg-red-900/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 transition-all font-mono text-xs uppercase tracking-wider"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {discountApplied && (
                        <p className="text-xs text-green-400 font-mono">
                          ✓ Code {discountApplied.code} applied - {discountApplied.type === 'percentage' ? `${discountApplied.value}% off` : `$${discountApplied.value} off`}
                        </p>
                      )}
                      {discountError && (
                        <p className="text-xs text-red-400 font-mono">
                          {discountError}
                        </p>
                      )}
                    </div>
                    {validationError && (
                      <div className="p-3 bg-red-900/20 border border-red-900/30 rounded flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-400">{validationError}</p>
                      </div>
                    )}
                    <button 
                      type="submit" 
                      disabled={!isFormValid()}
                      className={`w-full font-bold py-4 uppercase tracking-[0.2em] text-xs transition-all shadow-lg ${
                        isFormValid() 
                        ? 'bg-neon-blue text-obsidian hover:bg-neon-blue/90 shadow-neon-blue/20' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      Continue to Payment
                    </button>
                    {!isFormValid() && (
                      <p className="text-center text-[9px] text-gray-600 font-mono uppercase tracking-widest">
                        Please complete all fields marked with <span className="text-red-500">*</span> to proceed
                      </p>
                    )}
                  </form>
                ) : step === 'payment-method' ? (
                  <div className="space-y-8">
                    <PaymentMethodSelector 
                      selected={paymentMethod} 
                      onSelect={setPaymentMethod} 
                    />
                    
                    <div className="pt-4 border-t border-white/10">
                      <button
                        onClick={async () => {
                          console.log('Button clicked! Payment method:', paymentMethod);
                          try {
                            await handlePaymentMethodContinue();
                          } catch (error) {
                            console.error('Button click error:', error);
                          }
                        }}
                        disabled={processingCrypto}
                        className="w-full bg-neon-blue text-obsidian font-bold py-4 uppercase tracking-[0.2em] text-sm hover:bg-neon-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingCrypto ? 'Processing...' : 
                          paymentMethod === 'crypto' ? 'Continue to Coinbase' : 'Continue to Payment'
                        }
                      </button>
                      {!processingCrypto && (
                        <button
                          onClick={() => setStep('shipping')}
                          className="w-full text-gray-500 font-mono text-[10px] uppercase tracking-widest py-3 hover:text-white transition-colors mt-2"
                        >
                          ← Back
                        </button>
                      )}
                    </div>
                    {validationError && (
                      <div className="p-3 bg-red-900/20 border border-red-900/30 rounded flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-400">{validationError}</p>
                      </div>
                    )}
                  </div>
                ) : step === 'payment' ? (
                  // Only show Venmo payment screen since Coinbase goes direct
                  <div className="space-y-8">
                    <div className="p-6 border border-neon-blue/20 bg-neon-blue/5 rounded text-center space-y-4">
                      <div className="flex justify-center mb-2">
                        <div className="w-12 h-12 bg-[#008CFF] flex items-center justify-center rounded-lg shadow-xl">
                          <span className="text-white font-bold text-2xl italic font-serif">V</span>
                        </div>
                      </div>
                      <h3 className="text-white font-bold uppercase tracking-widest">Pay with Venmo</h3>
                      <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                        Total Amount: <span className="text-white font-mono font-bold">${total.toFixed(2)}</span>
                        <br/>
                        Send transfer to: <span className="text-neon-blue font-mono font-bold">@Darktides</span>
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded">
                        <ShieldCheck className="w-5 h-5 text-neon-teal shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-tight">
                          Your order will be processed once the Venmo transfer is confirmed. Please include your name and a random emoji in the payment notes.
                        </p>
                      </div>
                      <button 
                        onClick={handleVenmoConfirm}
                        className="w-full bg-neon-blue text-obsidian font-bold py-4 uppercase tracking-[0.2em] text-xs hover:bg-neon-blue/90 transition-all"
                      >
                        I have sent the Venmo transfer
                      </button>
                      <button 
                        onClick={() => setStep('payment-method')}
                        className="w-full text-gray-500 font-mono text-[10px] uppercase tracking-widest py-2 hover:text-white transition-colors"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </FadeIn>
          </div>

          {/* Sidebar / Summary */}
          <div className="lg:col-span-5">
            <FadeIn delay={200}>
              <div className="glass-panel p-8 space-y-8 border-l border-white/5">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <Package className="w-4 h-4 text-neon-blue" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">Order Summary</h3>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={item.id} className="group py-4 border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 px-2 -mx-2 rounded">
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="space-y-1">
                          <p className="text-white font-bold uppercase tracking-tight text-xs leading-tight group-hover:text-neon-blue transition-colors">
                            {item.name}
                          </p>
                        </div>
                        <span className="text-white font-mono text-xs font-bold shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">SKU</span>
                          <span className="text-[9px] font-mono text-gray-400 font-bold">{item.sku}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">QTY</span>
                          <span className="text-[9px] font-mono text-neon-blue font-bold">{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-[8px] font-mono text-gray-700 italic">${item.price.toFixed(2)}/unit</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-6 font-mono text-[10px] uppercase tracking-widest">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping <span className="text-[8px] italic opacity-50">(Standard Cold-Chain)</span></span>
                    <span className="text-white">${shipping.toFixed(2)}</span>
                  </div>
                  {discountApplied && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount ({discountApplied.code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-4 mt-4 border-t border-white/10">
                    <div className="flex justify-between items-center text-neon-blue">
                      <span className="text-xs font-bold">Total Due</span>
                      <span className="text-xl font-bold tracking-tighter">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 mt-6">
                  <div className="flex items-center gap-2 text-[8px] text-gray-700 font-mono">
                    <Lock className="w-3 h-3" />
                    <span>SECURE ENCRYPTED CHECKOUT</span>
                  </div>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                  <p className="text-[8px] text-gray-800 text-center font-mono leading-relaxed">
                    LABORATORY REAGENTS // NOT FOR HUMAN USE
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
