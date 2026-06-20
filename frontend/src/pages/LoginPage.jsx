import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [userType, setUserType] = useState('student');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    matric_no: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginData = userType === 'staff' 
      ? { username: credentials.username, password: credentials.password }
      : { matric_no: credentials.matric_no, password: credentials.matric_no };

    const result = await login(loginData, userType);
    
    if (result.success) {
      navigate(userType === 'staff' ? '/admin/dashboard' : '/student/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 px-6 sm:px-8 py-5 sm:py-6">
            <h1 className="text-xl sm:text-3xl font-bold text-white text-center">
              {import.meta.env.VITE_INSTITUTION_SHORT_NAME || 'Student'} ID Card System
            </h1>
            <p className="text-center text-primary-100 mt-2 text-xs sm:text-sm">
              {import.meta.env.VITE_INSTITUTION_NAME || 'Institution Registration Portal'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`flex-1 py-3 sm:py-4 text-center font-medium transition-colors text-sm sm:text-base ${
                userType === 'student' 
                  ? 'text-primary-600 border-b-2 border-primary-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setUserType('student')}
            >
              Student
            </button>
            <button
              className={`flex-1 py-3 sm:py-4 text-center font-medium transition-colors text-sm sm:text-base ${
                userType === 'staff' 
                  ? 'text-primary-600 border-b-2 border-primary-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setUserType('staff')}
            >
              Staff
            </button>
          </div>

          {/* Form */}
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            {error && (
              <div className="mb-5 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {userType === 'staff' ? (
                <>
                  <div className="mb-5 sm:mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={credentials.username}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  <div className="mb-5 sm:mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={credentials.password}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="mb-5 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matriculation Number
                  </label>
                  <input
                    type="text"
                    name="matric_no"
                    value={credentials.matric_no}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., CSC/22/001"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use your matric number as both username and password
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Need help? Contact the ICT department</p>
            </div>
          </div>
        </div>

        <p className="text-center text-white text-xs sm:text-sm mt-6">
          © 2026 Institution
        </p>
      </div>
    </div>
  );
};

export default LoginPage;