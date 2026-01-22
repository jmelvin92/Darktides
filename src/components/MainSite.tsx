import { useState, useEffect } from 'react';
import WaveBackground from '../../components/WaveBackground';
import GridBackground from '../../components/GridBackground';
import Navigation from '../../components/Navigation';
import Hero from '../../components/Hero';
import About from '../../components/About';
import Research from '../../components/Research';
import Store from '../../components/Store';
import Philosophy from '../../components/Philosophy';
import Footer from '../../components/Footer';
import AgeVerification from '../../components/AgeVerification';
import Checkout from '../../components/Checkout';
import OrderComplete from '../../components/OrderComplete';
import Contact from '../../components/Contact';
import { BrandTheme } from '../../theme';

export type ViewState = 'home' | 'store' | 'checkout' | 'order-complete' | 'contact';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

function MainSite() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    // Check for order-complete URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const order = urlParams.get('order');
    if (order) {
      setOrderNumber(order);
      setCurrentView('order-complete');
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (view: ViewState, sectionId?: string) => {
    setCurrentView(view);
    
    if (view === 'home' && sectionId) {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const addToCart = (product: any, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className={`min-h-screen bg-[${BrandTheme.colors.obsidian}] text-slate-200 selection:bg-neon-blue selection:text-obsidian relative`}>
      <AgeVerification />
      
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[2px] bg-neon-blue z-[100] transition-all duration-150" 
        style={{ width: `${scrollProgress}%` }}
      />
      
      <WaveBackground />
      <GridBackground />
      <Navigation currentView={currentView} onNavigate={handleNavigate} cartCount={cartCount} />
      
      <main className="relative z-10 flex flex-col gap-0 min-h-screen">
        {currentView === 'home' ? (
          <>
            <Hero onEnterLab={() => handleNavigate('store')} />
            <About />
            <Research />
            <Philosophy />
          </>
        ) : currentView === 'store' ? (
          <Store 
            onBack={() => handleNavigate('home')} 
            onAddToCart={addToCart}
            onGoToCheckout={() => handleNavigate('checkout')}
            cartCount={cartCount}
          />
        ) : currentView === 'checkout' ? (
          <Checkout 
            cart={cart} 
            onBack={() => handleNavigate('store')}
            onClearCart={() => setCart([])}
            onOrderComplete={(orderId) => {
              setOrderNumber(orderId);
              setCurrentView('order-complete');
            }}
          />
        ) : currentView === 'order-complete' ? (
          <OrderComplete 
            orderNumber={orderNumber}
            onReturnHome={() => handleNavigate('home')}
          />
        ) : currentView === 'contact' ? (
          <Contact />
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

export default MainSite;