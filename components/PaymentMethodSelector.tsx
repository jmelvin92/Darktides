import React from 'react';
import { Check } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selected: 'venmo' | 'crypto';
  onSelect: (method: 'venmo' | 'crypto') => void;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="space-y-4">
      <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-6">
        Choose Payment Method
      </p>
      
      {/* Venmo Option */}
      <label 
        className={`flex items-center p-6 rounded-lg border cursor-pointer transition-all ${
          selected === 'venmo' 
            ? 'border-neon-blue bg-neon-blue/5' 
            : 'border-white/10 bg-white/5 hover:bg-white/10'
        }`}
      >
        <input
          type="radio"
          name="payment"
          checked={selected === 'venmo'}
          onChange={() => onSelect('venmo')}
          className="sr-only"
        />
        
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-all ${
          selected === 'venmo'
            ? 'border-neon-blue bg-neon-blue'
            : 'border-gray-500'
        }`}>
          {selected === 'venmo' && (
            <Check className="w-3 h-3 text-obsidian" strokeWidth={3} />
          )}
        </div>

        <div className="flex items-center flex-grow">
          {/* Venmo Logo */}
          <div className="w-10 h-10 bg-[#3D95CE] rounded-lg flex items-center justify-center mr-4">
            <span className="text-white font-bold text-xl font-serif">V</span>
          </div>
          
          <div className="flex-grow">
            <p className="text-white font-medium text-base">Venmo</p>
            <p className="text-gray-500 text-xs mt-0.5">@Darktides</p>
          </div>

          {selected === 'venmo' && (
            <span className="text-neon-blue text-xs font-mono uppercase tracking-wider">Selected</span>
          )}
        </div>
      </label>

      {/* Coinbase Option */}
      <label 
        className={`flex items-center p-6 rounded-lg border cursor-pointer transition-all ${
          selected === 'crypto' 
            ? 'border-neon-teal bg-neon-teal/5' 
            : 'border-white/10 bg-white/5 hover:bg-white/10'
        }`}
      >
        <input
          type="radio"
          name="payment"
          checked={selected === 'crypto'}
          onChange={() => onSelect('crypto')}
          className="sr-only"
        />
        
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 transition-all ${
          selected === 'crypto'
            ? 'border-neon-teal bg-neon-teal'
            : 'border-gray-500'
        }`}>
          {selected === 'crypto' && (
            <Check className="w-3 h-3 text-obsidian" strokeWidth={3} />
          )}
        </div>

        <div className="flex items-center flex-grow">
          {/* Coinbase Logo */}
          <div className="w-10 h-10 mr-4 flex-shrink-0 rounded-full bg-[#0052FF] flex items-center justify-center">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          
          <div className="flex-grow">
            <p className="text-white font-medium text-base">Coinbase v3</p>
            <p className="text-gray-500 text-xs mt-0.5">Bitcoin, Ethereum, USDC - DEBUG</p>
          </div>

          {selected === 'crypto' && (
            <span className="text-neon-teal text-xs font-mono uppercase tracking-wider">Selected</span>
          )}
        </div>
      </label>
    </div>
  );
};

export default PaymentMethodSelector;