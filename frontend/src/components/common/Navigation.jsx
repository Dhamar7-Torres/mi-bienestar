import React from 'react';
import { BarChart3, Users, AlertTriangle, BookOpen, Home, Activity } from 'lucide-react';

export const Navigation = ({ activeView, onViewChange, userRole = 'student' }) => {
  const studentMenuItems = [
    { id: 'dashboard', label: 'Mi Dashboard', icon: Home, description: 'Resumen y estadísticas' },
    { id: 'evaluation', label: 'Evaluación Semanal', icon: BarChart3, description: 'Completa tu evaluación' },
    { id: 'resources', label: 'Recursos de Apoyo', icon: BookOpen, description: 'Material de ayuda' }
  ];
  
  const adminMenuItems = [
    { id: 'summary', label: 'Resumen General', icon: BarChart3, description: 'Vista general del sistema' },
    { id: 'students', label: 'Lista de Estudiantes', icon: Users, description: 'Gestión de estudiantes' },
    { id: 'alerts', label: 'Sistema de Alertas', icon: AlertTriangle, description: 'Monitoreo de alertas' },
    { id: 'resources-admin', label: 'Gestión de Recursos', icon: BookOpen, description: 'Administrar recursos' }
  ];
  
  const menuItems = userRole === 'admin' ? adminMenuItems : studentMenuItems;
  
  return (
    <nav className="sidebar scroll-container">
      <div className="p-4">
        {/* User role indicator */}
        <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl border border-primary-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center shadow-sm">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-primary-900 text-sm">
                {userRole === 'admin' ? 'Panel Coordinador' : 'Panel Estudiante'}
              </p>
              <p className="text-xs text-primary-700">
                {userRole === 'admin' ? 'Administración' : 'Mi Bienestar'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation menu */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Navegación
          </p>
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <div key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`
                    group w-full flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-[1.02]' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.01]'
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 opacity-20"></div>
                  )}
                  
                  {/* Icon */}
                  <div className={`
                    relative flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-all duration-200
                    ${isActive 
                      ? 'bg-white/20 shadow-sm' 
                      : 'bg-gray-100 group-hover:bg-gray-200'
                    }
                  `}>
                    <Icon className={`h-5 w-5 transition-all duration-200 ${
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-600 group-hover:text-gray-700'
                    }`} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 text-left relative">
                    <div className={`font-medium transition-all duration-200 ${
                      isActive ? 'text-white' : 'text-gray-900 group-hover:text-gray-900'
                    }`}>
                      {item.label}
                    </div>
                    <div className={`text-xs mt-0.5 transition-all duration-200 ${
                      isActive ? 'text-white/80' : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                      {item.description}
                    </div>
                  </div>

                  {/* Active dot */}
                  {isActive && (
                    <div className="flex-shrink-0 w-2 h-2 bg-white rounded-full shadow-sm animate-pulse-soft"></div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border">
          <div className="text-center">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
              <Activity className="h-4 w-4 text-gray-600" />
            </div>
            <p className="text-xs font-medium text-gray-900 mb-1">Mi Bienestar DACYTI</p>
            <p className="text-xs text-gray-500">Sistema de Bienestar</p>
            <p className="text-xs text-gray-400 mt-1">v1.0.0</p>
          </div>
        </div>
      </div>
    </nav>
  );
};