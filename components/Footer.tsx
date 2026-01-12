
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Logo from './Logo';
import { BrandTheme } from '../theme';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black py-12 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        
        <div className="flex flex-col items-center md:items-start gap-4">
          <Logo className="w-8 h-8" />
          <p className="text-gray-600 text-[10px] font-mono tracking-widest mt-2">
            EST. 2024 // DEEP SECTOR // VER: {BrandTheme.version}
          </p>
          <div className="mt-4">
            <a 
              href="https://t.me/darktidesresearch1" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-neon-blue/10 hover:border-neon-blue transition-all duration-300 group"
              aria-label="Join our Telegram channel"
            >
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-neon-blue transition-colors" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="max-w-md text-center md:text-right">
            <div className="flex items-start gap-3 justify-center md:justify-end text-gray-500 text-xs leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-neon-teal shrink-0 mt-0.5" />
                <p>
                    {BrandTheme.name} is a chemical supply and research organization. All compounds are strictly for in-vitro laboratory research use only. 
                    <span className="block mt-1 text-gray-400 font-bold">
                      Not for human consumption, veterinary use, or household application.
                    </span>
                    We do not dispense medications.
                </p>
            </div>
        </div>

      </div>
      <div className="mt-12 text-center text-[10px] text-gray-800 font-mono">
        SYSTEM DEPLOYMENT: {BrandTheme.version} // ALL RIGHTS RESERVED
      </div>
    </footer>
  );
};

export default Footer;
