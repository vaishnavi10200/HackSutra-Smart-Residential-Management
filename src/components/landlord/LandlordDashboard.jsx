// src/components/landlord/LandlordDashboard.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Home, Building, Receipt, TrendingUp, Users, LogOut,
  Car, Trash2, AlertCircle
} from 'lucide-react';
import { getLandlordProperties, getLandlordStats } from '../../services/landlordService';
import { formatCurrency } from '../../utils/realtimeUtils';
import PropertyManagement from './PropertyManagement';
import BillGeneration from './BillGeneration';
import ParkingManagement from '../tenant/ParkingManagement';
import WasteManagement from '../tenant/WasteManagement';
import Complaints from '../tenant/Complaints';

export default function LandlordDashboard() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Set timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    loadDashboardData();

    return () => clearTimeout(loadingTimeout);
  }, [user?.uid]);

  async function loadDashboardData() {
    if (!user?.uid) return;

    try {
      const [statsData, propertiesData] = await Promise.all([
        getLandlordStats(user.uid),
        getLandlordProperties(user.uid)
      ]);

      setStats(statsData);
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

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
    { id: 'properties', icon: Building, label: 'Properties', color: 'green' },
    { id: 'billing', icon: Receipt, label: 'Bill Generation', color: 'purple' },
    { id: 'parking', icon: Car, label: 'Parking', color: 'indigo' },
    { id: 'waste', icon: Trash2, label: 'Waste Management', color: 'emerald' },
    { id: 'complaints', icon: AlertCircle, label: 'Complaints', color: 'orange' },
  ];

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Landlord Portal</h2>
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
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
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
                  Welcome back, {userProfile?.name || 'Landlord'}! 👋
                </h1>
                <p className="text-gray-600">Here's what's happening with your properties</p>
              </div>

              {/* Stats Grid */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    icon={Building}
                    title="Total Properties"
                    value={stats.totalProperties}
                    subtitle={`${stats.occupiedProperties} occupied`}
                    color="blue"
                  />
                  <StatCard
                    icon={Users}
                    title="Active Tenants"
                    value={stats.activeTenants}
                    subtitle={`${stats.vacantProperties} vacant`}
                    color="green"
                  />
                  <StatCard
                    icon={Receipt}
                    title="Monthly Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    subtitle={`${stats.collectionRate}% collected`}
                    color="purple"
                  />
                  <StatCard
                    icon={TrendingUp}
                    title="Pending Bills"
                    value={stats.pendingBills}
                    subtitle={formatCurrency(stats.pendingAmount)}
                    color="orange"
                  />
                </div>
              )}

              {/* Properties Overview */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Properties</h2>
                {properties.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">No properties added yet</p>
                    <button
                      onClick={() => setActiveSection('properties')}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
                    >
                      Add Your First Property
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map(property => (
                      <div key={property.id} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">{property.flatNumber}</h3>
                            <p className="text-sm text-gray-600">{property.address}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            property.tenantId 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {property.tenantId ? 'Occupied' : 'Vacant'}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rent:</span>
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(property.monthlyRent)}
                            </span>
                          </div>
                          {property.tenant && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tenant:</span>
                              <span className="font-semibold text-gray-900">{property.tenant}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'properties' && <PropertyManagement />}
          {activeSection === 'billing' && <BillGeneration />}
          {activeSection === 'parking' && <ParkingManagement />}
          {activeSection === 'waste' && <WasteManagement />}
          {activeSection === 'complaints' && <Complaints />}
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
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
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