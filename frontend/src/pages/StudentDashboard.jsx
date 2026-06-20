import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistration();
  }, []);

  const fetchRegistration = async () => {
    try {
      const response = await api.get('/registrations/my-registration');
      if (response.data.hasRegistration) {
        setRegistration(response.data.registration);
      }
    } catch (error) {
      console.error('Error fetching registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'status-draft',
      SUBMITTED: 'status-submitted',
      UNDER_REVIEW: 'status-under-review',
      APPROVED: 'status-approved',
      BATCHED: 'status-batched',
      PRINTED: 'status-printed',
      READY_FOR_COLLECTION: 'status-ready-for-collection',
      COLLECTED: 'status-collected',
      REJECTED: 'status-rejected',
      HOLD: 'status-hold'
    };
    return colors[status] || 'status-draft';
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getWorkflowSteps = () => {
    return [
      { key: 'DRAFT', label: 'Draft' },
      { key: 'SUBMITTED', label: 'Submitted' },
      { key: 'UNDER_REVIEW', label: 'Under Review' },
      { key: 'APPROVED', label: 'Approved' },
      { key: 'BATCHED', label: 'Batched' },
      { key: 'PRINTED', label: 'Printed' },
      { key: 'READY_FOR_COLLECTION', label: 'Ready for Collection' },
      { key: 'COLLECTED', label: 'Collected' }
    ];
  };

  const getCurrentStepIndex = (status) => {
    const steps = getWorkflowSteps();
    return steps.findIndex(step => step.key === status);
  };

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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600">Welcome, {user?.first_name} {user?.last_name}</p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
                <span className="text-xs sm:text-sm text-gray-600">{user?.matric_no}</span>
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {registration ? (
          <>
            {/* Status Card */}
            <div className="card mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Application Status</h2>
                <span className={`status-badge ${getStatusColor(registration.status)}`}>
                  {getStatusLabel(registration.status)}
                </span>
              </div>

              {/* Workflow Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4 overflow-x-auto pb-4">
                  {getWorkflowSteps().map((step, index) => {
                    const currentIndex = getCurrentStepIndex(registration.status);
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                      <div key={step.key} className="flex flex-col items-center flex-shrink-0 px-2 sm:px-1 flex-1">
                        <div
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                            isCompleted
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {isCompleted ? '✓' : index + 1}
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs mt-1 sm:mt-2 text-center whitespace-nowrap ${
                            isCurrent ? 'font-medium text-primary-600' : 'text-gray-500'
                          }`}
                        >
                          {step.label}
                        </span>
                        {index < getWorkflowSteps().length - 1 && (
                          <div
                            className={`hidden sm:block h-1 w-full mt-6 sm:mt-8 ${
                              isCompleted ? 'bg-primary-600' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student Information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium">{registration.first_name} {registration.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Matriculation Number</p>
                    <p className="font-medium">{registration.matric_no}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{registration.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{registration.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Faculty</p>
                    <p className="font-medium">{registration.faculty}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{registration.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Level</p>
                    <p className="font-medium">{registration.level} Level</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {registration.status === 'DRAFT' && (
                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={() => navigate('/student/registration')}
                    className="btn-primary"
                  >
                    Complete Registration
                  </button>
                </div>
              )}

              {registration.status === 'REJECTED' && (
                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={() => navigate('/student/registration')}
                    className="btn-primary"
                  >
                    Update and Resubmit
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Card */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
              <div className="text-sm text-gray-600">
                <p>You will receive email notifications at each step of the process.</p>
                <p className="mt-2">Current email: {registration.email}</p>
              </div>
            </div>
          </>
        ) : (
          /* No Registration Card */
          <div className="card text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              No Active Registration
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't started your ID card registration process yet.
            </p>
            <button
              onClick={() => navigate('/student/registration')}
              className="btn-primary"
            >
              Start Registration
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;