import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';

function Navigation() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Cerrar menú al presionar Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate(ROUTES.LOGIN);
  };

  // Definir navegación según el tipo de usuario
  const getNavigationItems = () => {
    if (usuario?.tipoUsuario === 'ESTUDIANTE') {
      return [
        { name: 'Mi Dashboard', href: ROUTES.STUDENT_DASHBOARD, icon: '🏠' },
        { name: 'Evaluación Semanal', href: ROUTES.STUDENT_EVALUATION, icon: '📝' },
        { name: 'Recursos', href: ROUTES.STUDENT_RESOURCES, icon: '📚' },
        { name: 'Historial', href: ROUTES.STUDENT_HISTORY, icon: '📊' }
      ];
    } else if (usuario?.tipoUsuario === 'COORDINADOR') {
      return [
        { name: 'Dashboard', href: ROUTES.COORDINATOR_DASHBOARD, icon: '📈' },
        { name: 'Estudiantes', href: ROUTES.COORDINATOR_STUDENTS, icon: '👥' },
        { name: 'Alertas', href: ROUTES.COORDINATOR_ALERTS, icon: '🚨' }
      ];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  const getRiskBadgeClass = (estadoRiesgo?: string) => {
    switch (estadoRiesgo) {
      case 'ALTO':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300 shadow-sm';
      case 'MEDIO':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300 shadow-sm';
      case 'BAJO':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300 shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 shadow-sm';
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Bienestar DACYTI */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <svg width="40" height="40" viewBox="0 0 48 48">
                    <defs>
                      <linearGradient id="navLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                    <circle cx="24" cy="24" r="20" fill="url(#navLogoGradient)" rx="20"/>
                    <circle cx="30" cy="15" r="3" fill="#f97316"/>
                    {/* Corazón */}
                    <path d="M24 30c-1.3-1.3-7-5-7-10 0-2.5 1.7-4 4.2-4s4.2 1.5 4.2 4c0 0 0-2.5 0-4 0-2.5 1.7-4 4.2-4s4.2 1.5 4.2 4c0 5-5.6 8.7-7 10z" fill="white"/>
                  </svg>
                </div>
                <div className="text-gray-800">
                  <h1 className="text-lg font-black tracking-tight">Bienestar</h1>
                  <p className="text-xs font-bold text-gray-600 -mt-1">DACYTI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navegación principal */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActiveRoute(item.href)
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 hover:shadow-md'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>

          {/* Menú de usuario */}
          <div className="flex items-center space-x-4">
            {/* Badge de estado de riesgo para estudiantes */}
            {usuario?.tipoUsuario === 'ESTUDIANTE' && usuario?.estudiante && (
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeClass(usuario.estudiante.estadoRiesgo)}`}>
                Riesgo {usuario.estudiante.estadoRiesgo}
              </div>
            )}

            {/* Menú desplegable de usuario */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 focus:outline-none bg-white/70 hover:bg-white/90 rounded-2xl px-3 py-2 transition-all duration-200 shadow-sm hover:shadow-md border border-white/30"
                aria-expanded={showUserMenu}
                aria-haspopup="true"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-sm font-bold text-white">
                    {usuario?.nombreCompleto?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-semibold">
                  {usuario?.nombreCompleto}
                </span>
                <svg 
                  className={`h-4 w-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Menú desplegable */}
              {showUserMenu && (
                <>
                  {/* Backdrop para móviles */}
                  <div 
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 z-50 overflow-hidden">
                    {/* Header del menú */}
                    <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-white/30">
                      <div className="font-bold text-gray-900 truncate">{usuario?.nombreCompleto}</div>
                      <div className="text-xs text-gray-600 truncate">{usuario?.correo}</div>
                      <div className="text-xs text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text capitalize font-semibold mt-1">
                        {usuario?.tipoUsuario?.toLowerCase()}
                      </div>
                    </div>
                    
                    {/* Información adicional del estudiante */}
                    {usuario?.tipoUsuario === 'ESTUDIANTE' && usuario?.estudiante && (
                      <div className="px-4 py-2 text-sm text-gray-600 border-b border-white/20 bg-white/30">
                        <div className="text-xs font-medium">
                          {usuario.estudiante.carrera} - {usuario.estudiante.semestre}° Semestre
                        </div>
                      </div>
                    )}
                    
                    {/* Información adicional del coordinador */}
                    {usuario?.tipoUsuario === 'COORDINADOR' && usuario?.coordinador && (
                      <div className="px-4 py-2 text-sm text-gray-600 border-b border-white/20 bg-white/30">
                        <div className="text-xs font-medium">
                          {usuario.coordinador.departamento}
                        </div>
                      </div>
                    )}

                    {/* Opciones del menú */}
                    <div className="py-2">
                      <Link
                        to={usuario?.tipoUsuario === 'ESTUDIANTE' ? ROUTES.STUDENT_PROFILE : ROUTES.COORDINATOR_PROFILE}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-white/50 transition-all duration-200 font-medium"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Mi Perfil
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 font-medium"
                      >
                        <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navegación móvil */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 bg-white/50 backdrop-blur-md border-t border-white/20">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`block px-3 py-2 rounded-2xl text-base font-semibold transition-all duration-200 ${
                isActiveRoute(item.href)
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/70 hover:shadow-md'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;