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
            <span className="text-neon-teal font-mono text-xs tracking-[0.4em] uppercase">Manifesto</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-12">
            "We’re not here to follow trends. We’re here to engineer what comes after them."
          </h2>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="space-y-8 text-lg text-gray-400 font-light leading-relaxed">
            <p>
              The industry chases hype. We chase precision. While others compromise purity for mass appeal, DarkTidesResearch focuses on the singular outcome of analytical purity.
            </p>
            <p>
              We believe in controlled innovation. Anti-hype. Pro-precision. This is deep-level chemical analysis for those who understand that research requires absolute precision, not approximation.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={400} className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-white/10 pt-8">
            <div className="text-center">
              <h4 className="text-white font-bold mb-2">Precision</h4>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Zero Variance</p>
            </div>
            <div className="text-center">
              <h4 className="text-white font-bold mb-2">Depth</h4>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Below Surface</p>
            </div>
            <div className="text-center">
              <h4 className="text-white font-bold mb-2">Intelligence</h4>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Data Driven</p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Philosophy;