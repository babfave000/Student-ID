import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const VALID_STATUSES = ['pending', 'approved', 'ready', 'collected'];

const getStatusFromSearch = (search) => {
  const queryStatus = new URLSearchParams(search).get('status');
  return VALID_STATUSES.includes(queryStatus) ? queryStatus : 'pending';
};

const AdminRegistrationQueue = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRegistrations, setSelectedRegistrations] = useState([]);
  const [status, setStatus] = useState(getStatusFromSearch(location.search));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, [status, page]);

  useEffect(() => {
    const nextStatus = getStatusFromSearch(location.search);
    if (nextStatus !== status) {
      setStatus(nextStatus);
      setPage(1);
      setSelectedRegistrations([]);
    }
  }, [location.search, status]);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');

    try {
      let endpoint = '/admin/registrations/pending';
      if (status === 'approved') {
        endpoint = '/admin/registrations/approved';
      } else if (status === 'ready') {
        endpoint = '/admin/registrations/collection?status=ready';
      } else if (status === 'collected') {
        endpoint = '/admin/registrations/collection?status=collected';
      }

      const separator = endpoint.includes('?') ? '&' : '?';
      const response = await api.get(`${endpoint}${separator}page=${page}&limit=20`);
      setRegistrations(response.data.registrations);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      setError('Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = (nextStatus) => {
    setSelectedRegistrations([]);
    setPage(1);
    setStatus(nextStatus);
    navigate(`/admin/registrations?status=${nextStatus}`);
  };

  const handleSelectRegistration = (id) => {
    setSelectedRegistrations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRegistrations.length === registrations.length) {
      setSelectedRegistrations([]);
    } else {
      setSelectedRegistrations(registrations.map((reg) => reg.id));
    }
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(`approve-${id}`);
      await api.put(`/admin/registrations/${id}/approve`);
      toast.success('Registration approved successfully.');
      fetchRegistrations();
    } catch (error) {
      setError('Failed to approve registration');
      toast.error('Failed to approve registration.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        setActionLoading(`reject-${id}`);
        await api.put(`/admin/registrations/${id}/reject`, { rejection_reason: reason });
        toast.success('Registration rejected successfully.');
        fetchRegistrations();
      } catch (error) {
        setError('Failed to reject registration');
        toast.error('Failed to reject registration.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleBatchApprove = async () => {
    if (selectedRegistrations.length === 0) return;

    try {
      setActionLoading('approve-selected');
      for (const id of selectedRegistrations) {
        await api.put(`/admin/registrations/${id}/approve`);
      }
      setSelectedRegistrations([]);
      toast.success(`${selectedRegistrations.length} registration(s) approved successfully.`);
      fetchRegistrations();
    } catch (error) {
      setError('Failed to approve selected registrations');
      toast.error('Failed to approve selected registrations.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkCollected = async (id) => {
    try {
      setActionLoading(`collect-${id}`);
      await api.put(`/admin/registrations/${id}/collect`);
      toast.success('Registration marked as collected.');
      fetchRegistrations();
    } catch (error) {
      setError('Failed to mark registration as collected');
      toast.error('Failed to mark registration as collected.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (currentStatus) => {
    const colors = {
      SUBMITTED: 'status-submitted',
      UNDER_REVIEW: 'status-under-review',
      APPROVED: 'status-approved',
      BATCHED: 'status-batched',
      READY_FOR_COLLECTION: 'status-ready-for-collection',
      COLLECTED: 'status-collected',
      REJECTED: 'status-rejected'
    };
    return colors[currentStatus] || 'status-draft';
  };

  const pageTitle = status === 'ready' || status === 'collected'
    ? 'Collection Queue'
    : 'Registration Queue';

  const emptyLabel = {
    pending: 'pending',
    approved: 'approved',
    ready: 'ready for collection',
    collected: 'collected'
  }[status];

  const showSelection = status === 'pending' || status === 'approved';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="btn-secondary text-xs sm:text-sm px-3 sm:px-4"
              >
                Back to Dashboard
              </button>
              {selectedRegistrations.length > 0 && status === 'pending' && (
                <button
                  onClick={handleBatchApprove}
                  disabled={actionLoading === 'approve-selected'}
                  className="btn-primary text-xs sm:text-sm px-3 sm:px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === 'approve-selected'
                    ? 'Approving Selected...'
                    : `Approve Selected (${selectedRegistrations.length})`}
                </button>
              )}
              {selectedRegistrations.length > 0 && status === 'approved' && (
                <button
                  onClick={() => navigate('/admin/batches', { state: { selectedIds: selectedRegistrations } })}
                  className="btn-primary text-xs sm:text-sm px-3 sm:px-4"
                >
                  Choose Existing Batch ({selectedRegistrations.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-wrap gap-2 sm:space-x-4 mb-4 sm:mb-6">
          <button
            onClick={() => changeStatus('pending')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm ${
              status === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => changeStatus('approved')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm ${
              status === 'approved'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => changeStatus('ready')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm ${
              status === 'ready'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Ready
          </button>
          <button
            onClick={() => changeStatus('collected')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg font-medium text-sm ${
              status === 'collected'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Collected
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No {emptyLabel} registrations found</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block card overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {showSelection && (
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRegistrations.length === registrations.length}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matric No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Faculty/Dept
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="hover:bg-gray-50">
                      {showSelection && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRegistrations.includes(registration.id)}
                            onChange={() => handleSelectRegistration(registration.id)}
                            className="rounded"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {registration.last_name}, {registration.first_name}
                        </div>
                        <div className="text-sm text-gray-500">{registration.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registration.matric_no}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{registration.faculty}</div>
                        <div className="text-sm text-gray-500">{registration.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`status-badge ${getStatusBadge(registration.status)}`}>
                          {registration.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(registration.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(registration.id)}
                              disabled={!!actionLoading}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === `approve-${registration.id}` ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(registration.id)}
                              disabled={!!actionLoading}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === `reject-${registration.id}` ? 'Rejecting...' : 'Reject'}
                            </button>
                          </>
                        )}
                        {status === 'approved' && (
                          <button
                            onClick={() => navigate('/admin/batches', { state: { selectedIds: [registration.id] } })}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Choose Batch
                          </button>
                        )}
                        {status === 'ready' && (
                          <button
                            onClick={() => handleMarkCollected(registration.id)}
                            disabled={!!actionLoading}
                            className="text-emerald-600 hover:text-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === `collect-${registration.id}` ? 'Marking...' : 'Mark Collected'}
                          </button>
                        )}
                        {status === 'collected' && (
                          <span className="text-gray-500">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-4">
              {registrations.map((registration) => (
                <div key={registration.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {showSelection && (
                        <input
                          type="checkbox"
                          checked={selectedRegistrations.includes(registration.id)}
                          onChange={() => handleSelectRegistration(registration.id)}
                          className="rounded"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {registration.last_name}, {registration.first_name}
                        </div>
                        <div className="text-xs text-gray-500">{registration.email}</div>
                      </div>
                    </div>
                    <span className={`status-badge ${getStatusBadge(registration.status)} text-xs`}>
                      {registration.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Matric No:</span>
                      <span className="text-gray-900">{registration.matric_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Faculty:</span>
                      <span className="text-gray-900">{registration.faculty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Department:</span>
                      <span className="text-gray-900">{registration.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Submitted:</span>
                      <span className="text-gray-900">{new Date(registration.submitted_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(registration.id)}
                          disabled={!!actionLoading}
                          className="flex-1 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === `approve-${registration.id}` ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(registration.id)}
                          disabled={!!actionLoading}
                          className="flex-1 bg-red-100 text-red-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === `reject-${registration.id}` ? 'Rejecting...' : 'Reject'}
                        </button>
                      </>
                    )}
                    {status === 'approved' && (
                      <button
                        onClick={() => navigate('/admin/batches', { state: { selectedIds: [registration.id] } })}
                        className="flex-1 bg-primary-100 text-primary-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-200"
                      >
                        Choose Batch
                      </button>
                    )}
                    {status === 'ready' && (
                      <button
                        onClick={() => handleMarkCollected(registration.id)}
                        disabled={!!actionLoading}
                        className="flex-1 bg-emerald-100 text-emerald-800 px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === `collect-${registration.id}` ? 'Marking...' : 'Mark Collected'}
                      </button>
                    )}
                    {status === 'collected' && (
                      <div className="flex-1 bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium text-center">
                        Completed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminRegistrationQueue;
