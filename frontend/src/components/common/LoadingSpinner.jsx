import React from 'react';
import { Activity } from 'lucide-react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`animate-spin rounded-full border-3 border-primary-200 border-t-primary-600 ${sizes[size]}`}>
      </div>
    </div>
  );
};

export const LoadingPage = ({ message = 'Cargando...' }) => (
  <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
    <div className="text-center animate-fade-in">
      {/* Logo animado */}
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-strong mx-auto">
          <Activity className="h-10 w-10 text-white animate-pulse-soft" />
        </div>
        {/* Círculo de carga alrededor del logo */}
        <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
      </div>
      
      {/* Mensaje */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Mi Bienestar DACYTI</h2>
        <p className="text-gray-600 font-medium">{message}</p>
        
        {/* Barra de progreso animada */}
        <div className="w-64 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-pulse-soft"></div>
          </div>
        </div>
      </div>
      
      {/* Indicadores de carga */}
      <div className="flex justify-center space-x-2 mt-6">
        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
);

// Componente de carga para contenido
export const LoadingContent = ({ lines = 3, className = '' }) => (
  <div className={`animate-fade-in ${className}`}>
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="loading-pulse h-4 rounded" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
      ))}
    </div>
  </div>
);

// Componente de carga para tarjetas
export const LoadingCard = ({ className = '' }) => (
  <div className={`card ${className}`}>
    <div className="card-content">
      <div className="animate-fade-in space-y-4">
        <div className="loading-pulse h-6 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="loading-pulse h-4 rounded"></div>
          <div className="loading-pulse h-4 rounded w-5/6"></div>
          <div className="loading-pulse h-4 rounded w-4/6"></div>
        </div>
        <div className="flex space-x-2">
          <div className="loading-pulse h-8 w-20 rounded"></div>
          <div className="loading-pulse h-8 w-16 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

// Spinner inline pequeño
export const InlineSpinner = ({ className = '' }) => (
  <div className={`inline-flex items-center ${className}`}>
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-200 border-t-primary-600"></div>
  </div>
);

// Overlay de carga
export const LoadingOverlay = ({ show = false, message = 'Cargando...' }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 shadow-strong max-w-sm mx-4">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-gray-900 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};