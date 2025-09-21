import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { UsuarioCompleto, ActualizacionPerfil } from '../../types';
import Loading from '../Common/Loading';

const MiPerfil: React.FC = () => {
  const { usuario, updateProfile, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [perfilCompleto, setPerfilCompleto] = useState<UsuarioCompleto | null>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [datosEditados, setDatosEditados] = useState<ActualizacionPerfil>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Estados para modales
  const [modalCambiarContrasena, setModalCambiarContrasena] = useState(false);
  const [modalEliminarCuenta, setModalEliminarCuenta] = useState(false);
  const [datosContrasena, setDatosContrasena] = useState({
    contrasenaActual: '',
    contrasenaNueva: '',
    confirmarContrasena: ''
  });
  const [datosEliminar, setDatosEliminar] = useState({
    emailConfirmacion: '',
    textConfirmacion: ''
  });
  const [cargandoContrasena, setCargandoContrasena] = useState(false);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Cargar perfil completo desde la API
  useEffect(() => {
    const cargarPerfilCompleto = async () => {
      if (!isAuthenticated || authLoading) return;

      try {
        setCargando(true);
        setError(null);
        
        const response = await apiService.getProfile();
        
        if (response.success && response.data) {
          const datosUsuario = response.data.usuario || response.data;
          
          const usuarioCompleto: UsuarioCompleto = {
            id: datosUsuario.id,
            nombreCompleto: datosUsuario.nombreCompleto,
            correo: datosUsuario.correo,
            tipoUsuario: datosUsuario.tipoUsuario,
            fechaCreacion: datosUsuario.fechaCreacion,
            estudiante: datosUsuario.estudiante || null,
            coordinador: datosUsuario.coordinador || null,
            fechaActualizacion: ''
          };
          
          setPerfilCompleto(usuarioCompleto);
          
          // Inicializar datos de edición
          setDatosEditados({
            nombreCompleto: usuarioCompleto.nombreCompleto || '',
            carrera: usuarioCompleto.estudiante?.carrera || '',
            semestre: usuarioCompleto.estudiante?.semestre || 1,
            departamento: usuarioCompleto.coordinador?.departamento || ''
          });
          
        } else {
          throw new Error(response.message || 'No se pudieron cargar los datos del perfil');
        }
        
      } catch (err: any) {
        setError(err.message || 'Error al cargar el perfil');
        
        if (usuario) {
          setPerfilCompleto(usuario);
          setDatosEditados({
            nombreCompleto: usuario.nombreCompleto || '',
            carrera: usuario.estudiante?.carrera || '',
            semestre: usuario.estudiante?.semestre || 1,
            departamento: usuario.coordinador?.departamento || ''
          });
        }
      } finally {
        setCargando(false);
      }
    };

    cargarPerfilCompleto();
  }, [isAuthenticated, authLoading, usuario]);

  const handleInputChange = (campo: keyof ActualizacionPerfil, valor: any) => {
    setDatosEditados(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    try {
      setSubiendoFoto(true);
      setError(null);
      
      const tempUrl = URL.createObjectURL(file);
      setAvatarUrl(tempUrl);
      
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen');
      setAvatarUrl(null);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const guardarCambios = async () => {
    try {
      setGuardando(true);
      setError(null);
      
      const cambiosFiltrados = Object.entries(datosEditados).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key as keyof ActualizacionPerfil] = value;
        }
        return acc;
      }, {} as ActualizacionPerfil);
      
      await updateProfile(cambiosFiltrados);
      
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        const usuarioActualizado = response.data.usuario || response.data;
        setPerfilCompleto(usuarioActualizado);
      }
      
      setModoEdicion(false);
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  const cancelarEdicion = () => {
    setDatosEditados({
      nombreCompleto: perfilCompleto?.nombreCompleto || '',
      carrera: perfilCompleto?.estudiante?.carrera || '',
      semestre: perfilCompleto?.estudiante?.semestre || 1,
      departamento: perfilCompleto?.coordinador?.departamento || ''
    });
    setModoEdicion(false);
    setError(null);
  };

  const handleVolver = () => {
    const rutaAnterior = perfilCompleto?.tipoUsuario === 'ESTUDIANTE' 
      ? '/estudiante/dashboard' 
      : '/coordinador/dashboard';
    navigate(rutaAnterior);
  };

  // Función para cambiar contraseña
  const handleCambiarContrasena = async () => {
    if (!datosContrasena.contrasenaActual || !datosContrasena.contrasenaNueva) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (datosContrasena.contrasenaNueva !== datosContrasena.confirmarContrasena) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (datosContrasena.contrasenaNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setCargandoContrasena(true);
      setError(null);

      await apiService.changePassword({
        contrasenaActual: datosContrasena.contrasenaActual,
        contrasenaNueva: datosContrasena.contrasenaNueva
      });

      setModalCambiarContrasena(false);
      setDatosContrasena({
        contrasenaActual: '',
        contrasenaNueva: '',
        confirmarContrasena: ''
      });

      alert('Contraseña cambiada exitosamente');
    } catch (err: any) {
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setCargandoContrasena(false);
    }
  };

  // Función para eliminar cuenta
  const handleEliminarCuenta = async () => {
    if (datosEliminar.emailConfirmacion !== perfilCompleto?.correo) {
      setError('El email de confirmación no coincide');
      return;
    }

    if (datosEliminar.textConfirmacion !== 'ELIMINAR') {
      setError('Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    try {
      setCargandoEliminar(true);
      setError(null);

      // Aquí iría la llamada a la API para eliminar cuenta
      // await apiService.deleteAccount();
      
      alert('Funcionalidad de eliminar cuenta será implementada próximamente');
      setModalEliminarCuenta(false);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la cuenta');
    } finally {
      setCargandoEliminar(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const getRiskBadgeClass = (estadoRiesgo?: string) => {
    switch (estadoRiesgo) {
      case 'ALTO':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300';
      case 'MEDIO':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300';
      case 'BAJO':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300';
    }
  };

  if (authLoading || cargando) {
    return <Loading />;
  }

  if (!perfilCompleto && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-cyan-300 to-white flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30 max-w-md">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar el perfil</h3>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={handleVolver}
              className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const datosUsuario = perfilCompleto || usuario;

  if (!datosUsuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-cyan-300 to-white flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
          <p className="text-red-600 font-semibold">No se pudieron cargar los datos del usuario</p>
          <button
            onClick={handleVolver}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-cyan-300 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Botón de volver */}
        <button
          onClick={handleVolver}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al Dashboard
        </button>

        {/* Header del perfil */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div 
                  className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={handleAvatarClick}
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    datosUsuario.nombreCompleto?.charAt(0)?.toUpperCase() || 'U'
                  )}
                </div>
                
                <button
                  onClick={handleAvatarClick}
                  className="absolute -bottom-1 -right-1 bg-white border-2 border-cyan-500 text-cyan-600 p-2 rounded-full hover:bg-cyan-50 transition-colors shadow-lg"
                  disabled={subiendoFoto}
                >
                  {subiendoFoto ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {datosUsuario.nombreCompleto || 'Usuario'}
                </h1>
                <p className="text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {datosUsuario.tipoUsuario === 'ESTUDIANTE' ? 'Estudiante' : 'Coordinador'}
                </p>
                {datosUsuario.tipoUsuario === 'ESTUDIANTE' && datosUsuario.estudiante && (
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-2 ${getRiskBadgeClass(datosUsuario.estudiante.estadoRiesgo)}`}>
                    Riesgo {datosUsuario.estudiante.estadoRiesgo || 'No determinado'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              {!modoEdicion ? (
                <button
                  onClick={() => setModoEdicion(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 flex items-center shadow-lg"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar Perfil
                </button>
              ) : (
                <>
                  <button
                    onClick={cancelarEdicion}
                    className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancelar
                  </button>
                  <button
                    onClick={guardarCambios}
                    disabled={guardando}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center disabled:opacity-50 shadow-lg"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                </>
              )}
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Información personal y académica/profesional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información Personal */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Información Personal
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                {modoEdicion ? (
                  <input
                    type="text"
                    value={datosEditados.nombreCompleto || ''}
                    onChange={(e) => handleInputChange('nombreCompleto', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white/70"
                    placeholder="Ingresa tu nombre completo"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{datosUsuario.nombreCompleto || 'No especificado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-900 font-medium">{datosUsuario.correo || 'No especificado'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Registro</label>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-900 font-medium">
                    {datosUsuario.fechaCreacion ? formatearFecha(datosUsuario.fechaCreacion) : 'No disponible'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Información Académica/Profesional */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {datosUsuario.tipoUsuario === 'ESTUDIANTE' ? 'Información Académica' : 'Información Profesional'}
            </h2>
            
            <div className="space-y-4">
              {datosUsuario.tipoUsuario === 'ESTUDIANTE' && datosUsuario.estudiante && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
                    {modoEdicion ? (
                      <input
                        type="text"
                        value={datosEditados.carrera || ''}
                        onChange={(e) => handleInputChange('carrera', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white/70"
                        placeholder="Ingresa tu carrera"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{datosUsuario.estudiante.carrera || 'No especificado'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
                    {modoEdicion ? (
                      <select
                        value={datosEditados.semestre || 1}
                        onChange={(e) => handleInputChange('semestre', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white/70"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(sem => (
                          <option key={sem} value={sem}>{sem}° Semestre</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900 font-medium">{datosUsuario.estudiante.semestre}° Semestre</p>
                    )}
                  </div>

                  <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-200">
                    <h3 className="font-medium text-cyan-900 mb-2">Estado Actual</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-cyan-700">
                        <span className="font-medium">Nivel de Estrés:</span> {datosUsuario.estudiante.nivelEstresActual || 0}/10
                      </p>
                      <p className="text-cyan-700">
                        <span className="font-medium">Nivel de Burnout:</span> {datosUsuario.estudiante.nivelBurnoutActual || 0}/10
                      </p>
                      {datosUsuario.estudiante.fechaUltimaEvaluacion && (
                        <p className="text-cyan-700">
                          <span className="font-medium">Última evaluación:</span> {formatearFecha(datosUsuario.estudiante.fechaUltimaEvaluacion)}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {datosUsuario.tipoUsuario === 'COORDINADOR' && datosUsuario.coordinador && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                    {modoEdicion ? (
                      <input
                        type="text"
                        value={datosEditados.departamento || ''}
                        onChange={(e) => handleInputChange('departamento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white/70"
                        placeholder="Ingresa tu departamento"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{datosUsuario.coordinador.departamento || 'No especificado'}</p>
                    )}
                  </div>

                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <h3 className="font-medium text-purple-900 mb-2">Información del Sistema</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-purple-700">
                        <span className="font-medium">Rol:</span> Coordinador de Bienestar
                      </p>
                      <p className="text-purple-700">
                        <span className="font-medium">Acceso:</span> Gestión de estudiantes y alertas
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Configuración de Cuenta */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración de Cuenta</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setModalCambiarContrasena(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Cambiar Contraseña
            </button>
            
            <button 
              onClick={() => alert('Configuración de notificaciones próximamente')}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Configurar Notificaciones
            </button>
            
            {datosUsuario.tipoUsuario === 'COORDINADOR' && (
              <>
                <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Gestión de Estudiantes
                </button>
                <button className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Reportes y Estadísticas
                </button>
              </>
            )}
            
            <button 
              onClick={() => setModalEliminarCuenta(true)}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 md:col-span-2"
            >
              Eliminar Cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Modal Cambiar Contraseña */}
      {modalCambiarContrasena && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h3>
              <button
                onClick={() => {
                  setModalCambiarContrasena(false);
                  setDatosContrasena({ contrasenaActual: '', contrasenaNueva: '', confirmarContrasena: '' });
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
                <input
                  type="password"
                  value={datosContrasena.contrasenaActual}
                  onChange={(e) => setDatosContrasena(prev => ({ ...prev, contrasenaActual: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  value={datosContrasena.contrasenaNueva}
                  onChange={(e) => setDatosContrasena(prev => ({ ...prev, contrasenaNueva: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ingresa tu nueva contraseña"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={datosContrasena.confirmarContrasena}
                  onChange={(e) => setDatosContrasena(prev => ({ ...prev, confirmarContrasena: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setModalCambiarContrasena(false);
                    setDatosContrasena({ contrasenaActual: '', contrasenaNueva: '', confirmarContrasena: '' });
                    setError(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCambiarContrasena}
                  disabled={cargandoContrasena}
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {cargandoContrasena ? 'Cambiando...' : 'Cambiar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Cuenta */}
      {modalEliminarCuenta && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Eliminar Cuenta</h3>
              <button
                onClick={() => {
                  setModalEliminarCuenta(false);
                  setDatosEliminar({ emailConfirmacion: '', textConfirmacion: '' });
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ Esta acción es irreversible. Se eliminarán todos tus datos permanentemente.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirma tu email: <span className="font-semibold">{datosUsuario.correo}</span>
                </label>
                <input
                  type="email"
                  value={datosEliminar.emailConfirmacion}
                  onChange={(e) => setDatosEliminar(prev => ({ ...prev, emailConfirmacion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Escribe tu email para confirmar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Escribe "ELIMINAR" para confirmar
                </label>
                <input
                  type="text"
                  value={datosEliminar.textConfirmacion}
                  onChange={(e) => setDatosEliminar(prev => ({ ...prev, textConfirmacion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="ELIMINAR"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setModalEliminarCuenta(false);
                    setDatosEliminar({ emailConfirmacion: '', textConfirmacion: '' });
                    setError(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarCuenta}
                  disabled={cargandoEliminar}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {cargandoEliminar ? 'Eliminando...' : 'Eliminar Cuenta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiPerfil;