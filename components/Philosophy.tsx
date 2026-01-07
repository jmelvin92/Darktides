
import React from 'react';
import FadeIn from './FadeIn';

const Philosophy: React.FC = () => {
  return (
    <section id="philosophy" className="py-32 px-6 bg-obsidian relative overflow-hidden">
      {/* Background glow spot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10 text-center">
        <FadeIn>
          <div className="mb-12">
            <span className="text-neon-teal font-mono text-xs tracking-[0.4em] uppercase">Operational Logic</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-12 uppercase tracking-tighter">
            Analytical Purity. <br/>Logistical Precision.
          </h2>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="space-y-8 text-lg text-gray-400 font-light leading-relaxed">
            <p>
              In laboratory inquiry, the variable is the enemy. DarkTidesResearch exists to eliminate uncertainty in the procurement of high-purity chemical reagents.
            </p>
            <p>
              We prioritize consistency over trends. This is high-level supply for those who understand that valid research requires absolute baseline precision, removing procurement variables for the research community.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={400} className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/10 pt-8">
            <div className="text-center">
              <h4 className="text-white font-mono text-xs uppercase tracking-widest font-bold mb-2">Purity</h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">99% Standard</p>
            </div>
            <div className="text-center">
              <h4 className="text-white font-mono text-xs uppercase tracking-widest font-bold mb-2">Integrity</h4>
              <p className="text-[10px] text-gray-600 uppercase tracking-wide">Cold Chain Ready</p>
            </div>
            <div className="text-center">
              <h4 className="text-white font-mono text-xs uppercase tracking-widest font-bold mb-2">Access</h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Verified Supply</p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Philosophy;
