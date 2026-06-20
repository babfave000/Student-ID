import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const AdminBatchDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [batch, setBatch] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPackage, setDownloadingPackage] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBatchDetails();
  }, [id]);

  const fetchBatchDetails = async () => {
    setLoading(true);
    try {
      const [batchResponse, reportResponse] = await Promise.all([
        api.get(`/admin/batches/${id}`),
        api.get(`/admin/batches/${id}/report`)
      ]);
      
      setBatch(batchResponse.data.batch);
      setReport(reportResponse.data.report);
    } catch (error) {
      setError('Failed to fetch batch details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusUpdating(true);
      await api.put(`/admin/batches/${id}/status`, { status: newStatus });
      const statusMessage = newStatus === 'PRINTED'
        ? 'Batch sent to printer successfully.'
        : 'Batch marked as received successfully.';
      toast.success(statusMessage);
      fetchBatchDetails();
    } catch (error) {
      setError('Failed to update batch status');
      toast.error('Failed to update batch status.');
    } finally {
      setStatusUpdating(false);
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

  const downloadBatchPackage = async () => {
    try {
      setDownloadingPackage(true);
      const response = await api.get(`/admin/batches/${id}/package`, {
        responseType: 'blob'
      });

      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batch?.batch_name || 'batch'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Batch package download started.');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to download batch package');
      toast.error(error.response?.data?.error || 'Failed to download batch package.');
    } finally {
      setDownloadingPackage(false);
    }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Batch Details</h1>
              <p className="text-sm text-gray-600">{batch?.batch_name}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/admin/batches')}
                className="btn-secondary"
              >
                Back to Batches
              </button>
              <button
                onClick={downloadBatchPackage}
                disabled={downloadingPackage}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloadingPackage ? 'Preparing Package...' : 'Download Names + Photos'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {batch && (
          <>
            {/* Batch Information */}
            <div className="card mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Batch Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`status-badge ${getStatusBadge(batch.status)}`}>
                    {batch.status}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Registrations</p>
                  <p className="text-lg font-semibold">{batch.registrations?.length || 0}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Created Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(batch.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {batch.created_by_name && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Created By</p>
                    <p className="text-lg font-semibold">{batch.created_by_name}</p>
                  </div>
                )}
                
                {batch.description && (
                  <div className="md:col-span-2 lg:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-lg font-semibold">{batch.description}</p>
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium text-gray-700 mb-3">Update Status</p>
                <div className="flex space-x-4">
                  {batch.status === 'SENT' && (
                    <button
                      onClick={() => handleStatusUpdate('PRINTED')}
                      disabled={statusUpdating}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {statusUpdating ? 'Sending to Printer...' : 'Mark as Printed'}
                    </button>
                  )}
                  
                  {batch.status === 'PRINTED' && (
                    <button
                      onClick={() => handleStatusUpdate('RECEIVED')}
                      disabled={statusUpdating}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {statusUpdating ? 'Marking as Received...' : 'Mark as Received (Ready for Collection)'}
                    </button>
                  )}
                  
                  {batch.status === 'RECEIVED' && (
                    <span className="text-sm text-gray-600">
                      Batch is complete and cards are ready for collection
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Registrations List */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Registrations ({batch.registrations?.length || 0})
              </h2>
              
              {batch.registrations && batch.registrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Matric No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Faculty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {batch.registrations.map((registration) => (
                        <tr key={registration.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {registration.matric_no}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.last_name}, {registration.first_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.faculty}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {registration.phone}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No registrations in this batch</p>
                </div>
              )}
            </div>

            {/* Summary Statistics */}
            {report && report.summary && (
              <div className="card mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary Statistics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">By Faculty</h3>
                    <div className="space-y-2">
                      {Object.entries(report.summary.by_faculty || {}).map(([faculty, count]) => (
                        <div key={faculty} className="flex justify-between text-sm">
                          <span className="text-gray-600">{faculty}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">By Department</h3>
                    <div className="space-y-2">
                      {Object.entries(report.summary.by_department || {}).map(([dept, count]) => (
                        <div key={dept} className="flex justify-between text-sm">
                          <span className="text-gray-600">{dept}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">By Level</h3>
                    <div className="space-y-2">
                      {Object.entries(report.summary.by_level || {}).map(([level, count]) => (
                        <div key={level} className="flex justify-between text-sm">
                          <span className="text-gray-600">{level} Level</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminBatchDetails;
