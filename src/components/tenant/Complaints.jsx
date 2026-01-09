// src/components/tenant/Complaints.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertCircle, Plus, X, CheckCircle, Clock, XCircle, MessageSquare } from 'lucide-react';
import {
  subscribeToUserComplaints,
  createComplaint,
  tenantUpdateComplaintStatus
} from '../../services/complaintService';
import { formatRelativeTime } from '../../utils/realtimeUtils';
import Alert from '../common/Alert';

const COMPLAINT_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Maintenance',
  'Cleaning',
  'Security',
  'Parking',
  'Noise',
  'Other'
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'blue' },
  { value: 'medium', label: 'Medium', color: 'yellow' },
  { value: 'high', label: 'High', color: 'orange' },
  { value: 'emergency', label: 'Emergency', color: 'red' }
];

export default function Complaints() {
  const { currentUser, user, userProfile } = useAuth();
  const activeUser = currentUser || user; // Use whichever is available
  
  const [complaints, setComplaints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'medium',
    description: '',
    location: ''
  });

  // Subscribe to real-time complaints
  useEffect(() => {
    if (!activeUser?.uid) {
      console.log('Waiting for user authentication...');
      return;
    }

    console.log('Subscribing to complaints for user:', activeUser.uid);
    const unsubscribe = subscribeToUserComplaints(activeUser.uid, (data) => {
      console.log('Complaints data received:', data.length);
      setComplaints(data);
    });

    return () => unsubscribe();
  }, [activeUser?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!activeUser?.uid) {
      setAlert({ type: 'error', message: 'Please login to submit complaints' });
      console.error('No active user found');
      return;
    }

    setSubmitting(true);

    try {
      const complaintData = {
        ...formData,
        userId: activeUser.uid,
        userName: userProfile?.name || activeUser.email,
        userEmail: activeUser.email,
        flatNumber: userProfile?.flatNumber || 'N/A',
        userPhone: userProfile?.phone || 'N/A'
      };

      console.log('Submitting complaint:', complaintData);
      await createComplaint(complaintData);

      setAlert({
        type: 'success',
        message: 'Complaint submitted successfully! We will address it soon.'
      });

      setShowModal(false);
      setFormData({
        title: '',
        category: '',
        priority: 'medium',
        description: '',
        location: ''
      });
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setAlert({
        type: 'error',
        message: error.message || 'Failed to submit complaint. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmResolution = async (complaintId, isFixed) => {
    if (!activeUser?.uid) {
      setAlert({ type: 'error', message: 'Please login to update complaint status' });
      return;
    }

    try {
      if (isFixed) {
        await tenantUpdateComplaintStatus(
          complaintId,
          'closed',
          'Issue resolved satisfactorily. Thank you!'
        );
        setAlert({
          type: 'success',
          message: 'Thank you for confirming! Complaint closed.'
        });
      } else {
        await tenantUpdateComplaintStatus(
          complaintId,
          'open',
          'Issue still persists. Needs further attention.'
        );
        setAlert({
          type: 'info',
          message: 'We\'ll look into this again. Thank you for the feedback.'
        });
      }
    } catch (error) {
      console.error('Error updating complaint status:', error);
      setAlert({
        type: 'error',
        message: 'Failed to update status. Please try again.'
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'closed':
        return <CheckCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Show loading state if user is not yet loaded
  if (!activeUser?.uid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading complaints...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">My Complaints</h1>
            <p className="text-gray-600">Track and manage your maintenance requests</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Complaint
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-gray-400" />
            </div>
          </div>
          <div className="bg-red-50 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-700 text-sm font-medium mb-1">Open</p>
                <p className="text-3xl font-bold text-red-900">
                  {complaints.filter(c => c.status === 'open').length}
                </p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-700 text-sm font-medium mb-1">In Progress</p>
                <p className="text-3xl font-bold text-yellow-900">
                  {complaints.filter(c => c.status === 'in-progress').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
          </div>
          <div className="bg-green-50 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-medium mb-1">Resolved</p>
                <p className="text-3xl font-bold text-green-900">
                  {complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </div>
        </div>

        {/* Complaints List */}
        {complaints.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Complaints Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted any complaints. Click the button above to create one.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create First Complaint
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {complaints.map(complaint => (
              <div key={complaint.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(complaint.status)}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {complaint.title}
                      </h3>
                      <p className="text-sm text-gray-600">{complaint.category}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                    {complaint.priority}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                  {complaint.description}
                </p>

                {/* Details */}
                <div className="space-y-2 mb-4 text-sm">
                  {complaint.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">Location:</span>
                      <span>{complaint.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">Submitted:</span>
                    <span>{formatRelativeTime(complaint.createdAt)}</span>
                  </div>
                  {complaint.estimatedTime && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="font-medium">Estimated Time:</span>
                      <span>{complaint.estimatedTime}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className={`border-2 rounded-lg p-3 mb-4 ${getStatusColor(complaint.status)}`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(complaint.status)}
                    <span className="font-medium capitalize">{complaint.status.replace('-', ' ')}</span>
                  </div>
                </div>

                {/* Admin Response */}
                {complaint.adminResponse && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Admin Response:</p>
                        <p className="text-sm text-blue-800">{complaint.adminResponse}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tenant Feedback Section - Show only for resolved complaints */}
                {complaint.status === 'resolved' && (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Admin marked this as resolved. Is the issue fixed?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleConfirmResolution(complaint.id, true)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Yes, Fixed!
                      </button>
                      <button
                        onClick={() => handleConfirmResolution(complaint.id, false)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Not Fixed
                      </button>
                    </div>
                  </div>
                )}

                {/* Tenant Feedback Display */}
                {complaint.tenantFeedback && (
                  <div className="bg-gray-50 border-l-4 border-gray-400 p-4 rounded">
                    <p className="text-sm font-medium text-gray-900 mb-1">Your Feedback:</p>
                    <p className="text-sm text-gray-700">{complaint.tenantFeedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Complaint Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Submit New Complaint</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    title: '',
                    category: '',
                    priority: 'medium',
                    description: '',
                    location: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complaint Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Brief title of your complaint"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {COMPLAINT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {PRIORITY_LEVELS.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Bedroom, Kitchen, Common Area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe the issue in detail..."
                />
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Please provide as much detail as possible to help us resolve your issue quickly.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      title: '',
                      category: '',
                      priority: 'medium',
                      description: '',
                      location: ''
                    });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}