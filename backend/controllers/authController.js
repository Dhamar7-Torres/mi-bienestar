import { prisma } from '../utils/prisma.js';
import { hashPassword, comparePassword, generateJWT } from '../utils/validators.js';

class AuthController {
  // Registro de usuario
  static async register(req, res) {
    try {
      const { nombreCompleto, correo, contrasena, tipoUsuario } = req.body;

      // Verificar si el usuario ya existe
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { correo }
      });

      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario registrado con este correo electrónico'
        });
      }

      // Hash de la contraseña
      const contrasenaHash = await hashPassword(contrasena);

      // Crear usuario base
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombreCompleto,
          correo,
          contrasenaHash,
          tipoUsuario
        }
      });

      // Crear registro específico según tipo de usuario
      let perfilEspecifico = null;

      if (tipoUsuario === 'ESTUDIANTE') {
        const { carrera, semestre } = req.body;

        if (!carrera || !semestre) {
          // Eliminar usuario creado si falta información
          await prisma.usuario.delete({ where: { id: nuevoUsuario.id } });
          return res.status(400).json({
            success: false,
            message: 'Carrera y semestre son requeridos para estudiantes'
          });
        }

        perfilEspecifico = await prisma.estudiante.create({
          data: {
            usuarioId: nuevoUsuario.id,
            carrera,
            semestre: parseInt(semestre)
          }
        });
      } else if (tipoUsuario === 'COORDINADOR') {
        const { departamento } = req.body;

        if (!departamento) {
          await prisma.usuario.delete({ where: { id: nuevoUsuario.id } });
          return res.status(400).json({
            success: false,
            message: 'Departamento es requerido para coordinadores'
          });
        }

        perfilEspecifico = await prisma.coordinador.create({
          data: {
            usuarioId: nuevoUsuario.id,
            departamento
          }
        });
      }

      // Generar JWT
      const token = generateJWT({
        userId: nuevoUsuario.id,
        tipoUsuario: nuevoUsuario.tipoUsuario
      });

      // Respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          token,
          usuario: {
            id: nuevoUsuario.id,
            nombreCompleto: nuevoUsuario.nombreCompleto,
            correo: nuevoUsuario.correo,
            tipoUsuario: nuevoUsuario.tipoUsuario,
            perfil: perfilEspecifico
          }
        }
      });

    } catch (error) {
      console.error('Error en registro:', error);
      
      // Manejar errores específicos de Prisma
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante el registro'
      });
    }
  }

  // Inicio de sesión
  static async login(req, res) {
    try {
      const { correo, contrasena } = req.body;

      // Buscar usuario
      const usuario = await prisma.usuario.findUnique({
        where: { correo },
        include: {
          estudiante: true,
          coordinador: true
        }
      });

      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const contrasenaValida = await comparePassword(contrasena, usuario.contrasenaHash);

      if (!contrasenaValida) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Actualizar último acceso
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { fechaActualizacion: new Date() }
      });

      // Generar JWT
      const token = generateJWT({
        userId: usuario.id,
        tipoUsuario: usuario.tipoUsuario
      });

      // Preparar datos de respuesta
      const datosRespuesta = {
        id: usuario.id,
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        tipoUsuario: usuario.tipoUsuario
      };

      // Agregar datos específicos del perfil
      if (usuario.tipoUsuario === 'ESTUDIANTE' && usuario.estudiante) {
        datosRespuesta.estudiante = {
          id: usuario.estudiante.id,
          carrera: usuario.estudiante.carrera,
          semestre: usuario.estudiante.semestre,
          nivelEstresActual: usuario.estudiante.nivelEstresActual,
          nivelBurnoutActual: usuario.estudiante.nivelBurnoutActual,
          estadoRiesgo: usuario.estudiante.estadoRiesgo,
          fechaUltimaEvaluacion: usuario.estudiante.fechaUltimaEvaluacion
        };
      } else if (usuario.tipoUsuario === 'COORDINADOR' && usuario.coordinador) {
        datosRespuesta.coordinador = {
          id: usuario.coordinador.id,
          departamento: usuario.coordinador.departamento
        };
      }

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          token,
          usuario: datosRespuesta
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante el inicio de sesión'
      });
    }
  }

  // Obtener perfil del usuario actual
  static async getProfile(req, res) {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.user.id },
        include: {
          estudiante: {
            include: {
              evaluaciones: {
                orderBy: { fechaEvaluacion: 'desc' },
                take: 5
              },
              alertas: {
                where: { estaLeida: false },
                orderBy: { fechaCreacion: 'desc' }
              }
            }
          },
          coordinador: true
        }
      });

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Preparar datos de respuesta
      const datosRespuesta = {
        id: usuario.id,
        nombreCompleto: usuario.nombreCompleto,
        correo: usuario.correo,
        tipoUsuario: usuario.tipoUsuario,
        fechaCreacion: usuario.fechaCreacion
      };

      if (usuario.tipoUsuario === 'ESTUDIANTE' && usuario.estudiante) {
        datosRespuesta.estudiante = {
          id: usuario.estudiante.id,
          carrera: usuario.estudiante.carrera,
          semestre: usuario.estudiante.semestre,
          nivelEstresActual: usuario.estudiante.nivelEstresActual,
          nivelBurnoutActual: usuario.estudiante.nivelBurnoutActual,
          estadoRiesgo: usuario.estudiante.estadoRiesgo,
          fechaUltimaEvaluacion: usuario.estudiante.fechaUltimaEvaluacion,
          evaluacionesRecientes: usuario.estudiante.evaluaciones,
          alertasNoLeidas: usuario.estudiante.alertas
        };
      } else if (usuario.tipoUsuario === 'COORDINADOR' && usuario.coordinador) {
        datosRespuesta.coordinador = {
          id: usuario.coordinador.id,
          departamento: usuario.coordinador.departamento
        };
      }

      res.status(200).json({
        success: true,
        data: { usuario: datosRespuesta }
      });

    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar perfil
  static async updateProfile(req, res) {
    try {
      const { nombreCompleto, carrera, semestre, departamento } = req.body;
      const userId = req.user.id;

      // Actualizar datos base del usuario
      const datosActualizacion = {};
      if (nombreCompleto) {
        datosActualizacion.nombreCompleto = nombreCompleto;
      }

      if (Object.keys(datosActualizacion).length > 0) {
        await prisma.usuario.update({
          where: { id: userId },
          data: datosActualizacion
        });
      }

      // Actualizar datos específicos según tipo de usuario
      if (req.user.tipoUsuario === 'ESTUDIANTE' && req.user.estudiante) {
        const datosEstudiante = {};
        if (carrera) datosEstudiante.carrera = carrera;
        if (semestre) datosEstudiante.semestre = parseInt(semestre);

        if (Object.keys(datosEstudiante).length > 0) {
          await prisma.estudiante.update({
            where: { id: req.user.estudiante.id },
            data: datosEstudiante
          });
        }
      } else if (req.user.tipoUsuario === 'COORDINADOR' && req.user.coordinador) {
        if (departamento) {
          await prisma.coordinador.update({
            where: { id: req.user.coordinador.id },
            data: { departamento }
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente'
      });

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Cambiar contraseña
  static async changePassword(req, res) {
    try {
      const { contrasenaActual, contrasenaNueva } = req.body;

      if (!contrasenaActual || !contrasenaNueva) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva son requeridas'
        });
      }

      if (contrasenaNueva.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      // Obtener usuario actual
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.user.id }
      });

      // Verificar contraseña actual
      const contrasenaValida = await comparePassword(contrasenaActual, usuario.contrasenaHash);

      if (!contrasenaValida) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      // Hash nueva contraseña
      const nuevaContrasenaHash = await hashPassword(contrasenaNueva);

      // Actualizar contraseña
      await prisma.usuario.update({
        where: { id: req.user.id },
        data: { contrasenaHash: nuevaContrasenaHash }
      });

      res.status(200).json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });

    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Cerrar sesión (logout)
  static async logout(req, res) {
    try {
      // En una implementación más avanzada, aquí se podría:
      // 1. Invalidar el token en una blacklist
      // 2. Registrar el logout en logs de actividad
      // 3. Limpiar sesiones relacionadas

      res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });

    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

export default AuthController;