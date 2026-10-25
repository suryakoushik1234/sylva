import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size];

  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Simple leaf-mark logo */}
      <div className={`relative ${sizeClasses} flex items-center justify-center flex-shrink-0`}>
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Main leaf body */}
          <path
            d="M 18,3 C 9,8 5,17 7,27 C 10,29 17,29 25,23 C 31,16 30,7 18,3 Z"
            fill="#34796E"
          />
          {/* Inner accent leaflet */}
          <path
            d="M 18,3 C 24,10 24,19 16,25 C 22,23 27,17 26,10 C 24,6 21,4 18,3 Z"
            fill="#A5C9BC"
            opacity="0.9"
          />
          {/* Leaf stem & spine */}
          <path
            d="M 18,5 Q 16,18 9,33"
            stroke="#EFF4F2"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {!iconOnly && (
        <span
          className={`font-semibold tracking-tight text-[#203A37] ${textSizes}`}
          style={{ letterSpacing: '-0.03em' }}
        >
          Sylva
        </span>
      )}
    </div>
  );
};
