
import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Lock, CheckCircle2, Package, AlertTriangle } from 'lucide-react';
import FadeIn from './FadeIn';
import { CartItem } from '../App';
import { useInventory } from '../src/hooks/useInventory';

interface CheckoutProps {
  cart: CartItem[];
  onBack: () => void;
  onClearCart: () => void;
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

const Checkout: React.FC<CheckoutProps> = ({ cart, onBack, onClearCart }) => {
  const [step, setStep] = useState<'shipping' | 'payment' | 'complete'>('shipping');
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
  const { validateCart, finalizeOrder } = useInventory();

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = 15.00;
  const total = subtotal + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShippingData({ ...shippingData, [e.target.name]: e.target.value });
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
      
      setStep('payment');
    }
  };

  const handleVenmoConfirm = async () => {
    // Generate order ID
    const orderId = `DT-${Math.random().toString(36).substring(7).toUpperCase()}`;
    
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
      total
    };
    
    // Finalize the order (deduct from inventory and send email)
    const result = await finalizeOrder(orderId, customerData, cartItems, totals);
    
    if (result.success) {
      onClearCart();
      setStep('complete');
    } else {
      setValidationError('Unable to complete order. Please try again.');
    }
  };

  const handleReturnToHome = () => {
    onBack();
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
              Order ID: DT-{Math.random().toString(36).substring(7).toUpperCase()} // Status: Awaiting Payment
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
                  {step === 'shipping' ? <Truck className="text-neon-blue w-6 h-6" /> : <CreditCard className="text-neon-blue w-6 h-6" />}
                  <h2 className="text-xl font-bold text-white uppercase tracking-widest font-mono">
                    {step === 'shipping' ? 'Shipping Information' : 'Payment Method'}
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
                ) : (
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
                        onClick={() => setStep('shipping')}
                        className="w-full text-gray-500 font-mono text-[10px] uppercase tracking-widest py-2 hover:text-white transition-colors"
                      >
                        Edit Shipping Info
                      </button>
                    </div>
                  </div>
                )}
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
