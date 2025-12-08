import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", showText = true }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative text-white ${className}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          {/* Outer Circle */}
          <circle cx="50" cy="50" r="45" />
          
          {/* Top Wave */}
          <path d="M25 45 C 40 35, 50 35, 60 45 S 80 45, 80 40" />
          
          {/* Middle Wave */}
          <path d="M25 60 C 40 50, 50 50, 60 60 S 80 60, 80 55" />
          
          {/* Bottom Wave - Short segment */}
          <path d="M35 75 C 45 70, 55 70, 65 75" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <span className="font-sans font-bold text-white tracking-[0.15em] leading-none text-lg">
            DARKTIDES
          </span>
          <span className="font-sans font-medium text-gray-400 tracking-[0.4em] leading-none text-[0.6rem] mt-1 ml-0.5">
            RESEARCH
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;