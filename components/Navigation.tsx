
import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag } from 'lucide-react';
import Logo from './Logo';

interface NavProps {
  currentView: 'home' | 'store' | 'checkout';
  onNavigate: (view: 'home' | 'store' | 'checkout', sectionId?: string) => void;
  cartCount: number;
}

const Navigation: React.FC<NavProps> = ({ currentView, onNavigate, cartCount }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setMobileOpen(false);
    
    if (sectionId === 'store') {
      onNavigate('store');
    } else if (sectionId === 'checkout') {
      onNavigate('checkout');
    } else {
      onNavigate('home', sectionId);
    }
  };

  const navLinks = [
    { label: 'Catalog', id: 'store' },
    { label: 'Operations', id: 'about' },
    { label: 'Classifications', id: 'research' },
  ];

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-obsidian/90 backdrop-blur-md border-white/5 py-3' 
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <a href="#" onClick={(e) => handleLinkClick(e, '')} className="group">
          <Logo className="w-10 h-10 transition-transform duration-700 group-hover:rotate-180" />
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-12">
          {navLinks.map((link) => (
            <a 
              key={link.label} 
              href={`#${link.id}`}
              onClick={(e) => handleLinkClick(e, link.id)}
              className={`text-[10px] font-mono uppercase tracking-[0.2em] hover:text-white transition-colors duration-300 relative group ${
                currentView === link.id ? 'text-neon-blue' : 'text-gray-400'
              }`}
            >
              {link.label}
              <span className={`absolute -bottom-2 left-0 h-[1px] bg-neon-blue transition-all duration-300 ${
                 currentView === link.id ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </a>
          ))}
          
          <button 
            onClick={(e) => handleLinkClick(e, 'checkout')}
            className={`relative transition-colors ${currentView === 'checkout' ? 'text-neon-blue' : 'text-gray-400 hover:text-white'}`}
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-neon-blue text-[8px] font-bold text-obsidian items-center justify-center">
                  {cartCount}
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Overlay */}
      <div className={`md:hidden absolute top-full left-0 w-full bg-obsidian border-b border-white/10 transition-all duration-300 overflow-hidden ${mobileOpen ? 'max-h-64' : 'max-h-0'}`}>
        <div className="flex flex-col p-6 space-y-4">
          {navLinks.map((link) => (
            <a 
              key={link.label} 
              href={`#${link.id}`}
              className="text-[10px] font-mono uppercase tracking-widest text-gray-400 hover:text-white"
              onClick={(e) => handleLinkClick(e, link.id)}
            >
              {link.label}
            </a>
          ))}
          <a 
            href="#checkout"
            className="text-[10px] font-mono uppercase tracking-widest text-gray-400 hover:text-white"
            onClick={(e) => handleLinkClick(e, 'checkout')}
          >
            Review Cart ({cartCount})
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
