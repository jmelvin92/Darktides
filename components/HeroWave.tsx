import React from 'react';

const HeroWave: React.FC = () => {
  return (
    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-0 pointer-events-none opacity-60">
      <svg 
        className="relative block w-[calc(100%+100px)] h-[80px] md:h-[150px]" 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 24 150 28" 
        preserveAspectRatio="none"
      >
        <defs>
          <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
        </defs>
        <g className="parallax">
          <use xlinkHref="#gentle-wave" x="48" y="0" className="fill-neon-blue/5 animate-wave-slow" />
          <use xlinkHref="#gentle-wave" x="48" y="3" className="fill-neon-teal/5 animate-wave-slower" style={{ animationDelay: '-2s' }} />
          <use xlinkHref="#gentle-wave" x="48" y="5" className="fill-neon-blue/5 animate-wave-fast" style={{ animationDelay: '-4s' }} />
          <use xlinkHref="#gentle-wave" x="48" y="7" className="fill-neon-teal/5 animate-wave-slow" style={{ animationDelay: '-6s' }} />
        </g>
      </svg>
    </div>
  );
};

export default HeroWave;