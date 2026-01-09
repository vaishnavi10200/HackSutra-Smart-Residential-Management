// src/components/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp,
  LogOut,
  Menu,
  X,
  Home,
  DollarSign,
  Activity
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

function AdminDashboard() {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBills: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    monthlyRevenue: 0,
    pendingPayments: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Real-time stats subscription
  useEffect(() => {
    if (!userProfile?.uid) return;

    const unsubscribers = [];

    // Subscribe to users count
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStats(prev => ({ ...prev, totalUsers: snapshot.size }));
    });
    unsubscribers.push(usersUnsub);

    // Subscribe to bills with revenue calculation
    const billsUnsub = onSnapshot(collection(db, 'bills'), (snapshot) => {
      let revenue = 0;
      let pending = 0;
      
      snapshot.docs.forEach(doc => {
        const bill = doc.data();
        if (bill.status === 'paid') {
          revenue += bill.total || 0;
        } else {
          pending += bill.total || 0;
        }
      });

      setStats(prev => ({
        ...prev,
        totalBills: snapshot.size,
        monthlyRevenue: revenue,
        pendingPayments: pending
      }));
    });
    unsubscribers.push(billsUnsub);

    // Subscribe to complaints
    const complaintsUnsub = onSnapshot(collection(db, 'complaints'), (snapshot) => {
      const resolved = snapshot.docs.filter(
        doc => doc.data().status === 'resolved'
      ).length;

      setStats(prev => ({
        ...prev,
        totalComplaints: snapshot.size,
        resolvedComplaints: resolved
      }));
      
      // Update recent activity from complaints
      const recent = snapshot.docs
        .map(doc => ({
          id: doc.id,
          type: 'complaint',
          ...doc.data()
        }))
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        })
        .slice(0, 5);
      
      setRecentActivity(recent);
    });
    unsubscribers.push(complaintsUnsub);

    setLoading(false);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/50" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl p-6">
          <button 
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <AdminSidebar userProfile={userProfile} onLogout={handleLogout} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto px-4">
            <AdminSidebar userProfile={userProfile} onLogout={handleLogout} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-4"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Sunshine Apartments Management
                </p>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="bg-primary-50 px-4 py-2 rounded-lg">
                <p className="text-xs text-primary-600 font-medium">Society ID</p>
                <p className="text-sm font-bold text-primary-700">SUN-2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          {/* Stats Grid - Real-time */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Residents"
              value={stats.totalUsers}
              icon={Users}
              color="blue"
              trend="+12%"
              trendUp={true}
            />
            <StatsCard
              title="Bills Generated"
              value={stats.totalBills}
              icon={FileText}
              color="green"
              trend="+8%"
              trendUp={true}
            />
            <StatsCard
              title="Active Complaints"
              value={stats.totalComplaints - stats.resolvedComplaints}
              icon={AlertCircle}
              color="orange"
              subtitle={`${stats.resolvedComplaints} resolved`}
            />
            <StatsCard
              title="Resolution Rate"
              value={`${stats.totalComplaints > 0 ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100) : 0}%`}
              icon={CheckCircle}
              color="purple"
              trend="+5%"
              trendUp={true}
            />
          </div>

          {/* Revenue Cards - Real-time */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-green-100 text-sm mb-2">Monthly Revenue</p>
                  <p className="text-4xl font-bold">
                    ₹{(stats.monthlyRevenue / 100000).toFixed(1)}L
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
              <div className="flex items-center text-green-100">
                <TrendingUp className="w-4 h-4 mr-2" />
                <span className="text-sm">Live updates</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-orange-100 text-sm mb-2">Pending Payments</p>
                  <p className="text-4xl font-bold">
                    ₹{(stats.pendingPayments / 100000).toFixed(1)}L
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl">
                  <Activity className="w-8 h-8" />
                </div>
              </div>
              <p className="text-orange-100 text-sm">
                {stats.monthlyRevenue + stats.pendingPayments > 0 
                  ? Math.round((stats.pendingPayments / (stats.monthlyRevenue + stats.pendingPayments)) * 100) 
                  : 0}% of total
              </p>
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity - Real-time */}
            <div className="lg:col-span-2 card">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Live</span>
                </div>
              </div>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      icon={AlertCircle}
                      color="orange"
                      title={`New complaint: ${activity.title}`}
                      description={`${activity.userName} - ${activity.category}`}
                      time={formatTime(activity.createdAt)}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              
              <button className="card w-full text-left hover:shadow-hover group">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-100 p-3 rounded-xl group-hover:bg-primary-200 transition-colors">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Generate Bills</p>
                    <p className="text-sm text-gray-600">Create monthly bills</p>
                  </div>
                </div>
              </button>

              <button className="card w-full text-left hover:shadow-hover group">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-100 p-3 rounded-xl group-hover:bg-orange-200 transition-colors">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">View Complaints</p>
                    <p className="text-sm text-gray-600">Manage issues</p>
                  </div>
                </div>
              </button>

              <button className="card w-full text-left hover:shadow-hover group">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-200 transition-colors">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Manage Residents</p>
                    <p className="text-sm text-gray-600">Add or remove</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(timestamp) {
  if (!timestamp) return 'Just now';
  
  const date = timestamp.seconds 
    ? new Date(timestamp.seconds * 1000)
    : new Date(timestamp);
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

function AdminSidebar({ userProfile, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-100 p-2 rounded-xl">
            <Home className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">SocietyHub</h1>
            <p className="text-xs text-gray-600">Admin Portal</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <nav className="space-y-2">
          <button className="w-full text-left px-4 py-3 bg-primary-50 text-primary-600 rounded-lg font-medium">
            Dashboard
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
            Residents
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
            Bills & Revenue
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
            Complaints
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg">
            Reports
          </button>
        </nav>
      </div>

      <div className="mt-auto border-t border-gray-200 pt-4">
        <div className="flex items-center space-x-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold">
            {userProfile.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userProfile.name}
            </p>
            <p className="text-xs text-gray-600 truncate">Administrator</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, subtitle, trend, trendUp }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="card group hover:shadow-hover">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}
    </div>
  );
}

function ActivityItem({ icon: Icon, color, title, description, time }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-lg ${colorClasses[color]} flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600 truncate">{description}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

export default AdminDashboard;