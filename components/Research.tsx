
import React from 'react';
import { Microscope, Activity, Database, Package, ArrowUpRight } from 'lucide-react';
import FadeIn from './FadeIn';
import { FeatureCardProps } from '../types';

const Card: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, delay }) => (
  <FadeIn delay={delay} className="h-full">
    <div className="glass-panel p-8 h-full rounded-sm hover:bg-neon-blue/5 border border-white/5 hover:border-neon-blue/20 transition-all duration-500 group relative overflow-hidden">
      
      {/* Subtle Gradient Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
        <ArrowUpRight className="text-neon-blue w-5 h-5" />
      </div>
      
      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-neon-blue/10 transition-all duration-500">
        <Icon className="text-neon-blue w-6 h-6" />
      </div>
      
      <h3 className="text-lg font-bold text-white mb-4 font-sans uppercase tracking-wider group-hover:text-neon-blue transition-colors duration-300">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors font-light">{description}</p>
      
      <div className="mt-6 flex items-center space-x-2">
        <span className="h-px w-8 bg-gray-700 group-hover:bg-neon-teal transition-colors duration-500"></span>
        <span className="text-[10px] font-mono text-gray-600 group-hover:text-neon-teal uppercase tracking-widest transition-colors duration-500">Inventory Status</span>
      </div>
    </div>
  </FadeIn>
);

const Research: React.FC = () => {
  const features = [
    {
      title: "Metabolic Vectors",
      description: "Standardized reference materials for investigating receptor agonism in metabolic signaling pathways and cellular energy models.",
      icon: Activity,
      delay: 0
    },
    {
      title: "Analytical Samples",
      description: "High-affinity binding compounds provided in stable lyophilized form for verified laboratory storage and transit.",
      icon: Package,
      delay: 200
    },
    {
      title: "Inventory Integrity",
      description: "Third-party analytical verification provided for all cataloged lots to ensure zero-variance research outcomes.",
      icon: Database,
      delay: 400
    },
    {
      title: "Ligand Selection",
      description: "Specific chemical ligands for targeted investigation of receptor selectivity and signal transduction in test environments.",
      icon: Microscope,
      delay: 600
    }
  ];

  return (
    <section id="research" className="py-32 px-6 relative">
      {/* Background Accent */}
      <div className="absolute right-0 top-1/3 w-[500px] h-[500px] bg-neon-teal/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-20 text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 uppercase tracking-tight">Catalog Classifications</h2>
            <p className="text-gray-500 max-w-xl mx-auto font-light font-mono text-xs uppercase tracking-widest">
              Primary chemical classifications for laboratory distribution.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Card key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Research;
