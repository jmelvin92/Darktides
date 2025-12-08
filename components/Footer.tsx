import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black py-12 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        
        <div className="flex flex-col items-center md:items-start gap-4">
          <Logo className="w-8 h-8" />
          <p className="text-gray-600 text-[10px] font-mono tracking-widest mt-2">EST. 2024 // DEEP SECTOR</p>
        </div>

        <div className="max-w-md text-center md:text-right">
            <div className="flex items-start gap-3 justify-center md:justify-end text-gray-500 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-neon-teal shrink-0 mt-0.5" />
                <p>
                    DarkTidesResearch is a chemical supply and research organization. All compounds are strictly for in-vitro laboratory research use only. 
                    <span className="block mt-1 text-gray-400 font-bold">
                      Not for human consumption, veterinary use, or household application.
                    </span>
                    We do not dispense medications.
                </p>
            </div>
        </div>

      </div>
      <div className="mt-12 text-center text-[10px] text-gray-800 font-mono">
        SYSTEM VERSION 4.1.2 // ALL RIGHTS RESERVED
      </div>
    </footer>
  );
};

export default Footer;