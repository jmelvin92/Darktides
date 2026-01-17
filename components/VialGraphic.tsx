import React from 'react';
import Logo from './Logo';

interface VialGraphicProps {
  productName: string;
  dosage: string;
  scale?: 'small' | 'medium' | 'large';
  isOutOfStock?: boolean;
}

const VialGraphic: React.FC<VialGraphicProps> = ({ 
  productName, 
  dosage, 
  scale = 'medium',
  isOutOfStock = false 
}) => {
  // Define size multipliers for different scales
  const scaleConfig = {
    small: { wrapper: 'scale-75', vial: 'w-20 h-32', cap: 'w-16 h-3', neck: 'w-14 h-4', label: 'h-20', text: 'text-[6px]', logo: 'w-3 h-3' },
    medium: { wrapper: 'scale-90', vial: 'w-20 h-32', cap: 'w-16 h-3', neck: 'w-14 h-4', label: 'h-20', text: 'text-[6px]', logo: 'w-3 h-3' },
    large: { wrapper: 'scale-125 md:scale-150', vial: 'w-32 h-56', cap: 'w-24 h-5', neck: 'w-22 h-6', label: 'h-40', text: 'text-[10px]', logo: 'w-5 h-5' }
  };

  const config = scaleConfig[scale];

  return (
    <div className={`relative flex flex-col items-center transform ${config.wrapper} transition-transform duration-700 ${scale === 'large' ? 'group-hover/card:scale-[1.3] md:group-hover/card:scale-[1.55]' : ''} ${isOutOfStock ? 'opacity-40' : ''}`}>
      {/* Cap */}
      <div className={`${config.cap} bg-neutral-900 rounded-t-sm shadow-lg z-30 border-t border-white/20 relative`}>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent rounded-t-sm"></div>
      </div>
      
      {/* Metal Crimp/Neck */}
      <div className={`${config.neck} -mt-1 bg-gradient-to-r from-gray-500 via-gray-200 to-gray-500 z-20 shadow-md border-b border-gray-600 rounded-sm`}></div>
      
      {/* Glass Neck */}
      <div className={`${scale === 'large' ? 'w-20 h-6' : 'w-12 h-4'} bg-white/10 backdrop-blur-sm border-x border-white/30 z-10`} />
      
      {/* Glass Vial Body */}
      <div className={`${config.vial} bg-gradient-to-r from-white/20 via-white/5 to-white/20 backdrop-blur-md border border-white/30 rounded-b-xl relative overflow-hidden shadow-2xl flex flex-col items-center`}>
        <div className="absolute bottom-1 left-1 right-1 h-52 bg-gradient-to-t from-white/10 to-transparent rounded-b-lg opacity-40" />
        
        {/* Label */}
        <div className={`absolute ${scale === 'large' ? 'top-5' : 'top-3'} w-full ${config.label} shadow-xl flex flex-col relative`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent z-40 pointer-events-none mix-blend-overlay"></div>
          
          {/* Header with logo and brand - now for all sizes */}
          <div className={`${scale === 'large' ? 'h-10' : 'h-6'} bg-gradient-to-r from-gray-400 via-gray-100 to-gray-400 flex items-center justify-center gap-1 border-b border-gray-500 relative overflow-hidden`}>
            <div className={`${config.logo} text-black`}>
              <Logo className="w-full h-full" showText={false} />
            </div>
            <span className={`font-sans font-bold text-black tracking-widest ${config.text}`}>DARKTIDES</span>
          </div>
          
          {/* Product info */}
          <div className="flex-1 bg-neutral-950 p-2 flex flex-col items-center text-center relative">
            <h3 className={`${scale === 'large' ? 'text-xl' : 'text-xs'} font-bold text-white font-sans tracking-tight mb-1`}>{productName}</h3>
            <div className="border border-white/80 px-1 py-0.5 ${scale === 'large' ? 'mb-2' : 'mb-1'}">
              <span className={`text-white font-mono ${scale === 'large' ? 'text-xs' : 'text-[8px]'} font-bold`}>{dosage}</span>
            </div>
            {scale === 'large' && (
              <div className="space-y-0.5 mt-auto mb-1">
                <p className="text-[7px] font-mono text-gray-300 tracking-wider">≥99% HPLC PURITY</p>
                <p className="text-[5px] font-mono text-gray-500 uppercase">FOR RESEARCH PURPOSES ONLY</p>
              </div>
            )}
            {(scale === 'small' || scale === 'medium') && (
              <div className="mt-auto">
                <p className="text-[6px] font-mono text-gray-300 tracking-wider">≥99% PURITY</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="absolute top-0 left-2 w-1.5 h-full bg-gradient-to-b from-white/40 to-transparent opacity-60 pointer-events-none mix-blend-overlay blur-[1px]"></div>
      </div>
    </div>
  );
};

export default VialGraphic;