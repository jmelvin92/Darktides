
import React, { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, Check, ArrowLeft, ShieldAlert, ArrowRight, ShoppingBag, LayoutList, LayoutGrid, Search, X } from 'lucide-react';
import FadeIn from './FadeIn';
import Logo from './Logo';
import VialGraphic from './VialGraphic';
import { useProducts } from '../src/hooks/useProducts';
import { useInventory } from '../src/hooks/useInventory';

interface StoreProps {
  onBack: () => void;
  onAddToCart: (product: any, quantity: number) => void;
  onGoToCheckout: () => void;
  cartCount: number;
}

interface Product {
  id: string;
  name: string;
  dosage: string;
  price: number;
  oldPrice: number;
  sku: string;
  description: string;
  shortName: string;
  stockQuantity: number;
}

// Grid Card Component for Grid View
const ProductGridCard: React.FC<{ product: Product, onAddToCart: (product: Product, quantity: number) => void }> = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { checkAndReserve } = useInventory();
  
  const isOutOfStock = product.stockQuantity === 0;

  const handleAdd = async () => {
    if (isOutOfStock) return;
    
    const result = await checkAndReserve(product.id, quantity);
    
    if (result.success) {
      onAddToCart(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setUnavailable(true);
      setTimeout(() => setUnavailable(false), 3000);
    }
  };

  return (
    <div className="group/card relative transition-all duration-500 ease-out">
      <div className="border border-white/5 bg-obsidian/40 backdrop-blur-sm rounded-xl shadow-xl transition-all duration-500 hover:border-neon-blue/20 overflow-hidden">
        
        {/* Card Header - Always Visible */}
        <div 
          className="p-6 cursor-pointer md:cursor-default"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Product Vial - Compact Version */}
          <div className="relative flex items-center justify-center mb-4 h-32">
            {isOutOfStock && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="bg-red-900/95 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-700/50 shadow-2xl transform rotate-[-5deg]">
                  <p className="text-white font-bold uppercase tracking-wider text-sm">Out of Stock</p>
                </div>
              </div>
            )}
            
            <VialGraphic 
              productName={product.shortName}
              dosage={product.dosage}
              scale="medium"
              isOutOfStock={isOutOfStock}
            />
          </div>

          {/* Basic Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">{product.name}</h3>
            <div className="flex items-center gap-3">
              <span className="text-xl text-neon-blue font-mono">${product.price.toFixed(2)}</span>
              <span className="text-gray-500 text-xs line-through">${product.oldPrice.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-gray-600 font-mono">SKU: {product.sku}</p>
          </div>

          {/* Mobile expand indicator */}
          <div className="md:hidden flex items-center justify-center mt-4">
            <span className="text-gray-500 text-[10px] font-mono uppercase tracking-wider">
              {expanded ? 'Tap to collapse' : 'Tap for details'}
            </span>
          </div>
        </div>

        {/* Expandable Content - Mobile: Collapsible, Desktop: Always visible */}
        <div className={`${
          expanded ? 'max-h-[500px]' : 'max-h-0 md:max-h-[500px]'
        } overflow-hidden transition-all duration-300`}>
          <div className="px-6 pb-6 space-y-4">
            {/* Description */}
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Quantity and Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className={`flex items-center border border-white/10 bg-white/5 rounded ${isOutOfStock ? 'opacity-50' : ''}`}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}
                  className="px-3 py-2 text-white hover:bg-white/10 transition-colors disabled:cursor-not-allowed"
                  disabled={isOutOfStock}
                >-</button>
                <span className="px-3 py-2 text-white font-mono text-xs w-10 text-center">{quantity}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setQuantity(quantity + 1); }}
                  className="px-3 py-2 text-white hover:bg-white/10 transition-colors disabled:cursor-not-allowed"
                  disabled={isOutOfStock}
                >+</button>
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                className={`flex-1 font-bold uppercase tracking-wider py-2 px-4 rounded transition-all flex items-center justify-center gap-2 text-xs ${
                  isOutOfStock
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : unavailable
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : added 
                  ? 'bg-neon-teal text-obsidian' 
                  : 'bg-neon-blue hover:bg-neon-blue/90 text-obsidian'
                }`}
                disabled={isOutOfStock || unavailable}
              >
                {isOutOfStock ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Out of Stock
                  </>
                ) : unavailable ? (
                  <>
                    <AlertTriangle className="w-3 h-3" />
                    Unavailable
                  </>
                ) : added ? (
                  <>
                    <Check className="w-3 h-3" />
                    Added
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-3 h-3" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// List Card Component (Original ProductCard)
const ProductCard: React.FC<{ product: Product, onAddToCart: (product: Product, quantity: number) => void }> = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const { checkAndReserve } = useInventory();
  
  const isOutOfStock = product.stockQuantity === 0;

  const handleAdd = async () => {
    if (isOutOfStock) return;
    
    const result = await checkAndReserve(product.id, quantity);
    
    if (result.success) {
      onAddToCart(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } else {
      setUnavailable(true);
      setTimeout(() => setUnavailable(false), 3000);
    }
  };

  return (
    <div className="group/card relative mb-12 last:mb-0 transition-all duration-500 ease-out hover:scale-[1.01]">
      <div className="absolute -inset-2 bg-neon-blue/0 group-hover/card:bg-neon-blue/5 blur-2xl rounded-[2rem] transition-all duration-500 -z-10" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center border border-white/5 bg-obsidian/40 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-2xl transition-all duration-500 group-hover/card:border-neon-blue/20">
        <div className="relative flex items-center justify-center py-12">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-blue/10 blur-[80px] rounded-full -z-10"></div>
          
          {isOutOfStock && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="bg-red-900/95 backdrop-blur-sm px-6 py-3 rounded-lg border border-red-700/50 shadow-2xl transform rotate-[-5deg]">
                <p className="text-white font-bold uppercase tracking-widest text-lg">Out of Stock</p>
              </div>
            </div>
          )}
          
          <div className="group/card">
            <VialGraphic 
              productName={product.shortName}
              dosage={product.dosage}
              scale="large"
              isOutOfStock={isOutOfStock}
            />
          </div>
        </div>

        <div>
          <div className="mb-2">
            <span className="text-neon-teal font-mono text-[10px] tracking-widest uppercase bg-neon-teal/10 px-2 py-1 rounded border border-neon-teal/20">Analytical Standard</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-tighter">{product.name}</h2>
          
          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl text-neon-blue font-mono">${product.price.toFixed(2)}</span>
            <span className="text-gray-500 text-sm line-through">${product.oldPrice.toFixed(2)}</span>
          </div>

          <div className="space-y-6 mb-8 text-gray-400 font-light leading-relaxed border-b border-white/5 pb-8 text-sm">
            <p>{product.description}</p>
            <ul className="grid grid-cols-2 gap-y-2 font-mono text-[10px] uppercase tracking-wider">
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-neon-teal" />
                <span>HPLC Verified</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3 h-3 text-neon-teal" />
                <span>Mass Spec Validated</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className={`flex items-center border border-white/10 bg-white/5 w-fit ${isOutOfStock ? 'opacity-50' : ''}`}>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                className="px-4 py-3 text-white hover:bg-white/10 transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
                disabled={isOutOfStock}
              >-</button>
              <span className="px-4 py-3 text-white font-mono w-12 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)} 
                className="px-4 py-3 text-white hover:bg-white/10 transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent"
                disabled={isOutOfStock}
              >+</button>
            </div>
            
            <button 
              onClick={handleAdd}
              className={`flex-1 font-bold uppercase tracking-widest py-3 px-8 transition-all flex items-center justify-center gap-2 shadow-lg ${
                isOutOfStock
                ? 'bg-gray-800 text-gray-500 shadow-gray-800/20 cursor-not-allowed border border-gray-700'
                : unavailable
                ? 'bg-gray-700 text-gray-400 shadow-gray-700/20 cursor-not-allowed'
                : added 
                ? 'bg-neon-teal text-obsidian shadow-neon-teal/20' 
                : 'bg-neon-blue hover:bg-neon-blue/90 text-obsidian shadow-neon-blue/20'
              }`}
              disabled={isOutOfStock || unavailable}
            >
              {isOutOfStock ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Out of Stock
                </>
              ) : unavailable ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Temporarily Unavailable
                </>
              ) : added ? (
                <>
                  <Check className="w-4 h-4" />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-red-950/20 border border-red-900/30 rounded flex items-start gap-3 mb-8">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-[10px] text-red-400 font-bold font-mono">STRICT RESEARCH PROTOCOL</p>
              <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-tight">
                In-vitro laboratory research only. Not for human consumption or veterinary use. Any bodily introduction is a violation of site terms and research protocol.
              </p>
            </div>
          </div>

          <div className="text-[10px] text-gray-600 font-mono space-y-1">
            <p>SKU: {product.sku}</p>
            <p>CLASSIFICATION: RESEARCH REAGENTS</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Store: React.FC<StoreProps> = ({ onBack, onAddToCart, onGoToCheckout, cartCount }) => {
  const [showFloatingCart, setShowFloatingCart] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    // Load saved preference from localStorage
    const saved = localStorage.getItem('catalogViewMode');
    return (saved === 'grid' || saved === 'list') ? saved : 'list';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { products, loading } = useProducts();

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(search) ||
      product.shortName.toLowerCase().includes(search) ||
      product.sku.toLowerCase().includes(search) ||
      product.dosage.toLowerCase().includes(search) ||
      product.description.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    const handleScroll = () => {
      // Show floating cart after scrolling 300px down
      setShowFloatingCart(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem('catalogViewMode', viewMode);
  }, [viewMode]);


  return (
    <section className="pt-32 pb-24 px-6 relative min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 text-gray-400 hover:text-neon-blue transition-colors font-mono text-xs tracking-widest uppercase"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          <button 
            onClick={onGoToCheckout}
            className="group flex items-center gap-3 bg-white/5 border border-white/10 hover:border-neon-blue/50 px-6 py-3 text-white font-mono text-[10px] tracking-widest uppercase transition-all"
          >
            Review Cart & Checkout
            <ArrowRight className="w-4 h-4 text-neon-blue group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Search and View Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 focus:bg-white/10 transition-all font-mono text-xs tracking-wider"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${
                viewMode === 'list'
                  ? 'bg-neon-blue text-obsidian'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <LayoutList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${
                viewMode === 'grid'
                  ? 'bg-neon-blue text-obsidian'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>

        <FadeIn>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">Loading Products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                {searchTerm ? `No products found for "${searchTerm}"` : 'No products available at this time'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 text-neon-blue hover:text-neon-blue/80 font-mono text-xs uppercase tracking-wider transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProducts.map((product) => (
                <ProductGridCard key={product.id} product={product as Product} onAddToCart={onAddToCart} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product as Product} onAddToCart={onAddToCart} />
              ))}
            </div>
          )}
        </FadeIn>

        <FadeIn delay={200}>
          <div className="mt-20 border-t border-white/10 pt-12">
            <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="text-gray-500 w-5 h-5" />
                <h3 className="text-white font-mono text-sm tracking-widest uppercase">FDA Disclosure & Legal Notice</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 text-gray-500 text-[10px] leading-loose space-y-4 font-light text-justify uppercase tracking-tight">
                    <p>
                        The information provided on this website has not been evaluated by the U.S. Food and Drug Administration (FDA). None of the statements herein, nor any of the products offered, are intended to diagnose, treat, cure, or prevent any medical condition.
                    </p>
                    <p>
                        All products are supplied strictly as laboratory research reagents and are not for human consumption. We do not provide products to patients and do not make any claims regarding medical use.
                    </p>
                    <p>
                        DarkTidesResearch operates solely as a chemical supplier. It is not a compounding pharmacy and does not operate as a compounding facility under Section 503A of the Federal Food, Drug, and Cosmetic Act.
                    </p>
                </div>
                <div className="md:col-span-4 border-l border-white/5 pl-8 hidden md:block">
                    <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-2">Compliance</p>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-neon-teal"></div>
                        <span className="text-neon-teal text-xs font-mono">Research Only</span>
                    </div>
                     <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-2">Facility Type</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                        <span className="text-gray-400 text-xs font-mono">Chemical Supply</span>
                    </div>
                </div>
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Floating Action Cart Button */}
      <button
        onClick={onGoToCheckout}
        className={`fixed bottom-8 right-8 z-[60] group p-5 bg-obsidian/80 backdrop-blur-xl border border-neon-blue/30 rounded-full shadow-[0_0_30px_rgba(56,189,248,0.2)] hover:border-neon-blue hover:shadow-[0_0_40px_rgba(56,189,248,0.4)] transition-all duration-500 transform ${
          showFloatingCart ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-75'
        }`}
      >
        <div className="relative">
          <ShoppingBag className="w-6 h-6 text-neon-blue group-hover:scale-110 transition-transform duration-300" />
          {cartCount > 0 && (
            <span className="absolute -top-3 -right-3 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-neon-blue text-[10px] font-bold text-obsidian items-center justify-center shadow-lg">
                {cartCount}
              </span>
            </span>
          )}
        </div>
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-obsidian/90 border border-white/10 text-white font-mono text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          View Cart & Checkout
        </span>
      </button>
    </section>
  );
};

export default Store;
