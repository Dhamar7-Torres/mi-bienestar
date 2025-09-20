import { useState, useEffect, createContext, useContext } from 'react';

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
    // Verificar si hay una sesión activa
    const checkAuth = () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        const sessionExpiry = localStorage.getItem('sessionExpiry');
        
        if (savedUser && sessionExpiry) {
          const now = new Date().getTime();
          const expiry = parseInt(sessionExpiry);
          
          // Verificar si la sesión no ha expirado (24 horas)
          if (now < expiry) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
          } else {
            // Sesión expirada, limpiar
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionExpiry');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // Si hay error al parsear, limpiar localStorage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('sessionExpiry');
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (userData, role) => {
    try {
      // Crear objeto de usuario con rol
      const userWithRole = { 
        ...userData, 
        role: role || userData.role 
      };
      
      setUser(userWithRole);
      
      // Guardar en localStorage con expiración de 24 horas
      const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 horas
      localStorage.setItem('currentUser', JSON.stringify(userWithRole));
      localStorage.setItem('sessionExpiry', expiryTime.toString());
      
      console.log('Usuario logueado:', userWithRole);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const register = (userData) => {
    try {
      // Después del registro, hacer login automáticamente
      login(userData, userData.role);
      console.log('Usuario registrado y logueado:', userData);
    } catch (error) {
      console.error('Error during registration:', error);
    }
  };

  const logout = () => {
    try {
      setUser(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('sessionExpiry');
      console.log('Usuario deslogueado');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Función para verificar si un email ya está registrado
  const isEmailRegistered = (email) => {
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      return registeredUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  // Función para obtener todos los usuarios registrados (para debug)
  const getAllUsers = () => {
    try {
      return JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  };

  // Función para limpiar todos los datos (útil para desarrollo)
  const clearAllData = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('registeredUsers');
    setUser(null);
    console.log('Todos los datos limpiados');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    // Funciones adicionales
    isEmailRegistered,
    getAllUsers,
    clearAllData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};