// src/components/tenant/TenantDashboard.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Home, Receipt, AlertCircle, Car, Trash2, LogOut
} from 'lucide-react';
import { subscribeToBills } from '../../services/billingService';
import { subscribeToUserComplaints } from '../../services/complaintService';
import { getTenantProperty } from '../../services/landlordService';
import { formatCurrency, formatRelativeTime } from '../../utils/realtimeUtils';
import Complaints from './Complaints';
import ParkingManagement from './ParkingManagement';
import WasteManagement from './WasteManagement';

export default function TenantDashboard() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [property, setProperty] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribers = [];

    // Set a timeout to stop loading after 3 seconds regardless
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    // Subscribe to bills
    try {
      const unsubBills = subscribeToBills(user.uid, (data) => {
        setBills(data);
        setLoading(false);
      });
      unsubscribers.push(unsubBills);
    } catch (error) {
      console.error('Error subscribing to bills:', error);
      setLoading(false);
    }

    // Subscribe to complaints
    try {
      const unsubComplaints = subscribeToUserComplaints(user.uid, (data) => {
        setComplaints(data);
        setLoading(false);
      });
      unsubscribers.push(unsubComplaints);
    } catch (error) {
      console.error('Error subscribing to complaints:', error);
      setLoading(false);
    }

    // Load property info
    getTenantProperty(user.uid)
      .then(prop => {
        setProperty(prop);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading property:', error);
        setLoading(false);
      });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribers.forEach(unsub => unsub());
    };
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Overview', color: 'blue' },
    { id: 'bills', icon: Receipt, label: 'My Bills', color: 'green' },
    { id: 'complaints', icon: AlertCircle, label: 'Complaints', color: 'orange' },
    { id: 'parking', icon: Car, label: 'Parking', color: 'purple' },
    { id: 'waste', icon: Trash2, label: 'Waste Management', color: 'emerald' },
  ];

  // Don't show loading spinner for too long
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Tenant Portal</h2>
                <p className="text-xs text-gray-600">{userProfile?.name || user?.email}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? `bg-gradient-to-r from-${item.color}-500 to-${item.color}-600 text-white shadow-md`
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeSection === 'overview' && (
            <div>
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                  Welcome back, {userProfile?.name || 'Tenant'}! 👋
                </h1>
                <p className="text-gray-600">Here's your dashboard overview</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  icon={Receipt}
                  title="Total Bills"
                  value={bills.length}
                  subtitle={`${bills.filter(b => b.status === 'pending').length} pending`}
                  color="blue"
                />
                <StatCard
                  icon={AlertCircle}
                  title="Complaints"
                  value={complaints.length}
                  subtitle={`${complaints.filter(c => c.status === 'open').length} open`}
                  color="orange"
                />
                <StatCard
                  icon={Home}
                  title="Property"
                  value={property?.flatNumber || 'N/A'}
                  subtitle={property?.address || 'No property assigned'}
                  color="green"
                />
                <StatCard
                  icon={Receipt}
                  title="Total Paid"
                  value={formatCurrency(bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.total || 0), 0))}
                  subtitle={`${bills.filter(b => b.status === 'paid').length} bills paid`}
                  color="purple"
                />
              </div>

              {/* Recent Bills */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Bills</h2>
                {bills.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No bills yet</p>
                ) : (
                  <div className="space-y-3">
                    {bills.slice(0, 5).map(bill => (
                      <div key={bill.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-800">{bill.month}</p>
                          <p className="text-sm text-gray-600">{formatRelativeTime(bill.generatedAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(bill.total)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            bill.status === 'paid' ? 'bg-green-100 text-green-700' :
                            bill.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {bill.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Complaints */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Complaints</h2>
                {complaints.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No complaints yet</p>
                ) : (
                  <div className="space-y-3">
                    {complaints.slice(0, 5).map(complaint => (
                      <div key={complaint.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-800">{complaint.title}</p>
                          <p className="text-sm text-gray-600">{complaint.category}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          complaint.status === 'open' ? 'bg-red-100 text-red-700' :
                          complaint.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {complaint.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          
{activeSection === 'bills' && (
  <div>
    <h1 className="text-3xl font-bold text-gray-800 mb-6">My Bills</h1>
    {bills.length === 0 ? (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">No bills yet</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bills.map(bill => (
          <div key={bill.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{bill.month}</h3>
                <p className="text-sm text-gray-600">{formatRelativeTime(bill.generatedAt)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                bill.status === 'paid' ? 'bg-green-100 text-green-700' :
                bill.status === 'overdue' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {bill.status}
              </span>
            </div>
            
            <div className="border-t pt-4 space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rent:</span>
                <span className="text-gray-800">{formatCurrency(bill.rent || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Maintenance:</span>
                <span className="text-gray-800">{formatCurrency(bill.maintenance || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Water Charges:</span>
                <span className="text-gray-800">{formatCurrency(bill.waterCharges || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Electricity Charges:</span>
                <span className="text-gray-800">{formatCurrency(bill.electricityCharges || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Total Amount:</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(bill.total)}</span>
              </div>
              {bill.dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Due Date:</span>
                  <span className={`font-medium ${
                    new Date(bill.dueDate) < new Date() && bill.status === 'pending' 
                      ? 'text-red-600' 
                      : 'text-gray-700'
                  }`}>
                    {new Date(bill.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Pay Now Button for Pending Bills */}
            {bill.status === 'pending' && (
              <button
                onClick={() => handlePayNow(bill)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Pay Now - {formatCurrency(bill.total)}
              </button>
            )}

            {/* Payment Success Message */}
            {bill.status === 'paid' && bill.paidAt && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="text-sm">
                  <p className="font-medium text-green-900">Paid on {new Date(bill.paidAt).toLocaleDateString()}</p>
                  {bill.paymentMethod && (
                    <p className="text-green-700">via {bill.paymentMethod}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}

          {activeSection === 'complaints' && <Complaints />}
          {activeSection === 'parking' && <ParkingManagement />}
          {activeSection === 'waste' && <WasteManagement />}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} text-white`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}