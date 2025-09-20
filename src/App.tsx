import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROUTES } from './constants';

// Componentes que crearemos
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import StudentDashboard from './components/Student/StudentDashboard';
import WeeklyEvaluation from './components/Student/WeeklyEvaluation';
import Resources from './components/Student/Resources';
import CoordinatorDashboard from './components/Coordinator/CoordinatorDashboard';
import StudentsList from './components/Coordinator/StudentsList';
import Alerts from './components/Coordinator/Alerts';
import Loading from './components/Common/Loading';

// Componente para rutas protegidas
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ESTUDIANTE' | 'COORDINADOR';
}

function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, usuario, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (requiredRole && usuario?.tipoUsuario !== requiredRole) {
    const redirectPath = usuario?.tipoUsuario === 'ESTUDIANTE' 
      ? ROUTES.STUDENT_DASHBOARD 
      : ROUTES.COORDINATOR_DASHBOARD;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// Componente para rutas públicas (solo accesibles si NO estás autenticado)
interface PublicRouteProps {
  children: React.ReactNode;
}

function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, usuario, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (isAuthenticated) {
    const redirectPath = usuario?.tipoUsuario === 'ESTUDIANTE' 
      ? ROUTES.STUDENT_DASHBOARD 
      : ROUTES.COORDINATOR_DASHBOARD;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// Componente para redirigir desde la raíz
function HomeRedirect() {
  const { isAuthenticated, usuario, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const redirectPath = usuario?.tipoUsuario === 'ESTUDIANTE' 
    ? ROUTES.STUDENT_DASHBOARD 
    : ROUTES.COORDINATOR_DASHBOARD;
  
  return <Navigate to={redirectPath} replace />;
}

// Componente de rutas principales
function AppRoutes() {
  return (
    <Routes>
      {/* Ruta raíz - redirige según autenticación */}
      <Route path={ROUTES.HOME} element={<HomeRedirect />} />

      {/* Rutas públicas - solo accesibles sin autenticación */}
      <Route path={ROUTES.LOGIN} element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      <Route path={ROUTES.REGISTER} element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />

      {/* Rutas de estudiante */}
      <Route path={ROUTES.STUDENT_DASHBOARD} element={
        <ProtectedRoute requiredRole="ESTUDIANTE">
          <StudentDashboard />
        </ProtectedRoute>
      } />
      
      <Route path={ROUTES.STUDENT_EVALUATION} element={
        <ProtectedRoute requiredRole="ESTUDIANTE">
          <WeeklyEvaluation />
        </ProtectedRoute>
      } />
      
      <Route path={ROUTES.STUDENT_RESOURCES} element={
        <ProtectedRoute requiredRole="ESTUDIANTE">
          <Resources />
        </ProtectedRoute>
      } />

      {/* Rutas de coordinador */}
      <Route path={ROUTES.COORDINATOR_DASHBOARD} element={
        <ProtectedRoute requiredRole="COORDINADOR">
          <CoordinatorDashboard />
        </ProtectedRoute>
      } />
      
      <Route path={ROUTES.COORDINATOR_STUDENTS} element={
        <ProtectedRoute requiredRole="COORDINADOR">
          <StudentsList />
        </ProtectedRoute>
      } />
      
      <Route path={ROUTES.COORDINATOR_ALERTS} element={
        <ProtectedRoute requiredRole="COORDINADOR">
          <Alerts />
        </ProtectedRoute>
      } />

      {/* Ruta 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900">404</h1>
            <p className="text-xl text-gray-600 mt-4">Página no encontrada</p>
            <button 
              onClick={() => window.history.back()}
              className="mt-6 btn-primary"
            >
              Volver atrás
            </button>
          </div>
        </div>
      } />
    </Routes>
  );
}

// Componente principal
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;