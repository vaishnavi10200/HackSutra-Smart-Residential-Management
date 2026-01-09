// src/components/landlord/LandlordDashboard.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  Home, DollarSign, Users, LogOut, Building, Plus, Receipt
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import PropertyManagement from './PropertyManagement';
import BillGeneration from './BillGeneration';

function LandlordDashboard() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [revenue, setRevenue] = useState({
    totalMonthly: 0,
    occupancyRate: 0,
    totalProperties: 0,
    occupiedProperties: 0
  });
  const [billingStats, setBillingStats] = useState({
    collected: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time subscriptions
  useEffect(() => {
    if (!userProfile?.uid) return;

    const unsubscribers = [];

    // Subscribe to properties
    const propertiesQuery = query(
      collection(db, 'properties'),
      where('landlordId', '==', userProfile.uid)
    );
    
    const propertiesUnsub = onSnapshot(propertiesQuery, (snapshot) => {
      const propertiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setProperties(propertiesData);
      
      // Calculate revenue in real-time
      let totalMonthly = 0;
      let occupied = 0;
      
      propertiesData.forEach(property => {
        if (property.status === 'occupied') {
          occupied++;
          totalMonthly += property.monthlyRent || 0;
          totalMonthly += property.maintenanceCharges || 0;
          totalMonthly += (property.parkingSlots || 0) * 500;
        }
      });
      
      const occupancyRate = propertiesData.length > 0
        ? Math.round((occupied / propertiesData.length) * 100)
        : 0;
      
      setRevenue({
        totalMonthly,
        occupancyRate,
        totalProperties: propertiesData.length,
        occupiedProperties: occupied
      });
      
      setLoading(false);
    });
    unsubscribers.push(propertiesUnsub);

    // Subscribe to bills
    const billsQuery = query(
      collection(db, 'bills'),
      where('landlordId', '==', userProfile.uid)
    );
    
    const billsUnsub = onSnapshot(billsQuery, (snapshot) => {
      let collected = 0;
      let pending = 0;
      
      snapshot.docs.forEach(doc => {
        const bill = doc.data();
        if (bill.status === 'paid') {
          collected += bill.total || 0;
        } else {
          pending += bill.total || 0;
        }
      });
      
      setBillingStats({ collected, pending });
    });
    unsubscribers.push(billsUnsub);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [userProfile]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  const currentPath = location.pathname.split('/')[2] || 'dashboard';

  const menuItems = [
    { path: '', label: 'Dashboard', icon: Home },
    { path: 'properties', label: 'Properties', icon: Building },
    { path: 'generate-bill', label: 'Generate Bills', icon: Receipt }
  ];

  if (loading && currentPath === 'dashboard') {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="w-8 h-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">Landlord Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                <p className="text-xs text-gray-500">{userProfile.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4 space-y-2">
            {menuItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(`/landlord/${item.path}`)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPath === (item.path || 'dashboard')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">
                    Welcome back, {userProfile.name}
                  </h2>
                  <p className="text-gray-600 mt-2 flex items-center">
                    Manage your rental properties and track payments
                    <span className="ml-2 flex items-center text-green-600 text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
                      Live updates
                    </span>
                  </p>
                </div>

                {/* Stats Grid - Real-time */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Properties</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {properties.length}
                        </p>
                      </div>
                      <Home className="w-12 h-12 text-blue-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          ₹{revenue.totalMonthly.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Collected</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          ₹{billingStats.collected.toLocaleString()}
                        </p>
                      </div>
                      <Receipt className="w-12 h-12 text-yellow-500 opacity-20" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          ₹{billingStats.pending.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-12 h-12 text-red-500 opacity-20" />
                    </div>
                  </div>
                </div>

                {/* Occupancy Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Rate</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-green-500 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${revenue.occupancyRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {revenue.occupancyRate}%
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between text-sm text-gray-600">
                    <span>{revenue.occupiedProperties} Occupied</span>
                    <span>{revenue.totalProperties - revenue.occupiedProperties} Vacant</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => navigate('/landlord/properties')}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Plus className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Add New Property</h3>
                        <p className="text-sm text-gray-500">Register a new rental property</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/landlord/generate-bill')}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition text-left"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-3 rounded-lg">
                        <Receipt className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Generate Bills</h3>
                        <p className="text-sm text-gray-500">Create bills using AI</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            } />
            <Route path="/properties" element={<PropertyManagement />} />
            <Route path="/generate-bill" element={<BillGeneration />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default LandlordDashboard;