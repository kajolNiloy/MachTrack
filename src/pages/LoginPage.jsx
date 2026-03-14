import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/designTokens';

// Import Tesla-inspired font
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
  .machtrack-title {
    font-family: 'Orbitron', sans-serif;
    font-weight: 900;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-size: 2.5rem;
  }
`;
document.head.appendChild(style);

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { error } = await login(email, password);
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#2d4a6f',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative gradient orb - top center */}
      <div style={{
        position: 'absolute',
        top: '-80px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '280px',
        height: '280px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(100, 200, 255, 0.4) 0%, rgba(100, 200, 255, 0) 70%)',
        filter: 'blur(50px)',
        zIndex: 0
      }}></div>

      {/* Decorative gradient orb - left middle */}
      <div style={{
        position: 'absolute',
        left: '-100px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(100, 200, 255, 0.35) 0%, rgba(100, 200, 255, 0) 70%)',
        filter: 'blur(50px)',
        zIndex: 0
      }}></div>

      {/* Decorative gradient orb - right middle */}
      <div style={{
        position: 'absolute',
        right: '-100px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(100, 200, 255, 0.35) 0%, rgba(100, 200, 255, 0) 70%)',
        filter: 'blur(50px)',
        zIndex: 0
      }}></div>

      {/* Decorative gradient orb - bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '-80px',
        left: '20%',
        width: '280px',
        height: '280px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(100, 200, 255, 0.3) 0%, rgba(100, 200, 255, 0) 70%)',
        filter: 'blur(50px)',
        zIndex: 0
      }}></div>

      {/* Decorative gradient orb - bottom right */}
      <div style={{
        position: 'absolute',
        bottom: '-80px',
        right: '20%',
        width: '280px',
        height: '280px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(100, 200, 255, 0.3) 0%, rgba(100, 200, 255, 0) 70%)',
        filter: 'blur(50px)',
        zIndex: 0
      }}></div>

      <div style={{ 
        position: 'relative',
        zIndex: 10,
        width: '100%', 
        maxWidth: '420px',
        padding: spacing.xl,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: '20px'
      }}>
        <h1 style={{ ...typography.pageTitle, margin: `0 0 ${spacing.lg} 0`, color: colors.darkText, textAlign: 'center' }} className="machtrack-title">MachTrack</h1>
        <p style={{ ...typography.body, color: colors.white, textAlign: 'center', margin: `0 0 ${spacing.xl} 0` }}>Factory Parts Inventory Management</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="primary" size="md" style={{ width: '100%' }}>Login</Button>
        </form>

        {error && (
          <div style={{
            marginTop: spacing.lg,
            padding: spacing.md,
            backgroundColor: '#fee2e2',
            border: `1px solid ${colors.danger}`,
            borderRadius: borderRadius.md,
            color: colors.danger,
            ...typography.small
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;