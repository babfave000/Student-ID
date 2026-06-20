import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';

const StudentRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registration, setRegistration] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    faculty: '',
    department: '',
    level: ''
  });

  useEffect(() => {
    fetchRegistration();
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        faculty: user.faculty || '',
        department: user.department || '',
        level: user.level || ''
      });
    }
  }, [user]);

  const fetchRegistration = async () => {
    try {
      const response = await api.get('/registrations/my-registration');
      if (response.data.hasRegistration) {
        setRegistration(response.data.registration);
        // Pre-fill form with existing data
        const reg = response.data.registration;
        setFormData({
          first_name: reg.first_name,
          last_name: reg.last_name,
          email: reg.email,
          phone: reg.phone,
          faculty: reg.faculty,
          department: reg.department,
          level: reg.level
        });
        if (reg.photo_path) {
          setPhotoPreview(getImageUrl(reg.photo_path));
        }
      }
    } catch (error) {
      console.error('Error fetching registration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Create or update registration
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }
      
      console.log('Submitting registration...');
      console.log('Is existing registration?', !!registration);
      console.log('Form data:', formData);

      console.log('Sending POST to /registrations with FormData');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }

      // The backend POST route already supports both create and update and is the
      // only route configured to receive the uploaded photo file.
      const response = await api.post('/registrations', formDataToSend);
      
      console.log('Response received:', response);

      setSuccess('Registration saved successfully! Please submit when ready.');
      // Refresh registration data
      await fetchRegistration();
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.error || 'Failed to save registration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitApplication = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await api.post('/registrations/submit');
      setSuccess('Registration submitted successfully! You will be notified via email.');
      setTimeout(() => navigate('/student/dashboard'), 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit registration');
    } finally {
      setSubmitting(false);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ID Card Registration</h1>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="btn-secondary text-xs sm:text-sm px-3 sm:px-4"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="card">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6">
            {registration ? 'Update Registration' : 'New Registration'}
          </h2>

          {error && (
            <div className="mb-5 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="+2348012345678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faculty *
                </label>
                <input
                  type="text"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level *
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                >
                  <option value="">Select Level</option>
                  <option value="100">100 Level</option>
                  <option value="200">200 Level</option>
                  <option value="300">300 Level</option>
                  <option value="400">400 Level</option>
                  <option value="500">500 Level</option>
                  <option value="600">600 Level</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passport Photograph *
                </label>
                <div className="mt-2">
                  {photoPreview ? (
                    <div className="mb-4">
                      <img
                        src={photoPreview}
                        alt="Photo preview"
                        className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-lg border"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 sm:p-6 text-center">
                      <p className="text-sm text-gray-500">
                        No photo uploaded
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handlePhotoChange}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a clear passport photograph (JPEG, PNG). Max size: 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Registration'}
              </button>

              {registration && registration.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={handleSubmitApplication}
                  disabled={submitting}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default StudentRegistration;
