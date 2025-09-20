import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { LoadingPage } from './components/common/LoadingSpinner';

// Componentes de Auth
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';

// Componentes de Estudiante
import { Dashboard } from './components/student/Dashboard';
import { WeeklyEvaluation } from './components/student/WeeklyEvaluation';
import { Resources } from './components/student/Resources';

// Componentes de Admin
import { GeneralSummary } from './components/admin/GeneralSummary';
import { StudentsList } from './components/admin/StudentsList';
import { AlertsSystem } from './components/admin/AlertsSystem';

// Hooks
import { useAuth, AuthProvider } from './hooks/useAuth';
import { BookOpen } from 'lucide-react';

const AppContent = () => {
  const { user, login, register, logout, loading, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState(isAdmin ? 'summary' : 'dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authMode, setAuthMode] = useState('login'); // 'login' o 'register'

  // Debug para ver el estado del usuario
  React.useEffect(() => {
    console.log('Usuario actual:', user);
    console.log('Es admin:', isAdmin);
    console.log('Vista activa:', activeView);
  }, [user, isAdmin, activeView]);

  // Auto-ajustar vista cuando cambia el rol
  React.useEffect(() => {
    if (user) {
      if (isAdmin && !['summary', 'students', 'alerts', 'resources-admin'].includes(activeView)) {
        setActiveView('summary');
      } else if (!isAdmin && !['dashboard', 'evaluation', 'resources'].includes(activeView)) {
        setActiveView('dashboard');
      }
    }
  }, [user, isAdmin, activeView]);

  // Handlers de autenticación
  const handleLogin = (userData, role) => {
    login(userData, role);
    setAuthMode('login'); // Reset auth mode after successful login
  };

  const handleRegister = (userData) => {
    register(userData);
    setAuthMode('login'); // Reset auth mode after successful registration
  };

  const handleLogout = () => {
    logout();
    setActiveView('dashboard');
    setSidebarOpen(true);
    setAuthMode('login');
  };

  const handleGoToRegister = () => {
    setAuthMode('register');
  };

  const handleBackToLogin = () => {
    setAuthMode('login');
  };

  // Handlers de navegación
  const handleViewChange = (viewId) => {
    setActiveView(viewId);
    // Cerrar sidebar en móvil después de seleccionar
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleEvaluationComplete = (evaluation) => {
    // Cambiar a dashboard después de completar evaluación
    setActiveView('dashboard');
    console.log('Evaluación completada:', evaluation);
  };

  if (loading) {
    return <LoadingPage message="Cargando Mi Bienestar DACYTI..." />;
  }

  // Mostrar login o registro si no hay usuario autenticado
  if (!user) {
    if (authMode === 'register') {
      return (
        <RegisterPage 
          onRegister={handleRegister}
          onBackToLogin={handleBackToLogin}
        />
      );
    } else {
      return (
        <LoginPage 
          onLogin={handleLogin}
          onGoToRegister={handleGoToRegister}
        />
      );
    }
  }

  const renderContent = () => {
    if (isAdmin) {
      // Vistas de Administrador
      switch (activeView) {
        case 'summary':
          return <GeneralSummary />;
        case 'students':
          return <StudentsList />;
        case 'alerts':
          return <AlertsSystem />;
        case 'resources-admin':
          return (
            <div className="p-6">
              <div className="bg-white rounded-xl shadow-soft border p-12 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Gestión de Recursos
                </h2>
                <p className="text-gray-600 mb-6">
                  Esta funcionalidad estará disponible próximamente.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
                  🚧 En desarrollo
                </div>
              </div>
            </div>
          );
        default:
          return <GeneralSummary />;
      }
    } else {
      // Vistas de Estudiante
      switch (activeView) {
        case 'dashboard':
          return <Dashboard studentId={user.id} />;
        case 'evaluation':
          return (
            <WeeklyEvaluation 
              studentId={user.id} 
              onEvaluationComplete={handleEvaluationComplete}
            />
          );
        case 'resources':
          return <Resources studentId={user.id} />;
        default:
          return <Dashboard studentId={user.id} />;
      }
    }
  };

  // Contar alertas simuladas (puedes conectar esto con datos reales después)
  const alertsCount = isAdmin ? 5 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header
        title="Mi Bienestar DACYTI"
        user={user}
        alertsCount={alertsCount}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onNotificationsClick={() => isAdmin ? setActiveView('alerts') : console.log('Notifications')}
        onLogout={handleLogout}
      />

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 z-50 transition-transform duration-300 ease-in-out`}>
          <Navigation
            activeView={activeView}
            onViewChange={handleViewChange}
            userRole={user.role}
          />
        </div>

        {/* Main Content */}
        <div className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : ''} min-h-screen transition-all duration-300`}>
          <main className="pt-0">
            <div className="animate-fade-in">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-900 bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// App principal con AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;