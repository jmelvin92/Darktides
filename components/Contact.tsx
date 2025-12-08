import React, { useState } from 'react';
import FadeIn from './FadeIn';
import { ChevronRight, Lock } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    interest: 'GLP-1'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    alert('Request intercepted. We will contact you if your clearance is approved.');
  };

  return (
    <section id="contact" className="py-32 px-6 relative overflow-hidden">
       {/* Background accent */}
       <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-neon-blue/5 to-transparent pointer-events-none"></div>

       <div className="max-w-xl mx-auto relative z-10">
         <FadeIn>
           <div className="text-center mb-12">
             <h2 className="text-3xl font-bold text-white mb-4">Request Access</h2>
             <p className="text-gray-400 text-sm">Join the wave. Entrance is limited to qualified researchers and selected institutional candidates.</p>
           </div>
         </FadeIn>

         <FadeIn delay={200}>
           <form onSubmit={handleSubmit} className="glass-panel p-8 md:p-12 space-y-8 relative border-t-2 border-t-neon-blue/20">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[2px] bg-neon-blue blur-[2px]"></div>

             <div className="group">
               <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-neon-blue transition-colors">Name</label>
               <input 
                 type="text" 
                 name="name"
                 required
                 className="w-full bg-transparent border-b border-gray-700 py-2 text-white focus:outline-none focus:border-neon-blue transition-colors rounded-none placeholder-gray-700 font-light"
                 placeholder="IDENTIFIER"
                 onChange={handleChange}
               />
             </div>

             <div className="group">
               <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-neon-blue transition-colors">Secure Email</label>
               <input 
                 type="email" 
                 name="email"
                 required
                 className="w-full bg-transparent border-b border-gray-700 py-2 text-white focus:outline-none focus:border-neon-blue transition-colors rounded-none placeholder-gray-700 font-light"
                 placeholder="CONTACT VECTOR"
                 onChange={handleChange}
               />
             </div>

             <div className="group">
               <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-2 group-focus-within:text-neon-blue transition-colors">Area of Interest</label>
               <select 
                 name="interest"
                 className="w-full bg-transparent border-b border-gray-700 py-2 text-white focus:outline-none focus:border-neon-blue transition-colors rounded-none [&>option]:bg-obsidian font-light"
                 onChange={handleChange}
               >
                 <option value="GLP-1">GLP-1 Research</option>
                 <option value="Metabolic">Metabolic Systems</option>
                 <option value="Endocrine">Endocrine Optimization</option>
                 <option value="Partnership">Institutional Partnership</option>
               </select>
             </div>
             
             <div className="p-3 bg-red-950/20 border border-red-900/30 rounded flex items-start gap-3">
                <span className="text-red-500 font-mono text-xs font-bold mt-1">WARNING:</span>
                <p className="text-xs text-red-400/70 leading-relaxed">
                  By requesting access, you confirm you are a qualified researcher. Products are strictly not for human consumption.
                </p>
             </div>

             <button type="submit" className="w-full bg-white/5 border border-white/10 text-white py-4 font-mono text-sm tracking-[0.2em] uppercase hover:bg-neon-blue/10 hover:border-neon-blue hover:text-neon-blue transition-all duration-300 flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(0,0,0,0.5)]">
               Initiate Protocol
               <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
             </button>

             <div className="flex items-center justify-center gap-2 text-[10px] text-gray-600 font-mono mt-6">
                <Lock className="w-3 h-3 text-neon-teal/50" />
                <span className="text-neon-teal/50">ENCRYPTED TRANSMISSION</span>
             </div>
           </form>
         </FadeIn>
       </div>
    </section>
  );
};

export default Contact;