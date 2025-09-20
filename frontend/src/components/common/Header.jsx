import React from 'react';
import { Bell, User, Menu, LogOut, Activity } from 'lucide-react';

export const Header = ({ 
  title, 
  user = null, 
  alertsCount = 0, 
  onMenuToggle,
  onNotificationsClick,
  onLogout 
}) => {
  return (
    <header className="navbar">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Menu toggle button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 focus-ring"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Logo and title */}
            <div className="flex items-center ml-4 lg:ml-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                {title}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button
              onClick={onNotificationsClick}
              className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 focus-ring"
            >
              <Bell className="h-6 w-6" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-danger-500 rounded-full transform scale-110 animate-pulse-soft">
                  {alertsCount > 99 ? '99+' : alertsCount}
                </span>
              )}
            </button>
            
            {/* User info and actions */}
            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
              {/* User avatar */}
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm ring-2 ring-white">
                <User className="h-5 w-5 text-white" />
              </div>
              
              {/* User info */}
              {user && (
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-32 lg:max-w-none">
                    {user.nombre}
                  </p>
                  <p className="text-xs text-gray-600 truncate max-w-32 lg:max-w-none">
                    {user.email}
                  </p>
                </div>
              )}
              
              {/* User role badge */}
              {user && (
                <div className="hidden md:block">
                  <span className={`badge text-xs ${
                    user.role === 'admin' 
                      ? 'badge-primary' 
                      : 'badge-success'
                  }`}>
                    {user.role === 'admin' ? 'Coordinador' : 'Estudiante'}
                  </span>
                </div>
              )}
              
              {/* Logout button */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2.5 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-xl transition-all duration-200 focus-ring group"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};