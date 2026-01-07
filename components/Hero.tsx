
import React from 'react';
import { ArrowRight } from 'lucide-react';
import FadeIn from './FadeIn';
import Logo from './Logo';
import HeroWave from './HeroWave';
import { HeroProps } from '../types';

const Hero: React.FC<HeroProps> = ({ onEnterLab }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-gradient-to-b from-obsidian via-obsidian to-deep-ocean/30">
      
      {/* Background Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none select-none mix-blend-screen scale-150 md:scale-100">
        <Logo className="w-[800px] h-[800px]" showText={false} />
      </div>

      <div className="max-w-5xl mx-auto z-10 text-center md:text-left mt-20 relative">
        <FadeIn delay={400}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 leading-tight">
            Precision <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue/80 to-neon-teal/80">
              Reference
            </span> <br/>
            Materials.
          </h1>
        </FadeIn>

        <FadeIn delay={600}>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl font-light mb-12 leading-relaxed border-l-2 border-neon-blue/30 pl-6">
            DarkTidesResearch provides high-purity laboratory reagents for analytical inquiry. Optimized for consistency and verifiable research standards.
          </p>
        </FadeIn>

        <FadeIn delay={800} className="flex flex-col md:flex-row gap-6">
          <button 
            onClick={onEnterLab}
            className="group relative px-8 py-4 bg-neon-blue/10 backdrop-blur-sm border border-neon-blue/20 text-white font-mono text-sm tracking-widest uppercase hover:bg-neon-blue/20 hover:border-neon-blue/50 transition-all duration-300 btn-glow flex items-center justify-center gap-3 w-fit"
          >
            Enter The Lab
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-neon-blue" />
          </button>
        </FadeIn>
      </div>

      {/* Decorative background elements */}
      <div className="absolute bottom-20 right-10 hidden md:block z-20">
         <div className="flex flex-col space-y-2 text-right">
            <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Inventory Status</span>
            <span className="text-xs font-mono text-neon-blue">Active // Verified</span>
            <span className="text-[10px] font-mono text-gray-600 mt-2 uppercase tracking-widest">Protocol</span>
            <span className="text-xs font-mono text-neon-teal">Laboratory Only</span>
         </div>
      </div>
      
      <HeroWave />
    </section>
  );
};

export default Hero;
