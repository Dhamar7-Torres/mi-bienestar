import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROUTES } from './constants';

// Componentes de autenticación
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Componentes de estudiante
import StudentDashboard from './components/Student/StudentDashboard';
import WeeklyEvaluation from './components/Student/WeeklyEvaluation';
import Resources from './components/Student/Resources';
import EvaluationHistory from './components/Student/EvaluationHistory'; 

// Componentes de coordinador
import CoordinatorDashboard from './components/Coordinator/CoordinatorDashboard';
import StudentsList from './components/Coordinator/StudentsList';
import Alerts from './components/Coordinator/Alerts';
import StudentDetails from './components/Coordinator/StudentDetails'; 

// Componentes comunes
import Loading from './components/Common/Loading';
import MiPerfil from './components/Common/MiPerfil';

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

// Componente para rutas públicas
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
      {/* Ruta raíz */}
      <Route path={ROUTES.HOME} element={<HomeRedirect />} />

      {/* Rutas públicas */}
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

      <Route path={ROUTES.STUDENT_HISTORY} element={
        <ProtectedRoute requiredRole="ESTUDIANTE">
          <EvaluationHistory />
        </ProtectedRoute>
      } />

      {/* NUEVA RUTA - Perfil de estudiante */}
      <Route path="/estudiante/perfil" element={
        <ProtectedRoute requiredRole="ESTUDIANTE">
          <MiPerfil />
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

      <Route path="/coordinador/estudiantes/:studentId" element={
        <ProtectedRoute requiredRole="COORDINADOR">
          <StudentDetails />
        </ProtectedRoute>
      } />
      
      <Route path={ROUTES.COORDINATOR_ALERTS} element={
        <ProtectedRoute requiredRole="COORDINADOR">
          <Alerts />
        </ProtectedRoute>
      } />

      {/* NUEVA RUTA - Perfil de coordinador */}
      <Route path="/coordinador/perfil" element={
        <ProtectedRoute requiredRole="COORDINADOR">
          <MiPerfil />
        </ProtectedRoute>
      } />

      {/* Ruta 404 - DISEÑO MEJORADO */}
      <Route path="*" element={
        <div className="min-h-screen bg-gradient-to-br from-sky-200 via-cyan-300 to-white flex items-center justify-center" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
          {/* Logo en esquina superior izquierda */}
          <div className="absolute top-6 left-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <svg width="40" height="40" viewBox="0 0 48 48">
                  <defs>
                    <linearGradient id="logo404Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="50%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#0891b2" />
                    </linearGradient>
                  </defs>
                  <circle cx="24" cy="24" r="20" fill="url(#logo404Gradient)" rx="20"/>
                  <circle cx="30" cy="15" r="3" fill="#f97316"/>
                  <path d="M24 30c-1.3-1.3-7-5-7-10 0-2.5 1.7-4 4.2-4s4.2 1.5 4.2 4c0 0 0-2.5 0-4 0-2.5 1.7-4 4.2-4s4.2 1.5 4.2 4c0 5-5.6 8.7-7 10z" fill="white"/>
                </svg>
              </div>
              <div className="text-gray-800">
                <h1 className="text-lg font-black tracking-tight">Bienestar</h1>
                <p className="text-xs font-bold text-gray-600 -mt-1">DACYTI</p>
              </div>
            </div>
          </div>

          {/* Contenido 404 */}
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20">
            <div className="mb-8">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-400 to-pink-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-8xl font-black text-gray-800 mb-4">404</h1>
              <p className="text-2xl text-gray-600 font-bold mb-2">Página no encontrada</p>
              <p className="text-gray-500 font-medium">La página que buscas no existe o ha sido movida.</p>
            </div>
            
            <button 
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold py-4 px-8 rounded-3xl hover:from-teal-600 hover:to-blue-600 focus:outline-none focus:ring-4 focus:ring-teal-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Volver atrás
            </button>
          </div>

          {/* Elementos decorativos */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-cyan-300/20 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-4 w-24 h-24 bg-blue-400/15 rounded-full blur-lg"></div>
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
        {/* FONDO DEGRADADO PRINCIPAL APLICADO */}
        <div className="min-h-screen bg-gradient-to-br from-sky-200 via-cyan-300 to-white" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;