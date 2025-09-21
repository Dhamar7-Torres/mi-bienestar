import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';
import Loading from '../Common/Loading';

function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    tipoUsuario: '' as 'ESTUDIANTE' | 'COORDINADOR' | ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    clearError();
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.tipoUsuario) {
      errors.tipoUsuario = 'Selecciona si eres estudiante o coordinador';
    }
    
    if (!formData.correo) {
      errors.correo = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.correo)) {
      errors.correo = 'Ingresa un correo válido';
    }
    
    if (!formData.contrasena) {
      errors.contrasena = 'La contraseña es obligatoria';
    } else if (formData.contrasena.length < 6) {
      errors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login(formData.correo, formData.contrasena);
      // La redirección se maneja automáticamente en App.tsx
    } catch (error) {
      // El error se maneja en el contexto
      console.error('Error en login:', error);
    }
  };

  if (isLoading) {
    return <Loading message="Iniciando sesión..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-cyan-300 to-white" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Logo en esquina superior izquierda */}
      <div className="absolute top-6 left-6 z-10">
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

      {/* Contenido principal centrado */}
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            
            {/* Icono principal */}
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-teal-400 to-blue-500 rounded-3xl flex items-center justify-center mb-6 relative shadow-lg">
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full"></div>
                <svg className="w-10 h-10 text-white transform rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Iniciar Sesión</h2>
              <p className="text-gray-600 mb-2 font-medium">Sistema de Detección de Riesgo Psicosocial</p>
              <p className="text-teal-600 font-semibold">Plataforma Bienestar DACYTI</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-3xl">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{error}</span>
                  </div>
                </div>
              )}

              {/* Tipo de Usuario */}
              <div>
                <label className="flex items-center text-gray-700 font-semibold mb-3">
                  <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Tipo de Usuario
                </label>
                <select
                  name="tipoUsuario"
                  value={formData.tipoUsuario}
                  onChange={handleChange}
                  className={`w-full px-4 py-4 border rounded-3xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 appearance-none font-medium ${formErrors.tipoUsuario ? 'border-red-300' : 'border-gray-200'}`}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="ESTUDIANTE">🎓 Estudiante</option>
                  <option value="COORDINADOR">👩‍💼 Coordinador</option>
                </select>
                {formErrors.tipoUsuario && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.tipoUsuario}</p>
                )}
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="flex items-center text-gray-700 font-semibold mb-3">
                  <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="tu-correo@universidad.edu"
                  className={`w-full px-4 py-4 border rounded-3xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 font-medium ${formErrors.correo ? 'border-red-300' : 'border-gray-200'}`}
                />
                {formErrors.correo && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.correo}</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label className="flex items-center text-gray-700 font-semibold mb-3">
                  <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    placeholder="Ingresa tu contraseña"
                    className={`w-full px-4 py-4 pr-12 border rounded-3xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 font-medium ${formErrors.contrasena ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.758 7.758M12 12l2.122 2.122L16.242 16.242M12 12V9.878m-4.242 4.243L9.878 9.878m4.242 4.242L12 12m4.243 4.243L9.878 9.878" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formErrors.contrasena && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.contrasena}</p>
                )}
              </div>

              {/* Botón de envío */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold py-4 px-6 rounded-3xl hover:from-teal-600 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-teal-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>

              {/* Link de registro */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <Link
                    to={ROUTES.REGISTER}
                    className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors duration-200"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;