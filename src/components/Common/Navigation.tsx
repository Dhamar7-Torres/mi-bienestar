import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';

function Navigation() {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
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
        // Removido: { name: 'Reportes', href: ROUTES.COORDINATOR_REPORTS, icon: '📋' }
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
        return 'riesgo-alto';
      case 'MEDIO':
        return 'riesgo-medio';
      case 'BAJO':
        return 'riesgo-bajo';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">
                Sistema de Riesgo Psicosocial
              </h1>
            </div>
          </div>

          {/* Navegación principal */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActiveRoute(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeClass(usuario.estudiante.estadoRiesgo)}`}>
                Riesgo {usuario.estudiante.estadoRiesgo}
              </div>
            )}

            {/* Menú desplegable de usuario */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {usuario?.nombreCompleto?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {usuario?.nombreCompleto}
                </span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Menú desplegable */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                    <div className="font-medium text-gray-900">{usuario?.nombreCompleto}</div>
                    <div className="text-xs">{usuario?.correo}</div>
                    <div className="text-xs text-blue-600 capitalize">
                      {usuario?.tipoUsuario?.toLowerCase()}
                    </div>
                  </div>
                  
                  {usuario?.tipoUsuario === 'ESTUDIANTE' && usuario?.estudiante && (
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                      <div className="text-xs">
                        {usuario.estudiante.carrera} - {usuario.estudiante.semestre}° Semestre
                      </div>
                    </div>
                  )}
                  
                  {usuario?.tipoUsuario === 'COORDINADOR' && usuario?.coordinador && (
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
                      <div className="text-xs">
                        {usuario.coordinador.departamento}
                      </div>
                    </div>
                  )}

                  <Link
                    to={usuario?.tipoUsuario === 'ESTUDIANTE' ? ROUTES.STUDENT_PROFILE : ROUTES.COORDINATOR_PROFILE}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Mi Perfil
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navegación móvil */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                isActiveRoute(item.href)
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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