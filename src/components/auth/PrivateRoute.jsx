// src/components/auth/PrivateRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

function PrivateRoute({ children, allowedRoles }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (!userProfile) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to={`/${userProfile.role}`} />;
  }

  return children;
}

export default PrivateRoute;