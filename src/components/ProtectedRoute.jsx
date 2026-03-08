import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) return <div style={{ padding: '40px', fontFamily: 'Arial' }}>Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (!allowedRoles.includes(role)) return <div style={{ padding: '40px', fontFamily: 'Arial', textAlign: 'center' }}><h2>Access Denied</h2><p>You do not have permission to access this page.</p></div>;

  return children;
};

export default ProtectedRoute;