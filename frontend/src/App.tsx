import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import Vacations from './pages/Vacations';
import VacationForm from './pages/VacationForm';
import Reports from './pages/Reports';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { token, isAdmin } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/vacations" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { token } = useAuth();

  return (
    <>
      {token && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to={token ? '/vacations' : '/login'} replace />} />
        <Route path="/register" element={token ? <Navigate to="/vacations" /> : <Register />} />
        <Route path="/login" element={token ? <Navigate to="/vacations" /> : <Login />} />
        <Route
          path="/vacations"
          element={
            <ProtectedRoute>
              <Vacations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vacations/add"
          element={
            <ProtectedRoute adminOnly>
              <VacationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vacations/edit/:id"
          element={
            <ProtectedRoute adminOnly>
              <VacationForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute adminOnly>
              <Reports />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
