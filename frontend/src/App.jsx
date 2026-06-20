import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentRegistration from './pages/StudentRegistration';
import AdminDashboard from './pages/AdminDashboard';
import AdminRegistrationQueue from './pages/AdminRegistrationQueue';
import AdminBatchManagement from './pages/AdminBatchManagement';
import AdminBatchDetails from './pages/AdminBatchDetails';

// Protected Route Component
const ProtectedRoute = ({ children, allowedUserTypes }) => {
  const { isAuthenticated, userType, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Student Routes */}
            <Route 
              path="/student/dashboard" 
              element={
                <ProtectedRoute allowedUserTypes={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/registration" 
              element={
                <ProtectedRoute allowedUserTypes={['student']}>
                  <StudentRegistration />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedUserTypes={['staff']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/registrations" 
              element={
                <ProtectedRoute allowedUserTypes={['staff']}>
                  <AdminRegistrationQueue />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/batches" 
              element={
                <ProtectedRoute allowedUserTypes={['staff']}>
                  <AdminBatchManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/batches/:id" 
              element={
                <ProtectedRoute allowedUserTypes={['staff']}>
                  <AdminBatchDetails />
                </ProtectedRoute>
              } 
            />
            
            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
