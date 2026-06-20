import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics');
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const statCards = [
    { key: 'totalStudents', label: 'Total Students', color: 'bg-blue-500' },
    { key: 'pendingRegistrations', label: 'Pending Reviews', color: 'bg-yellow-500' },
    { key: 'approvedRegistrations', label: 'Approved', color: 'bg-green-500' },
    { key: 'readyForCollection', label: 'Ready for Collection', color: 'bg-emerald-500' },
    { key: 'totalBatches', label: 'Total Batches', color: 'bg-purple-500' },
    { key: 'collected', label: 'Collected', color: 'bg-teal-500' }
  ];

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600">Welcome, {user?.full_name}</p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                <span className="text-xs sm:text-sm text-gray-600 capitalize">{user?.role}</span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-xs sm:text-sm px-3 sm:px-4"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {statCards.map((stat) => (
              <div key={stat.key} className="card p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900">
                      {statistics?.[stat.key] || 0}
                    </p>
                  </div>
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 ${stat.color} rounded-full flex items-center justify-center`}>
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="card mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/admin/registrations')}
                className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <p className="font-medium text-gray-900 text-sm sm:text-base">Review Registrations</p>
                <p className="text-xs sm:text-sm text-gray-600">Process pending applications</p>
              </button>

              <button
                onClick={() => navigate('/admin/registrations?status=approved')}
                className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <p className="font-medium text-gray-900 text-sm sm:text-base">View Approved</p>
                <p className="text-xs sm:text-sm text-gray-600">See all approved registrations</p>
              </button>

              <button
                onClick={() => navigate('/admin/batches')}
                className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <p className="font-medium text-gray-900 text-sm sm:text-base">Manage Batches</p>
                <p className="text-xs sm:text-sm text-gray-600">Create and manage production batches</p>
              </button>

              <button
                onClick={() => navigate('/admin/registrations?status=ready')}
                className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <p className="font-medium text-gray-900 text-sm sm:text-base">Collection Queue</p>
                <p className="text-xs sm:text-sm text-gray-600">Manage card collections</p>
              </button>
            </div>
          </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">By Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Draft</span>
                  <span className="font-medium">{statistics?.totalRegistrations - statistics?.pendingRegistrations - statistics?.approvedRegistrations - statistics?.batchedRegistrations - statistics?.readyForCollection - statistics?.collected || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Submitted (Pending)</span>
                  <span className="font-medium">{statistics?.pendingRegistrations || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Approved</span>
                  <span className="font-medium">{statistics?.approvedRegistrations || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Batched</span>
                  <span className="font-medium">{statistics?.batchedRegistrations || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ready for Collection</span>
                  <span className="font-medium">{statistics?.readyForCollection || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Collected</span>
                  <span className="font-medium">{statistics?.collected || 0}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Batch Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sent to Printer</span>
                  <span className="font-medium">{statistics?.batches?.sent || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Printed</span>
                  <span className="font-medium">{statistics?.batches?.printed || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Received</span>
                  <span className="font-medium">{statistics?.batches?.received || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;