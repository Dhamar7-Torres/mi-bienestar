import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { STORAGE_KEYS, MENSAJES_SUCCESS, MENSAJES_ERROR } from '../constants';
import type { 
  AuthContextType, 
  UsuarioCompleto, 
  DatosRegistro, 
  ActualizacionPerfil 
} from '../types';

// Estado inicial
interface AuthState {
  usuario: UsuarioCompleto | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  usuario: null,
  token: null,
  isLoading: true,
  error: null,
  isAuthenticated: false
};

// Acciones del reducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGIN_SUCCESS'; payload: { usuario: UsuarioCompleto; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE_SUCCESS'; payload: UsuarioCompleto };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        usuario: action.payload.usuario,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      };
    
    case 'UPDATE_PROFILE_SUCCESS':
      return {
        ...state,
        usuario: action.payload,
        error: null
      };
    
    default:
      return state;
  }
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider del contexto
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Función para inicializar el estado desde localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (token && userData) {
        try {
          const usuario = JSON.parse(userData);
          dispatch({ 
            type: 'LOGIN_SUCCESS', 
            payload: { usuario, token }
          });
          
          // Verificar si el token sigue siendo válido
          await apiService.getProfile();
        } catch (error) {
          // Token inválido, limpiar localStorage
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Función de login
  const login = async (correo: string, contrasena: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await apiService.login(correo, contrasena);
      
      if (response.success) {
        const { usuario, token } = response.data;
        
        // Guardar en localStorage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(usuario));
        
        // Actualizar estado
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { usuario, token }
        });

        // Mostrar mensaje de éxito (opcional)
        console.log(MENSAJES_SUCCESS.LOGIN);
      } else {
        throw new Error(response.message || MENSAJES_ERROR.SERVER_ERROR);
      }
    } catch (error: any) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || MENSAJES_ERROR.SERVER_ERROR 
      });
      throw error;
    }
  };

  // Función de registro
  const register = async (datos: DatosRegistro) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await apiService.register(datos);
      
      if (response.success) {
        const { usuario, token } = response.data;
        
        // Guardar en localStorage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(usuario));
        
        // Actualizar estado
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { usuario, token }
        });

        console.log(MENSAJES_SUCCESS.REGISTER);
      } else {
        throw new Error(response.message || MENSAJES_ERROR.SERVER_ERROR);
      }
    } catch (error: any) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || MENSAJES_ERROR.SERVER_ERROR 
      });
      throw error;
    }
  };

  // Función de logout
  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // Ignorar errores de logout
      console.warn('Error durante logout:', error);
    } finally {
      // Limpiar localStorage y estado
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Función de actualización de perfil
  const updateProfile = async (datos: ActualizacionPerfil) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await apiService.updateProfile(datos);
      
      if (response.success) {
        // Obtener el perfil actualizado
        const profileResponse = await apiService.getProfile();
        const usuarioActualizado = profileResponse.data.usuario;
        
        // Actualizar localStorage
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(usuarioActualizado));
        
        // Actualizar estado
        dispatch({ 
          type: 'UPDATE_PROFILE_SUCCESS', 
          payload: usuarioActualizado 
        });

        console.log(MENSAJES_SUCCESS.PROFILE_UPDATED);
      } else {
        throw new Error(response.message || MENSAJES_ERROR.SERVER_ERROR);
      }
    } catch (error: any) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || MENSAJES_ERROR.SERVER_ERROR 
      });
      throw error;
    }
  };

  // Función para limpiar errores
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Valor del contexto con isAuthenticated incluido
  const contextValue: AuthContextType = {
    usuario: state.usuario,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated, // <-- ASEGURAR QUE ESTÁ INCLUIDO
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}

export default AuthContext;