import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  // Still initializing
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: '12px',
        fontFamily: 'system-ui, sans-serif', color: '#6b7280',
      }}>
        <div style={{
          width: '32px', height: '32px', border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading...</p>
      </div>
    );
  }

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but role not loaded yet — wait a bit more
  if (!role) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: '12px',
        fontFamily: 'system-ui, sans-serif', color: '#6b7280',
      }}>
        <div style={{
          width: '32px', height: '32px', border: '3px solid #e5e7eb',
          borderTop: '3px solid #3b82f6', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Loading profile...</p>
      </div>
    );
  }

  // Logged in but wrong role
  if (!allowedRoles.includes(role)) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          Your role: <strong>{role}</strong>
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;