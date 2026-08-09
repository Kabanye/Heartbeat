import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarProvider } from './context/SidebarContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Incidents from './pages/Incidents';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

// Loading spinner for auth check
function AuthLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z">
            <animateTransform attributeName="transform" type="scale" values="1;1.15;1" dur="1.2s" repeatCount="indefinite" />
          </path>
        </svg>
        <p className="text-gray-400 text-sm animate-pulse">Loading your dashboard...</p>
      </div>
    </div>
  );
}

// Private route wrapper
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public route wrapper (redirects to dashboard if already logged in)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 404 Not Found page
function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center p-8">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl font-bold text-red-400">404</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-gray-400 text-sm mb-6">The page you're looking for doesn't exist.</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <SidebarProvider>
            <BrowserRouter>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1F1329',
                    color: '#F6EDE9',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '14px',
                  },
                  success: {
                    iconTheme: {
                      primary: '#7DD9A6',
                      secondary: '#1F1329',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#FF5D73',
                      secondary: '#1F1329',
                    },
                  },
                }}
                containerStyle={{
                  top: 20,
                  right: 20,
                }}
              />
              <Routes>
                {/* Public routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/services"
                  element={
                    <PrivateRoute>
                      <Services />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/services/:id"
                  element={
                    <PrivateRoute>
                      <ServiceDetail />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/incidents"
                  element={
                    <PrivateRoute>
                      <Incidents />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <PrivateRoute>
                      <Notifications />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <Settings />
                    </PrivateRoute>
                  }
                />

                {/* 404 catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SidebarProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;