import React, { useState } from 'react';
import { User, Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, UserPlus, AlertCircle } from 'lucide-react';

export const RegisterPage = ({ onRegister, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    carrera: '',
    semestre: '',
    departamento: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

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
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar confirmación de contraseña
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Validar campos específicos por rol
    if (formData.role === 'student') {
      if (!formData.carrera.trim()) {
        newErrors.carrera = 'La carrera es requerida';
      }
      if (!formData.semestre) {
        newErrors.semestre = 'El semestre es requerido';
      }
    } else if (formData.role === 'admin') {
      if (!formData.departamento.trim()) {
        newErrors.departamento = 'El departamento es requerido';
      }
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

    try {
      // Simular delay de registro
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verificar si el email ya existe
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const emailExists = existingUsers.find(user => user.email === formData.email);
      
      if (emailExists) {
        setErrors({ email: 'Este email ya está registrado' });
        setLoading(false);
        return;
      }

      // Crear nuevo usuario
      const newUser = {
        id: Date.now(), // ID único basado en timestamp
        nombre: formData.nombre.trim(),
        email: formData.email.toLowerCase(),
        password: formData.password, // En producción, esto debería estar hasheado
        role: formData.role,
        ...(formData.role === 'student' && {
          carrera: formData.carrera.trim(),
          semestre: parseInt(formData.semestre)
        }),
        ...(formData.role === 'admin' && {
          departamento: formData.departamento.trim()
        }),
        fechaRegistro: new Date().toISOString()
      };

      // Guardar en localStorage
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));

      // Llamar función de registro exitoso
      onRegister(newUser);

    } catch (error) {
      setErrors({ general: 'Error al registrar usuario. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-success-600 to-success-700 rounded-2xl flex items-center justify-center shadow-soft transform hover:scale-105 transition-transform duration-300">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Crear Cuenta
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            Regístrate en Mi Bienestar DACYTI
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-strong border border-gray-100 p-8 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error general */}
            {errors.general && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0" />
                <p className="text-danger-700 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Tipo de Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Tipo de Usuario:
              </label>
              <div className="space-y-3">
                {/* Estudiante */}
                <div
                  onClick={() => handleInputChange({ target: { name: 'role', value: 'student' } })}
                  className={`
                    relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                    ${formData.role === 'student' 
                      ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${formData.role === 'student' ? 'bg-primary-500' : 'bg-gray-100'}
                    `}>
                      <User className={`h-6 w-6 ${formData.role === 'student' ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <div className={`font-medium ${formData.role === 'student' ? 'text-primary-900' : 'text-gray-900'}`}>
                        Estudiante
                      </div>
                      <div className="text-gray-600 text-sm">Acceso a evaluaciones</div>
                    </div>
                  </div>
                </div>

                {/* Coordinador */}
                <div
                  onClick={() => handleInputChange({ target: { name: 'role', value: 'admin' } })}
                  className={`
                    relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer
                    ${formData.role === 'admin' 
                      ? 'border-primary-500 bg-gradient-to-r from-primary-50 to-primary-100' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center
                      ${formData.role === 'admin' ? 'bg-primary-500' : 'bg-gray-100'}
                    `}>
                      <Shield className={`h-6 w-6 ${formData.role === 'admin' ? 'text-white' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <div className={`font-medium ${formData.role === 'admin' ? 'text-primary-900' : 'text-gray-900'}`}>
                        Coordinador
                      </div>
                      <div className="text-gray-600 text-sm">Panel administrativo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={`input ${errors.nombre ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                placeholder="Tu nombre completo"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-danger-600">{errors.nombre}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
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
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600">{errors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`input pl-11 pr-11 ${errors.password ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600">{errors.password}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`input pl-11 pr-11 ${errors.confirmPassword ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Campos específicos por rol */}
            {formData.role === 'student' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Carrera *
                  </label>
                  <input
                    type="text"
                    name="carrera"
                    value={formData.carrera}
                    onChange={handleInputChange}
                    className={`input ${errors.carrera ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Ej: Ingeniería de Sistemas"
                  />
                  {errors.carrera && (
                    <p className="mt-1 text-sm text-danger-600">{errors.carrera}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semestre *
                  </label>
                  <select
                    name="semestre"
                    value={formData.semestre}
                    onChange={handleInputChange}
                    className={`select ${errors.semestre ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  >
                    <option value="">Selecciona tu semestre</option>
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}° Semestre
                      </option>
                    ))}
                  </select>
                  {errors.semestre && (
                    <p className="mt-1 text-sm text-danger-600">{errors.semestre}</p>
                  )}
                </div>
              </>
            )}

            {formData.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento *
                </label>
                <input
                  type="text"
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                  className={`input ${errors.departamento ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Ej: Bienestar Estudiantil"
                />
                {errors.departamento && (
                  <p className="mt-1 text-sm text-danger-600">{errors.departamento}</p>
                )}
              </div>
            )}

            {/* Botón de registro */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 disabled:from-success-400 disabled:to-success-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creando cuenta...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  <span>Crear Cuenta</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back to login */}
        <div className="text-center">
          <button
            onClick={onBackToLogin}
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver al inicio de sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};