
import React, { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, Check, ArrowLeft, ShieldAlert, ArrowRight, ShoppingBag } from 'lucide-react';
import FadeIn from './FadeIn';
import Logo from './Logo';

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
}

const products: Product[] = [
  {
    id: 'glp3-10',
    name: 'GLP-3 (RT) 10mg',
    shortName: 'GLP-3',
    dosage: '10 MG',
    price: 50.00,
    oldPrice: 75.00,
    sku: 'DT-GLP3-010',
    description: 'GLP-3 is an investigational peptide and triple receptor agonist (GLP-1, GIP, and glucagon) studied for its potential role in metabolic regulation, including glucose balance, energy expenditure, and weight management pathways. For research use only.'
  },
  {
    id: 'glp3-20',
    name: 'GLP-3 (RT) 20mg',
    shortName: 'GLP-3',
    dosage: '20 MG',
    price: 99.00,
    oldPrice: 145.00,
    sku: 'DT-GLP3-020',
    description: 'GLP-3 is an investigational peptide and triple receptor agonist (GLP-1, GIP, and glucagon) studied for its potential role in metabolic regulation, including glucose balance, energy expenditure, and weight management pathways. For research use only.'
  },
  {
    id: 'ghkcu-100',
    name: 'GHK-Cu 100MG',
    shortName: 'GHK-Cu',
    dosage: '100 MG',
    price: 30.00,
    oldPrice: 45.00,
    sku: 'DT-GHKC-100',
    description: 'GHK-Cu is a copper peptide studied in research for its role in tissue repair, wound healing, and regenerative processes. For research use only.'
  },
  {
    id: 'motsc-10',
    name: 'MOTS-C 10 MG',
    shortName: 'MOTS-C',
    dosage: '10 MG',
    price: 30.00,
    oldPrice: 45.00,
    sku: 'DT-MOTS-010',
    description: 'MOTS-C is a mitochondrial-derived peptide studied for its potential role in supporting metabolism, energy regulation, and overall cellular health. For research use only.'
  }
];

const ProductCard: React.FC<{ product: Product, onAddToCart: (product: Product, quantity: number) => void }> = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="group/card relative mb-12 last:mb-0 transition-all duration-500 ease-out hover:scale-[1.01]">
      <div className="absolute -inset-2 bg-neon-blue/0 group-hover/card:bg-neon-blue/5 blur-2xl rounded-[2rem] transition-all duration-500 -z-10" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center border border-white/5 bg-obsidian/40 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-2xl transition-all duration-500 group-hover/card:border-neon-blue/20">
        <div className="relative flex items-center justify-center py-12">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-blue/10 blur-[80px] rounded-full -z-10"></div>
          
          <div className="relative z-10 flex flex-col items-center transform scale-125 md:scale-150 transition-transform duration-700 group-hover/card:scale-[1.3] md:group-hover/card:scale-[1.55]">
              <div className="w-24 h-5 bg-neutral-900 rounded-t-sm shadow-lg z-30 border-t border-white/20 relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent rounded-t-sm"></div>
              </div>
              <div className="w-22 h-6 -mt-1 bg-gradient-to-r from-gray-500 via-gray-200 to-gray-500 z-20 shadow-md border-b border-gray-600 rounded-sm"></div>
              <div className="w-20 h-6 bg-white/10 backdrop-blur-sm border-x border-white/30 z-10" />
              <div className="w-32 h-56 bg-gradient-to-r from-white/20 via-white/5 to-white/20 backdrop-blur-md border border-white/30 rounded-b-xl relative overflow-hidden shadow-2xl flex flex-col items-center">
                  <div className="absolute bottom-1 left-1 right-1 h-52 bg-gradient-to-t from-white/10 to-transparent rounded-b-lg opacity-40" />
                  <div className="absolute top-5 w-full h-40 bg-black shadow-xl flex flex-col relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent z-40 pointer-events-none mix-blend-overlay"></div>
                      <div className="h-10 bg-gradient-to-r from-gray-400 via-gray-100 to-gray-400 flex items-center justify-center gap-2 border-b border-gray-500 relative overflow-hidden">
                          <div className="w-5 h-5 text-black"><Logo className="w-full h-full" showText={false} /></div>
                          <span className="font-sans font-bold text-black tracking-widest text-[10px]">DARKTIDES</span>
                      </div>
                      <div className="flex-1 bg-neutral-950 p-3 flex flex-col items-center text-center relative">
                          <h3 className="text-xl font-bold text-white font-sans tracking-tight mb-1">{product.shortName}</h3>
                          <div className="border border-white/80 px-1.5 py-0.5 mb-2">
                              <span className="text-white font-mono text-xs font-bold">{product.dosage}</span>
                          </div>
                          <div className="space-y-0.5 mt-auto mb-1">
                              <p className="text-[7px] font-mono text-gray-300 tracking-wider">≥99% HPLC PURITY</p>
                              <p className="text-[5px] font-mono text-gray-500 uppercase">FOR RESEARCH PURPOSES ONLY</p>
                          </div>
                      </div>
                  </div>
                  <div className="absolute top-0 left-2 w-1.5 h-full bg-gradient-to-b from-white/40 to-transparent opacity-60 pointer-events-none mix-blend-overlay blur-[1px]"></div>
              </div>
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
            <div className="flex items-center border border-white/10 bg-white/5 w-fit">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-white hover:bg-white/10 transition-colors">-</button>
              <span className="px-4 py-3 text-white font-mono w-12 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-white hover:bg-white/10 transition-colors">+</button>
            </div>
            
            <button 
              onClick={handleAdd}
              className={`flex-1 font-bold uppercase tracking-widest py-3 px-8 transition-all flex items-center justify-center gap-2 shadow-lg ${
                added 
                ? 'bg-neon-teal text-obsidian shadow-neon-teal/20' 
                : 'bg-neon-blue hover:bg-neon-blue/90 text-obsidian shadow-neon-blue/20'
              }`}
            >
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {added ? 'Added to Cart' : 'Add to Cart'}
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

  useEffect(() => {
    const handleScroll = () => {
      // Show floating cart after scrolling 300px down
      setShowFloatingCart(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="pt-32 pb-24 px-6 relative min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
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

        <FadeIn>
          <div className="flex flex-col gap-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
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
