
import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';
import FadeIn from './FadeIn';

const AgeVerification: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const verified = sessionStorage.getItem('dt_age_verified');
    if (!verified) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    }
  }, []);

  const handleVerify = () => {
    sessionStorage.setItem('dt_age_verified', 'true');
    setIsVisible(false);
    document.body.style.overflow = 'unset';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 overflow-hidden">
      {/* Heavy Backdrop */}
      <div className="absolute inset-0 bg-obsidian/95 backdrop-blur-2xl" />
      
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/10 rounded-full blur-[120px]" />

      <FadeIn className="relative w-full max-w-lg z-10">
        <div className="glass-panel p-8 md:p-12 border-t-2 border-t-neon-blue/30 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col items-center text-center space-y-8">
            <Logo className="w-16 h-16" showText={false} />
            
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tighter uppercase">
                Access Protocol Required
              </h2>
            </div>

            <div className="space-y-6 text-gray-400 font-light leading-relaxed">
              <div className="p-4 bg-white/5 border border-white/10 rounded space-y-3">
                <p className="text-sm font-semibold text-white">Are you 18 or over?</p>
                <p className="text-xs">
                  By entering this site, you confirm that you are at least 18 years of age and agree to the following terms and conditions.
                </p>
              </div>

              <div className="flex items-start gap-3 text-left p-4 bg-red-950/20 border border-red-900/30 rounded">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed uppercase tracking-tight text-red-400/80">
                  The products available on this website are for legitimate research purposes only. They are not intended to diagnose, treat, cure, or prevent any medical conditions, and are not for human consumption.
                </p>
              </div>
            </div>

            <button
              onClick={handleVerify}
              className="w-full group bg-neon-blue hover:bg-neon-blue/90 text-obsidian font-bold py-4 px-8 uppercase tracking-[0.2em] text-xs transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-neon-blue/20"
            >
              <CheckCircle2 className="w-4 h-4 transition-transform group-hover:scale-110" />
              Yes, I am over 18
            </button>
            
            <div className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">
              Digital Signature Required for Entry
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default AgeVerification;
