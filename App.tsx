
import React, { useState } from 'react';
import WaveBackground from './components/WaveBackground';
import GridBackground from './components/GridBackground';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Research from './components/Research';
import Store from './components/Store';
import Philosophy from './components/Philosophy';
import Contact from './components/Contact';
import Footer from './components/Footer';

type ViewState = 'home' | 'store';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');

  const handleNavigate = (view: ViewState, sectionId?: string) => {
    setCurrentView(view);
    
    if (view === 'home' && sectionId) {
      // Allow time for DOM to update if switching from store to home
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else if (view === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'store') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-obsidian text-slate-200 selection:bg-neon-blue selection:text-obsidian relative">
      <WaveBackground />
      <GridBackground />
      <Navigation currentView={currentView} onNavigate={handleNavigate} />
      
      <main className="relative z-10 flex flex-col gap-0 min-h-screen">
        {currentView === 'home' ? (
          <>
            <Hero onEnterLab={() => handleNavigate('store')} />
            <About />
            <Research />
            <Philosophy />
            <Contact />
          </>
        ) : (
          <Store onBack={() => handleNavigate('home')} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
