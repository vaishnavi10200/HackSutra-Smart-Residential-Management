// src/components/tenant/Complaints.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  AlertCircle, 
  Plus, 
  Clock, 
  CheckCircle,
  XCircle,
  MessageSquare,
  Camera,
  Loader
} from 'lucide-react';
import { 
  createComplaint, 
  subscribeToUserComplaints
} from '../../services/complaintService';
import { COMPLAINT_CATEGORIES, PRIORITY_COLORS, STATUS_COLORS } from '../../utils/constants';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';

function Complaints() {
  const { userProfile } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    location: ''
  });
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  // Real-time subscription to user complaints
  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }

    console.log('Setting up real-time complaints subscription for user:', userProfile.uid);

    const unsubscribe = subscribeToUserComplaints(userProfile.uid, (complaintsData) => {
      console.log('Received real-time complaints update:', complaintsData.length, 'complaints');
      setComplaints(complaintsData);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up complaints subscription');
      unsubscribe();
    };
  }, [userProfile]);

  function showAlert(type, message) {
    setAlert({ show: true, type, message });
    setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.category || !formData.title || !formData.description) {
      showAlert('error', 'Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await createComplaint({
        ...formData,
        userId: userProfile.uid,
        userName: userProfile.name,
        flatNumber: userProfile.flatNumber
      });
      
      showAlert('success', 'Complaint submitted successfully! 🎉 Our AI has categorized and prioritized your complaint.');
      setShowForm(false);
      setFormData({ category: '', title: '', description: '', location: '' });
    } catch (error) {
      showAlert('error', error.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading complaints..." />;
  }

  const activeComplaints = complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed');
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved' || c.status === 'closed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complaints & Requests</h1>
          <p className="text-gray-600 flex items-center">
            Report issues and track their resolution
            <span className="ml-2 flex items-center text-green-600 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
              Live updates
            </span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Complaint</span>
        </button>
      </div>

      {alert.show && (
        <Alert 
          type={alert.type} 
          message={alert.message} 
          onClose={() => setAlert({ show: false, type: '', message: '' })} 
        />
      )}

      {/* Stats - Real-time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Complaints</p>
              <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active</p>
              <p className="text-3xl font-bold text-orange-600">{activeComplaints.length}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{resolvedComplaints.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Form */}
      {showForm && (
        <div className="card animate-scale-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Raise a New Complaint</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="input-field"
                required
              >
                <option value="">Select a category</option>
                {COMPLAINT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="input-field"
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="input-field"
                rows="4"
                placeholder="Provide detailed information about the issue..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location (Optional)
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="input-field"
                placeholder="e.g., Near lift on 3rd floor"
              />
            </div>

            {/* AI Info Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900">AI-Powered Processing</p>
                  <p className="text-xs text-purple-700 mt-1">
                    Our AI will automatically categorize your complaint, assign priority, and estimate resolution time.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary flex-1"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Complaint'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Complaints */}
      {activeComplaints.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Complaints</h2>
          <div className="space-y-3">
            {activeComplaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} userProfile={userProfile} />
            ))}
          </div>
        </div>
      )}

      {/* Resolved Complaints */}
      {resolvedComplaints.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resolved Complaints</h2>
          <div className="space-y-3">
            {resolvedComplaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} userProfile={userProfile} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {complaints.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Complaints Yet</h3>
          <p className="text-gray-600 mb-4">
            You haven't raised any complaints. Click the button above to get started.
          </p>
        </div>
      )}
    </div>
  );
}

function ComplaintCard({ complaint, userProfile }) {
  const category = COMPLAINT_CATEGORIES.find(c => c.value === complaint.category);
  const statusColor = STATUS_COLORS[complaint.status] || 'bg-gray-100 text-gray-800';
  const priorityColor = PRIORITY_COLORS[complaint.priority] || 'bg-gray-100 text-gray-800';

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    
    // Handle Firestore Timestamp
    if (dateValue.seconds) {
      return new Date(dateValue.seconds * 1000).toLocaleDateString('en-IN');
    }
    
    // Handle ISO string or Date object
    return new Date(dateValue).toLocaleDateString('en-IN');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'open':
      default:
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
    }
  };

  return (
    <div className="card hover:shadow-hover cursor-pointer transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg ${
            complaint.status === 'resolved' || complaint.status === 'closed' 
              ? 'bg-green-100' 
              : complaint.status === 'in-progress'
              ? 'bg-blue-100'
              : 'bg-orange-100'
          }`}>
            {getStatusIcon(complaint.status)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">
              {category?.icon} {complaint.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{complaint.description}</p>
            {complaint.location && (
              <p className="text-xs text-gray-500 mt-1">📍 {complaint.location}</p>
            )}
            {complaint.estimatedTime && (
              <p className="text-xs text-blue-600 mt-1">⏱️ Estimated: {complaint.estimatedTime}</p>
            )}
            {complaint.suggestedAction && (
              <p className="text-xs text-purple-600 mt-1 italic">💡 {complaint.suggestedAction}</p>
            )}
            {complaint.assignTo && (
              <p className="text-xs text-gray-500 mt-1">👷 Assigned to: {complaint.assignTo}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <span className={`badge ${statusColor}`}>
            {complaint.status}
          </span>
          <span className={`badge ${priorityColor}`}>
            {complaint.priority}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(complaint.createdAt)}
        </div>
      </div>

      {complaint.adminResponse && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg animate-scale-in">
          <div className="flex items-start space-x-2">
            <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-900 mb-1">Admin Response</p>
              <p className="text-sm text-blue-800">{complaint.adminResponse}</p>
              {complaint.updatedAt && (
                <p className="text-xs text-blue-600 mt-1">
                  Updated: {formatDate(complaint.updatedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator for In-Progress Complaints */}
      {complaint.status === 'in-progress' && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Loader className="w-4 h-4 text-blue-600 animate-spin" />
            <p className="text-sm font-medium text-blue-900">Work in Progress</p>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Complaints;