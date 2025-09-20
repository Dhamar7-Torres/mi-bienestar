import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // Verificar token con el backend
        const response = await authService.verifyToken(token);
        if (response.success) {
          setUser(response.data.user);
        } else {
          // Token inválido, limpiar
          localStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.success) {
        const { user: userData, token } = response.data;
        
        // Guardar token y datos del usuario
        localStorage.setItem('authToken', token);
        setUser(userData);
        
        return { success: true, user: userData };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error durante el login:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al iniciar sesión' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        const { user: registeredUser, token } = response.data;
        
        // Guardar token y datos del usuario
        localStorage.setItem('authToken', token);
        setUser(registeredUser);
        
        return { success: true, user: registeredUser };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Error durante el registro:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al registrar usuario' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error durante logout:', error);
    } finally {
      // Limpiar estado local independientemente del resultado
      localStorage.removeItem('authToken');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};