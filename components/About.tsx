import React from 'react';
import FadeIn from './FadeIn';

const About: React.FC = () => {
  return (
    <section id="about" className="py-24 md:py-32 px-6 bg-charcoal relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon-blue/20 to-transparent"></div>
      
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            
            <div className="md:col-span-4 border-l-2 border-neon-teal/30 pl-8 md:pl-0 md:border-l-0">
              <h2 className="text-sm font-mono text-neon-teal tracking-[0.3em] uppercase mb-4">Origin</h2>
              <div className="w-12 h-1 bg-gradient-to-r from-neon-teal to-transparent mb-8"></div>
              <h3 className="text-3xl font-bold text-white mb-6">Not a Clinic.<br/>A Research Facility.</h3>
            </div>

            <div className="md:col-span-8">
              <p className="text-gray-400 leading-loose mb-6">
                DarkTidesResearch operates in the shadows of conventional synthesis. We are not a pharmacy. We are a decentralized collective of biochemists and data scientists obsessed with the theoretical limits of metabolic signaling pathways.
              </p>
              <p className="text-gray-400 leading-loose">
                We develop frameworks. We model receptor interactions. We synthesize the compounds that define the next decade of biochemical research. While others iterate on what exists, we look for what is missing.
              </p>
              <p className="text-red-400/80 text-sm mt-4 font-mono border-l border-red-500/50 pl-4 bg-red-950/10 py-2 pr-2 inline-block">
                 WARNING: All compounds are for in-vitro laboratory research use only. Strictly not for human consumption.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default About;