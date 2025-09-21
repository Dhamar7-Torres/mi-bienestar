import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

function Loading({ 
  message = 'Cargando...', 
  size = 'md',
  fullScreen = false 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-gradient-to-br from-sky-200 via-cyan-300 to-white flex items-center justify-center z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses} style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Logo en esquina superior izquierda solo cuando es fullScreen */}
      {fullScreen && (
        <div className="absolute top-6 left-6">
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
      )}

      {/* Contenido principal */}
      <div className={fullScreen ? "bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20" : ""}>
        <div className="text-center">
          {/* Spinner moderno */}
          <div className="relative mx-auto mb-6">
            <div className={`${sizeClasses[size]} mx-auto`}>
              <svg className="animate-spin h-full w-full text-teal-500" fill="none" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            
            {/* Puntos decorativos animados */}
            {fullScreen && (
              <div className="flex justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse delay-200"></div>
              </div>
            )}
          </div>
          
          {/* Mensaje */}
          {message && (
            <div>
              <p className={`text-gray-700 font-semibold ${fullScreen ? 'text-lg' : 'text-sm mt-4'}`}>
                {message}
              </p>
              {fullScreen && (
                <p className="text-teal-600 text-sm font-medium mt-2">
                  Plataforma Bienestar DACYTI
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Elementos decorativos solo en fullScreen */}
      {fullScreen && (
        <>
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-cyan-300/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-4 w-24 h-24 bg-blue-400/15 rounded-full blur-lg"></div>
        </>
      )}
    </div>
  );
}

export default Loading;