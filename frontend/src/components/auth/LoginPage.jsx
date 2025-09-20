import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle, Activity } from 'lucide-react';

export const LoginPage = ({ onLogin, onGoToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Llamar al método login del useAuth que ahora usa el backend
      const result = await onLogin(formData.email, formData.password);
      
      if (!result.success) {
        setErrors({ general: result.error });
      }
      // Si es exitoso, onLogin se encarga del redireccionamiento
      
    } catch (error) {
      setErrors({ general: 'Error al iniciar sesión. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-soft transform hover:scale-105 transition-transform duration-300">
              <Activity className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Mi Bienestar DACYTI
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            Sistema de detección automática de factores de riesgo psicosocial en estudiantes de alto rendimiento
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-strong border border-gray-100 p-8 mb-6">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Iniciar Sesión
            </h2>
            <p className="text-gray-600">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error general */}
            {errors.general && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0" />
                <p className="text-danger-700 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input pl-11 ${errors.email ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="tu@email.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600">{errors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`input pl-11 pr-11 ${errors.password ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600">{errors.password}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-primary-400 disabled:to-primary-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Registro Link */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-6 text-center">
          <p className="text-gray-600 mb-4">¿No tienes una cuenta?</p>
          <button
            onClick={onGoToRegister}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
          >
            <UserPlus className="h-5 w-5" />
            <span>Crear Nueva Cuenta</span>
          </button>
        </div>

        {/* Features Preview */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Sistema de Bienestar Estudiantil</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Evaluaciones</p>
              <p className="text-xs text-gray-600">Seguimiento semanal</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Alertas</p>
              <p className="text-xs text-gray-600">Detección temprana</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">
            Sistema de detección de factores de riesgo psicosocial
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
            <span>Versión 1.0.0</span>
            <span>•</span>
            <span>DACYTI</span>
          </div>
        </div>
      </div>
    </div>
  );
};