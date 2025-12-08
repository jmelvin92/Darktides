
import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag } from 'lucide-react';
import Logo from './Logo';
import { NavProps } from '../types';

const Navigation: React.FC<NavProps> = ({ currentView, onNavigate }) => {
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
    } else {
      onNavigate('home', sectionId);
    }
  };

  const navLinks = [
    { label: 'Store', id: 'store' },
    { label: 'Research', id: 'research' },
    { label: 'Philosophy', id: 'philosophy' },
    { label: 'Access', id: 'contact' },
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
              className={`text-xs font-mono uppercase tracking-widest hover:text-white transition-colors duration-300 relative group ${
                currentView === 'store' && link.id === 'store' ? 'text-neon-blue' : 'text-gray-400'
              }`}
            >
              {link.label}
              <span className={`absolute -bottom-2 left-0 h-[1px] bg-neon-blue transition-all duration-300 ${
                 currentView === 'store' && link.id === 'store' ? 'w-full' : 'w-0 group-hover:w-full'
              }`}></span>
            </a>
          ))}
          
          <button className="relative text-gray-400 hover:text-white transition-colors">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-blue"></span>
            </span>
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
              className="text-sm font-mono uppercase tracking-widest text-gray-400 hover:text-white"
              onClick={(e) => handleLinkClick(e, link.id)}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
