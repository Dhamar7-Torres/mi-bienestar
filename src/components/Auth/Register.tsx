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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Únete al Sistema de Detección de Riesgo Psicosocial
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Selector de tipo de usuario */}
            <div>
              <label htmlFor="tipoUsuario" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuario
              </label>
              <select
                id="tipoUsuario"
                name="tipoUsuario"
                value={formData.tipoUsuario}
                onChange={handleChange}
                className={`input-field ${formErrors.tipoUsuario ? 'border-red-300 focus:ring-red-500' : ''}`}
              >
                <option value="">Selecciona una opción</option>
                <option value="ESTUDIANTE">Estudiante</option>
                <option value="COORDINADOR">Coordinador</option>
              </select>
              {formErrors.tipoUsuario && (
                <p className="mt-1 text-sm text-red-600">{formErrors.tipoUsuario}</p>
              )}
            </div>

            {/* Nombre completo */}
            <div>
              <label htmlFor="nombreCompleto" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <input
                id="nombreCompleto"
                name="nombreCompleto"
                type="text"
                value={formData.nombreCompleto}
                onChange={handleChange}
                className={`input-field ${formErrors.nombreCompleto ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="Tu nombre completo"
              />
              {formErrors.nombreCompleto && (
                <p className="mt-1 text-sm text-red-600">{formErrors.nombreCompleto}</p>
              )}
            </div>

            {/* Correo electrónico */}
            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="correo"
                name="correo"
                type="email"
                value={formData.correo}
                onChange={handleChange}
                className={`input-field ${formErrors.correo ? 'border-red-300 focus:ring-red-500' : ''}`}
                placeholder="tu-correo@universidad.edu"
              />
              {formErrors.correo && (
                <p className="mt-1 text-sm text-red-600">{formErrors.correo}</p>
              )}
            </div>

            {/* Campos específicos para estudiantes */}
            {formData.tipoUsuario === 'ESTUDIANTE' && (
              <>
                <div>
                  <label htmlFor="carrera" className="block text-sm font-medium text-gray-700 mb-2">
                    Carrera
                  </label>
                  <input
                    id="carrera"
                    name="carrera"
                    type="text"
                    value={formData.carrera}
                    onChange={handleChange}
                    className={`input-field ${formErrors.carrera ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="Ej: Ingeniería de Sistemas"
                  />
                  {formErrors.carrera && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.carrera}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="semestre" className="block text-sm font-medium text-gray-700 mb-2">
                    Semestre
                  </label>
                  <select
                    id="semestre"
                    name="semestre"
                    value={formData.semestre}
                    onChange={handleChange}
                    className={`input-field ${formErrors.semestre ? 'border-red-300 focus:ring-red-500' : ''}`}
                  >
                    <option value="">Selecciona tu semestre</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}° Semestre</option>
                    ))}
                  </select>
                  {formErrors.semestre && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.semestre}</p>
                  )}
                </div>
              </>
            )}

            {/* Campos específicos para coordinadores */}
            {formData.tipoUsuario === 'COORDINADOR' && (
              <div>
                <label htmlFor="departamento" className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <input
                  id="departamento"
                  name="departamento"
                  type="text"
                  value={formData.departamento}
                  onChange={handleChange}
                  className={`input-field ${formErrors.departamento ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="Ej: Departamento de Bienestar Estudiantil"
                />
                {formErrors.departamento && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.departamento}</p>
                )}
              </div>
            )}

            {/* Contraseña */}
            <div>
              <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="contrasena"
                  name="contrasena"
                  type={showPassword ? "text" : "password"}
                  value={formData.contrasena}
                  onChange={handleChange}
                  className={`input-field pr-10 ${formErrors.contrasena ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.758 7.758M12 12l2.122 2.122L16.242 16.242M12 12V9.878m-4.242 4.243L9.878 9.878m4.242 4.242L12 12m4.243 4.243L9.878 9.878" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.contrasena && (
                <p className="mt-1 text-sm text-red-600">{formErrors.contrasena}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label htmlFor="confirmarContrasena" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmarContrasena"
                  name="confirmarContrasena"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmarContrasena}
                  onChange={handleChange}
                  className={`input-field pr-10 ${formErrors.confirmarContrasena ? 'border-red-300 focus:ring-red-500' : ''}`}
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.758 7.758M12 12l2.122 2.122L16.242 16.242M12 12V9.878m-4.242 4.243L9.878 9.878m4.242 4.242L12 12m4.243 4.243L9.878 9.878" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.confirmarContrasena && (
                <p className="mt-1 text-sm text-red-600">{formErrors.confirmarContrasena}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="spinner h-4 w-4 mr-2" />
                  Creando cuenta...
                </div>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;