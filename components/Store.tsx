
import React, { useState } from 'react';
import { ShoppingCart, AlertTriangle, Check, ArrowLeft, ShieldAlert } from 'lucide-react';
import FadeIn from './FadeIn';
import Logo from './Logo';

interface StoreProps {
  onBack: () => void;
}

interface Product {
  id: string;
  name: string;
  dosage: string;
  price: number;
  oldPrice: number;
  sku: string;
}

const products: Product[] = [
  {
    id: 'glp3-10',
    name: 'GLP-3 (RT) 10mg',
    dosage: '10 MG',
    price: 129.00,
    oldPrice: 165.00,
    sku: 'DT-GLP3-010'
  },
  {
    id: 'glp3-20',
    name: 'GLP-3 (RT) 20mg',
    dosage: '20 MG',
    price: 219.00,
    oldPrice: 285.00,
    sku: 'DT-GLP3-020'
  }
];

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center border-b border-white/5 pb-20 mb-20 last:border-0 last:pb-0 last:mb-0">
      {/* Product Visual - CSS Constructed Vial */}
      <div className="relative flex items-center justify-center py-12">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-xl opacity-20" />
        
        {/* Glow behind vial */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-blue/10 blur-[80px] rounded-full -z-10"></div>
        
        {/* The Vial Assembly */}
        <div className="relative z-10 flex flex-col items-center transform scale-125 md:scale-150">
            
            {/* Cap (Black Flip-off) */}
            <div className="w-24 h-5 bg-neutral-900 rounded-t-sm shadow-lg z-30 border-t border-white/20 relative">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent rounded-t-sm"></div>
            </div>
            
            {/* Crimp (Silver Aluminum) */}
            <div className="w-22 h-6 -mt-1 bg-gradient-to-r from-gray-500 via-gray-200 to-gray-500 z-20 shadow-md border-b border-gray-600 rounded-sm"></div>
            
            {/* Neck (Glass) */}
            <div className="w-20 h-6 bg-white/10 backdrop-blur-sm border-x border-white/30 z-10" />

            {/* Body (Glass) */}
            <div className="w-32 h-56 bg-gradient-to-r from-white/20 via-white/5 to-white/20 backdrop-blur-md border border-white/30 rounded-b-xl relative overflow-hidden shadow-2xl flex flex-col items-center">
                
                {/* Liquid Content */}
                <div className="absolute bottom-1 left-1 right-1 h-52 bg-gradient-to-t from-white/10 to-transparent rounded-b-lg opacity-40" />
                
                {/* Label Wrapper */}
                <div className="absolute top-5 w-full h-40 bg-black shadow-xl flex flex-col relative">
                    {/* Label Highlight/Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent z-40 pointer-events-none mix-blend-overlay"></div>

                    {/* Label: Silver Header */}
                    <div className="h-10 bg-gradient-to-r from-gray-400 via-gray-100 to-gray-400 flex items-center justify-center gap-2 border-b border-gray-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[noise] opacity-10"></div>
                        <div className="w-5 h-5 text-black">
                            <Logo className="w-full h-full" showText={false} />
                        </div>
                        <span className="font-sans font-bold text-black tracking-widest text-[10px]">DARKTIDES</span>
                    </div>
                    
                    {/* Label: Black Body */}
                    <div className="flex-1 bg-neutral-950 p-3 flex flex-col items-center text-center relative">
                        <h3 className="text-xl font-bold text-white font-sans tracking-tight mb-1">GLP-3 RT</h3>
                        <div className="border border-white/80 px-1.5 py-0.5 mb-2">
                            <span className="text-white font-mono text-xs font-bold">{product.dosage}</span>
                        </div>
                        <div className="space-y-0.5 mt-auto mb-1">
                            <p className="text-[7px] font-mono text-gray-300 tracking-wider">99% PURITY</p>
                            <p className="text-[5px] font-mono text-gray-500 uppercase">FOR RESEARCH PURPOSES ONLY</p>
                        </div>
                    </div>
                </div>

                {/* Glass Highlights/Reflections (Left) */}
                <div className="absolute top-0 left-2 w-1.5 h-full bg-gradient-to-b from-white/40 to-transparent opacity-60 pointer-events-none mix-blend-overlay blur-[1px]"></div>
                {/* Glass Highlights/Reflections (Right) */}
                <div className="absolute top-0 right-3 w-0.5 h-full bg-gradient-to-b from-white/30 to-transparent opacity-40 pointer-events-none mix-blend-overlay"></div>
            </div>
        </div>
      </div>

      {/* Product Details */}
      <div>
        <div className="mb-2">
          <span className="text-neon-teal font-mono text-xs tracking-widest uppercase bg-neon-teal/10 px-2 py-1 rounded">Research Reagent</span>
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{product.name}</h2>
        
        <div className="flex items-center gap-4 mb-8">
          <span className="text-3xl text-neon-blue font-mono">${product.price.toFixed(2)}</span>
          <span className="text-gray-500 text-sm line-through">${product.oldPrice.toFixed(2)}</span>
        </div>

        <div className="space-y-6 mb-8 text-gray-400 font-light leading-relaxed border-b border-white/5 pb-8">
          <p>
            GLP-3 is an investigational peptide and triple receptor agonist (GLP-1, GIP, and glucagon) studied for its potential role in metabolic regulation, including glucose balance, energy expenditure, and weight management pathways. For research use only.
          </p>
          <ul className="space-y-2 text-sm font-mono">
            <li className="flex items-center gap-3">
              <Check className="w-4 h-4 text-neon-teal" />
              <span>Purity: ≥99% (HPLC)</span>
            </li>
          </ul>
        </div>

        {/* Add to Cart Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex items-center border border-white/10 bg-white/5 w-fit">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-3 text-white hover:bg-white/10 transition-colors"
            >-</button>
            <span className="px-4 py-3 text-white font-mono w-12 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-3 text-white hover:bg-white/10 transition-colors"
            >+</button>
          </div>
          
          <button className="flex-1 bg-neon-blue hover:bg-neon-blue/90 text-obsidian font-bold uppercase tracking-widest py-3 px-8 transition-all flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>

        <div className="p-4 bg-red-950/20 border border-red-900/30 rounded flex items-start gap-3 mb-8">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs text-red-400 font-bold font-mono">RESEARCH USE ONLY</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              This product is strictly for in-vitro laboratory research. Not for human consumption, veterinary use, or household application. Bodily introduction of any kind is strictly prohibited.
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-600 font-mono space-y-1">
          <p>SKU: {product.sku}</p>
          <p>CATEGORY: RESEARCH PEPTIDES</p>
        </div>
      </div>
    </div>
  );
};

const Store: React.FC<StoreProps> = ({ onBack }) => {
  return (
    <section className="pt-32 pb-24 px-6 relative min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-gray-400 hover:text-neon-blue mb-12 transition-colors font-mono text-xs tracking-widest uppercase"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to Research
        </button>

        <FadeIn>
          <div className="flex flex-col">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </FadeIn>

        {/* FDA Disclosure Section */}
        <FadeIn delay={200}>
          <div className="mt-20 border-t border-white/10 pt-12">
            <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="text-gray-500 w-5 h-5" />
                <h3 className="text-white font-mono text-sm tracking-widest uppercase">FDA Disclosure & Legal Notice</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 text-gray-500 text-xs leading-loose space-y-4 font-light text-justify">
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
                    <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-2">Compliance Status</p>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-neon-teal"></div>
                        <span className="text-neon-teal text-xs">Research Only</span>
                    </div>
                     <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest mb-2">Entity Type</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                        <span className="text-gray-400 text-xs">Chemical Supplier</span>
                    </div>
                </div>
            </div>
          </div>
        </FadeIn>

      </div>
    </section>
  );
};

export default Store;
