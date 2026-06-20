import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const AdminBatchManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [batches, setBatches] = useState([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRegistrations, setSelectedRegistrations] = useState(
    location.state?.selectedIds || []
  );
  const [batchForm, setBatchForm] = useState({
    batch_name: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [statusUpdatingBatchId, setStatusUpdatingBatchId] = useState(null);
  const [addingToBatchId, setAddingToBatchId] = useState(null);

  useEffect(() => {
    fetchBatches();
    fetchApprovedRegistrations();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await api.get('/admin/batches');
      setBatches(response.data.batches);
    } catch (error) {
      setError('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedRegistrations = async () => {
    try {
      const response = await api.get('/admin/registrations/approved?limit=100');
      setApprovedRegistrations(response.data.registrations);
    } catch (error) {
      console.error('Error fetching approved registrations:', error);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (selectedRegistrations.length === 0) {
      setError('Please select at least one registration');
      toast.error('Please select at least one registration.');
      return;
    }

    try {
      setCreatingBatch(true);
      await api.post('/admin/batches', {
        ...batchForm,
        registration_ids: selectedRegistrations
      });
      setSuccess('Batch created successfully');
      toast.success('Batch created successfully.');
      setShowCreateModal(false);
      setBatchForm({ batch_name: '', description: '' });
      setSelectedRegistrations([]);
      fetchBatches();
      fetchApprovedRegistrations();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create batch');
      toast.error(error.response?.data?.error || 'Failed to create batch.');
    } finally {
      setCreatingBatch(false);
    }
  };

  const handleSelectRegistration = (id) => {
    setSelectedRegistrations(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBatchStatusUpdate = async (batchId, newStatus) => {
    try {
      setStatusUpdatingBatchId(batchId);
      await api.put(`/admin/batches/${batchId}/status`, { status: newStatus });
      fetchBatches();
      setSuccess('Batch status updated successfully');
      const statusMessage = newStatus === 'PRINTED'
        ? 'Batch sent to printer successfully.'
        : 'Batch marked as received successfully.';
      toast.success(statusMessage);
    } catch (error) {
      setError('Failed to update batch status');
      toast.error('Failed to update batch status.');
    } finally {
      setStatusUpdatingBatchId(null);
    }
  };

  const handleAddToExistingBatch = async (batchId) => {
    if (selectedRegistrations.length === 0) {
      toast.error('Please select at least one approved registration.');
      return;
    }

    try {
      setAddingToBatchId(batchId);
      setError('');
      setSuccess('');

      await api.post(`/admin/batches/${batchId}/registrations`, {
        registration_ids: selectedRegistrations
      });

      setSuccess('Selected registrations added to the existing batch successfully');
      toast.success('Selected registrations added to the batch successfully.');
      setSelectedRegistrations([]);
      fetchBatches();
      fetchApprovedRegistrations();
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add registrations to the selected batch';
      setError(message);
      toast.error(message);
    } finally {
      setAddingToBatchId(null);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      SENT: 'status-submitted',
      PRINTED: 'status-printed',
      RECEIVED: 'status-ready-for-collection'
    };
    return colors[status] || 'status-draft';
  };

  const hasIncomingSelection = selectedRegistrations.length > 0;
  const availableBatches = batches.filter((batch) => batch.status === 'SENT');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Batch Management</h1>
              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-4 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="btn-secondary text-xs sm:text-sm px-3 sm:px-4"
                >
                  Back to Dashboard
                </button>
                {!hasIncomingSelection && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary text-xs sm:text-sm px-3 sm:px-4"
                  >
                    Create New Batch
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {hasIncomingSelection && (
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Selected to Existing Batch</h2>
                <p className="text-sm text-gray-600">
                  {selectedRegistrations.length} approved registration(s) ready to be added to an existing unprinted batch.
                </p>
              </div>
              <button
                onClick={() => setSelectedRegistrations([])}
                className="btn-secondary text-sm"
              >
                Clear Selection
              </button>
            </div>
            {availableBatches.length === 0 && (
              <p className="text-sm text-amber-700 mt-4">
                No existing unprinted batches are available. Create a new batch first if needed.
              </p>
            )}
          </div>
        )}

        {/* Batches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : batches.length === 0 ? (
              <div className="col-span-full card text-center py-12">
                <p className="text-gray-600">
                  {hasIncomingSelection ? 'No existing unprinted batches are available yet' : 'No batches created yet'}
                </p>
                {!hasIncomingSelection && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary mt-4"
                  >
                    Create First Batch
                  </button>
                )}
              </div>
            ) : (
              batches.map((batch) => (
                <div key={batch.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{batch.batch_name}</h3>
                    <span className={`status-badge ${getStatusBadge(batch.status)} text-xs`}>
                      {batch.status}
                    </span>
                  </div>
                  
                  {batch.description && (
                    <p className="text-sm text-gray-600 mb-4">{batch.description}</p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Registrations:</span>
                      <span className="font-medium">{batch.registration_count || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {batch.created_by_name && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Created By:</span>
                        <span className="font-medium">{batch.created_by_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {hasIncomingSelection && batch.status === 'SENT' && (
                      <button
                        onClick={() => handleAddToExistingBatch(batch.id)}
                        disabled={addingToBatchId === batch.id}
                        className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingToBatchId === batch.id
                          ? 'Adding Selected...'
                          : `Add Selected Here (${selectedRegistrations.length})`}
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/admin/batches/${batch.id}`)}
                      className="w-full btn-primary text-sm"
                    >
                      View Details
                    </button>
                    
                    {batch.status === 'SENT' && (
                      <button
                        onClick={() => handleBatchStatusUpdate(batch.id, 'PRINTED')}
                        disabled={statusUpdatingBatchId === batch.id}
                        className="w-full btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {statusUpdatingBatchId === batch.id ? 'Sending to Printer...' : 'Mark as Printed'}
                      </button>
                    )}
                    
                    {batch.status === 'PRINTED' && (
                      <button
                        onClick={() => handleBatchStatusUpdate(batch.id, 'RECEIVED')}
                        disabled={statusUpdatingBatchId === batch.id}
                        className="w-full btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {statusUpdatingBatchId === batch.id ? 'Marking as Received...' : 'Mark as Received'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        {/* Create Batch Modal */}
        {!hasIncomingSelection && showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Create New Batch</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateBatch}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Batch Name *
                      </label>
                      <input
                        type="text"
                        value={batchForm.batch_name}
                        onChange={(e) => setBatchForm({ ...batchForm, batch_name: e.target.value })}
                        className="input-field"
                        placeholder="e.g., January 2026 Batch"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={batchForm.description}
                        onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })}
                        className="input-field"
                        rows="3"
                        placeholder="Optional description for this batch"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Select Registrations ({selectedRegistrations.length} selected)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedRegistrations.length === approvedRegistrations.length) {
                              setSelectedRegistrations([]);
                            } else {
                              setSelectedRegistrations(approvedRegistrations.map(r => r.id));
                            }
                          }}
                          className="text-sm text-primary-600 hover:text-primary-900"
                        >
                          {selectedRegistrations.length === approvedRegistrations.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      
                      <div className="border rounded-lg max-h-64 overflow-y-auto">
                        {approvedRegistrations.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No approved registrations available
                          </div>
                        ) : (
                          approvedRegistrations.map((reg) => (
                            <div key={reg.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                              <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedRegistrations.includes(reg.id)}
                                  onChange={() => handleSelectRegistration(reg.id)}
                                  className="rounded"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{reg.last_name}, {reg.first_name}</p>
                                  <p className="text-xs text-gray-500">{reg.matric_no} - {reg.faculty}/{reg.department}</p>
                                </div>
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={selectedRegistrations.length === 0 || creatingBatch}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingBatch ? 'Creating Batch...' : 'Create Batch'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminBatchManagement;
