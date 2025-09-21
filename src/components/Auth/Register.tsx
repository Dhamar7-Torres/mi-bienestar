import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants';
import type { DatosRegistro } from '../../types';
import Loading from '../Common/Loading';

function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    correo: '',
    contrasena: '',
    confirmarContrasena: '',
    tipoUsuario: '' as 'ESTUDIANTE' | 'COORDINADOR' | '',
    // Campos específicos para estudiantes
    carrera: '',
    semestre: '',
    // Campos específicos para coordinadores
    departamento: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    
    if (!formData.nombreCompleto.trim()) {
      errors.nombreCompleto = 'El nombre completo es obligatorio';
    } else if (formData.nombreCompleto.trim().length < 2) {
      errors.nombreCompleto = 'El nombre debe tener al menos 2 caracteres';
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
    
    if (!formData.confirmarContrasena) {
      errors.confirmarContrasena = 'Confirma tu contraseña';
    } else if (formData.contrasena !== formData.confirmarContrasena) {
      errors.confirmarContrasena = 'Las contraseñas no coinciden';
    }
    
    if (!formData.tipoUsuario) {
      errors.tipoUsuario = 'Selecciona si eres estudiante o coordinador';
    }
    
    // Validaciones específicas para estudiantes
    if (formData.tipoUsuario === 'ESTUDIANTE') {
      if (!formData.carrera.trim()) {
        errors.carrera = 'La carrera es obligatoria';
      }
      
      if (!formData.semestre) {
        errors.semestre = 'El semestre es obligatorio';
      } else if (parseInt(formData.semestre) < 1 || parseInt(formData.semestre) > 12) {
        errors.semestre = 'El semestre debe ser entre 1 y 12';
      }
    }
    
    // Validaciones específicas para coordinadores
    if (formData.tipoUsuario === 'COORDINADOR') {
      if (!formData.departamento.trim()) {
        errors.departamento = 'El departamento es obligatorio';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const registrationData: DatosRegistro = {
        nombreCompleto: formData.nombreCompleto.trim(),
        correo: formData.correo,
        contrasena: formData.contrasena,
        tipoUsuario: formData.tipoUsuario
      } as DatosRegistro;

      // Agregar campos específicos según el tipo de usuario
      if (formData.tipoUsuario === 'ESTUDIANTE') {
        (registrationData as any).carrera = formData.carrera.trim();
        (registrationData as any).semestre = parseInt(formData.semestre);
      } else if (formData.tipoUsuario === 'COORDINADOR') {
        (registrationData as any).departamento = formData.departamento.trim();
      }

      await register(registrationData);
      // La redirección se maneja automáticamente en App.tsx
    } catch (error) {
      console.error('Error en registro:', error);
    }
  };

  if (isLoading) {
    return <Loading message="Creando cuenta..." fullScreen />;
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
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            
            {/* Icono principal */}
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-teal-400 to-blue-500 rounded-3xl flex items-center justify-center mb-6 relative shadow-lg">
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-orange-400 rounded-full"></div>
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Crear Cuenta</h2>
              <p className="text-gray-600 mb-2 font-medium">Únete al Sistema de Detección de Riesgo Psicosocial</p>
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

              {/* Nombre Completo */}
              <div>
                <label className="flex items-center text-gray-700 font-semibold mb-3">
                  <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  placeholder="Tu nombre completo"
                  className={`w-full px-4 py-4 border rounded-3xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 font-medium ${formErrors.nombreCompleto ? 'border-red-300' : 'border-gray-200'}`}
                />
                {formErrors.nombreCompleto && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.nombreCompleto}</p>
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

              {/* Campos específicos para estudiantes */}
              {formData.tipoUsuario === 'ESTUDIANTE' && (
                <>
                  <div>
                    <label className="flex items-center text-gray-700 font-semibold mb-3">
                      <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Carrera
                    </label>
                    <input
                      type="text"
                      name="carrera"
                      value={formData.carrera}
                      onChange={handleChange}
                      placeholder="Ej: Ingeniería de Sistemas"
                      className={`w-full px-4 py-4 border rounded-3xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 font-medium ${formErrors.carrera ? 'border-red-300' : 'border-gray-200'}`}
                    />
                    {formErrors.carrera && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.carrera}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center text-gray-700 font-semibold mb-3">
                      <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Semestre
                    </label>
                    <select
                      name="semestre"
                      value={formData.semestre}
                      onChange={handleChange}
                      className={`w-full px-4 py-4 border rounded-3xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 appearance-none font-medium ${formErrors.semestre ? 'border-red-300' : 'border-gray-200'}`}
                    >
                      <option value="">Selecciona tu semestre</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}° Semestre</option>
                      ))}
                    </select>
                    {formErrors.semestre && (
                      <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.semestre}</p>
                    )}
                  </div>
                </>
              )}

              {/* Campos específicos para coordinadores */}
              {formData.tipoUsuario === 'COORDINADOR' && (
                <div>
                  <label className="flex items-center text-gray-700 font-semibold mb-3">
                    <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Departamento
                  </label>
                  <input
                    type="text"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleChange}
                    placeholder="Ej: Departamento de Bienestar Estudiantil"
                    className={`w-full px-4 py-4 border rounded-3xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 font-medium ${formErrors.departamento ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  {formErrors.departamento && (
                    <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.departamento}</p>
                  )}
                </div>
              )}

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
                    placeholder="Mínimo 6 caracteres"
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

              {/* Confirmar Contraseña */}
              <div>
                <label className="flex items-center text-gray-700 font-semibold mb-3">
                  <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmarContrasena"
                    value={formData.confirmarContrasena}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                    className={`w-full px-4 py-4 pr-12 border rounded-3xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 font-medium ${formErrors.confirmarContrasena ? 'border-red-300' : 'border-gray-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
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
                {formErrors.confirmarContrasena && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{formErrors.confirmarContrasena}</p>
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
                    Creando cuenta...
                  </div>
                ) : (
                  'Crear Cuenta'
                )}
              </button>

              {/* Link de login */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  ¿Ya tienes cuenta?{' '}
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors duration-200"
                  >
                    Inicia sesión aquí
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

export default Register;