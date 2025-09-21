import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { UsuarioCompleto, ActualizacionPerfil } from '../../types';
import Loading from '../Common/Loading';

const MiPerfil: React.FC = () => {
  const { usuario, updateProfile } = useAuth();
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

  // Usar directamente los datos del usuario del contexto si están disponibles
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setCargando(true);
        
        // Si ya tenemos datos del usuario en el contexto, usarlos primero
        if (usuario) {
          setPerfilCompleto(usuario);
          setDatosEditados({
            nombreCompleto: usuario.nombreCompleto,
            carrera: usuario.estudiante?.carrera || '',
            semestre: usuario.estudiante?.semestre || 1,
            departamento: usuario.coordinador?.departamento || ''
          });
        }

        // Intentar obtener datos más completos de la API
        const response = await apiService.getProfile();
        if (response.success && response.data) {
          setPerfilCompleto(response.data);
          setDatosEditados({
            nombreCompleto: response.data.nombreCompleto,
            carrera: response.data.estudiante?.carrera || '',
            semestre: response.data.estudiante?.semestre || 1,
            departamento: response.data.coordinador?.departamento || ''
          });
        }
      } catch (err: any) {
        console.error('Error al cargar perfil:', err);
        // Si falla la API pero tenemos datos del contexto, continuar con esos
        if (usuario) {
          setPerfilCompleto(usuario);
          setDatosEditados({
            nombreCompleto: usuario.nombreCompleto,
            carrera: usuario.estudiante?.carrera || '',
            semestre: usuario.estudiante?.semestre || 1,
            departamento: usuario.coordinador?.departamento || ''
          });
        } else {
          setError(err.message || 'Error al cargar el perfil');
        }
      } finally {
        setCargando(false);
      }
    };

    cargarPerfil();
  }, [usuario]);

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

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    try {
      setSubiendoFoto(true);
      setError(null);
      
      // Crear URL temporal para preview
      const tempUrl = URL.createObjectURL(file);
      setAvatarUrl(tempUrl);

      // Aquí normalmente subirías la imagen al servidor
      // const formData = new FormData();
      // formData.append('avatar', file);
      // const response = await apiService.uploadAvatar(formData);
      
      // Por ahora solo mostrar la imagen localmente
      console.log('Imagen seleccionada:', file.name);
      
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
      
      await updateProfile(datosEditados);
      
      // Recargar los datos actualizados
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setPerfilCompleto(response.data);
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
      nombreCompleto: perfilCompleto?.nombreCompleto,
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

  const handleCambiarContrasena = () => {
    // Implementar modal o navegación para cambiar contraseña
    console.log('Cambiar contraseña');
    alert('Funcionalidad de cambiar contraseña próximamente');
  };

  const handleConfiguracionNotificaciones = () => {
    // Implementar configuración de notificaciones
    console.log('Configurar notificaciones');
    alert('Configuración de notificaciones próximamente');
  };

  const handleDescargarDatos = async () => {
    try {
      // Crear datos para descargar
      const datosDescarga = {
        usuario: perfilCompleto,
        fechaDescarga: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(datosDescarga, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mi-perfil-${perfilCompleto?.nombreCompleto?.replace(/\s+/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al descargar los datos');
    }
  };

  const handleEliminarCuenta = () => {
    const confirmacion = window.confirm(
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.'
    );
    
    if (confirmacion) {
      console.log('Eliminar cuenta');
      alert('Funcionalidad de eliminar cuenta próximamente');
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

  if (cargando) {
    return <Loading />;
  }

  // Usar datos del usuario del contexto como fallback
  const datosUsuario = perfilCompleto || usuario;

  if (!datosUsuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-cyan-300 to-white flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/30">
          <p className="text-red-600 font-semibold">Error al cargar el perfil</p>
          {error && <p className="text-gray-600 mt-2">{error}</p>}
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
                    datosUsuario.nombreCompleto?.charAt(0) || 'U'
                  )}
                </div>
                
                {/* Botón de cámara para cambiar foto */}
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
                
                {/* Input oculto para seleccionar archivo */}
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
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{datosUsuario.estudiante.carrera || 'No especificado'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
                    {modoEdicion ? (
                      <select
                        value={datosEditados.semestre || ''}
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
              onClick={handleCambiarContrasena}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Cambiar Contraseña
            </button>
            
            <button 
              onClick={handleConfiguracionNotificaciones}
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
              onClick={handleDescargarDatos}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Descargar Mis Datos
            </button>
            
            <button 
              onClick={handleEliminarCuenta}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Eliminar Cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiPerfil;