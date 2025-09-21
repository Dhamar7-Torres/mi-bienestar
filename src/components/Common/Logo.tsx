import React from 'react';

interface LogoProps {
  position?: 'fixed' | 'relative';
  className?: string;
}

function Logo({ position = 'fixed', className = '' }: LogoProps) {
  const positionClasses = position === 'fixed' 
    ? 'absolute top-6 left-6 z-10' 
    : 'relative';

  return (
    <div className={`${positionClasses} ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <svg width="48" height="48" viewBox="0 0 48 48">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="22" fill="url(#logoGradient)" rx="24"/>
            <circle cx="32" cy="16" r="4" fill="#f97316"/>
            {/* Corazón */}
            <path d="M24 32c-1.5-1.5-8-6-8-12 0-3 2-5 5-5s5 2 5 5c0 0 0-3 0-5 0-3 2-5 5-5s5 2 5 5c0 6-6.5 10.5-8 12z" fill="white"/>
          </svg>
        </div>
        <div className="text-gray-800">
          <h1 className="text-xl font-bold">Bienestar</h1>
          <p className="text-sm font-medium text-gray-600">DACYTI</p>
        </div>
      </div>
    </div>
  );
}

export default Logo;