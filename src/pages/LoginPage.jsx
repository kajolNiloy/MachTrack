import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, typography, borderRadius } from '../constants/designTokens';

// Inject fonts
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
  .login-input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    font-size: 0.95rem;
    border-radius: 8px;
    border: 1.5px solid rgba(255,255,255,0.35);
    background: rgba(255,255,255,0.18);
    color: #1f2937;
    outline: none;
    transition: border-color 150ms ease, box-shadow 150ms ease;
    font-family: system-ui, sans-serif;
  }
  .login-input::placeholder {
    color: rgba(30,40,60,0.45);
  }
  .login-input:focus {
    border-color: rgba(255,255,255,0.7);
    box-shadow: 0 0 0 3px rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.25);
  }
  .login-btn {
    width: 100%;
    padding: 13px;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    border: none;
    border-radius: 8px;
    background: #1f2937;
    color: #fff;
    cursor: pointer;
    transition: background 150ms ease, transform 100ms ease;
    font-family: system-ui, sans-serif;
  }
  .login-btn:hover:not(:disabled) {
    background: #111827;
    transform: translateY(-1px);
  }
  .login-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
if (!document.head.querySelector('[data-machtrack-login]')) {
  style.setAttribute('data-machtrack-login', '1');
  document.head.appendChild(style);
}

function LoginPage() {
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!usernameInput.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const { error: loginError } = await login(usernameInput, password);
    setIsLoading(false);

    if (loginError) {
      setError('Incorrect username or password. Please try again.');
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
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      {[
        { top: '-80px', left: '50%', transform: 'translateX(-50%)', width: '280px', height: '280px' },
        { left: '-100px', top: '50%', transform: 'translateY(-50%)', width: '300px', height: '300px' },
        { right: '-100px', top: '50%', transform: 'translateY(-50%)', width: '300px', height: '300px' },
        { bottom: '-80px', left: '20%', width: '280px', height: '280px' },
        { bottom: '-80px', right: '20%', width: '280px', height: '280px' },
      ].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100,200,255,0.35) 0%, rgba(100,200,255,0) 70%)',
          filter: 'blur(50px)', zIndex: 0, ...pos,
        }} />
      ))}

      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: '420px',
        margin: spacing.lg,
        padding: spacing.xl,
        backgroundColor: 'rgba(255,255,255,0.25)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
        border: '1px solid rgba(255,255,255,0.4)',
        borderRadius: '20px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: spacing.xl }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px',
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: '14px', fontSize: '1.8rem',
            marginBottom: spacing.md,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>🏭</div>
          <h1 className="machtrack-title" style={{ margin: 0, color: '#1f2937' }}>
            MachTrack
          </h1>
          <p style={{
            margin: `${spacing.sm} 0 0 0`,
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: '0.02em',
          }}>
            Factory Parts Inventory Management
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          <div>
            <label style={{
              display: 'block', marginBottom: '6px',
              fontSize: '0.8rem', fontWeight: '600',
              color: 'rgba(30,40,60,0.75)',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              Username
            </label>
            <input
              className="login-input"
              type="text"
              placeholder="Enter your username"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
            />
          </div>

          <div>
            <label style={{
              display: 'block', marginBottom: '6px',
              fontSize: '0.8rem', fontWeight: '600',
              color: 'rgba(30,40,60,0.75)',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              Password
            </label>
            <input
              className="login-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            className="login-btn"
            type="submit"
            disabled={isLoading}
            style={{ marginTop: spacing.sm }}
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div style={{
            marginTop: spacing.md,
            padding: spacing.md,
            backgroundColor: 'rgba(220,38,38,0.12)',
            border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: borderRadius.md,
            color: '#991b1b',
            fontSize: '0.85rem',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <p style={{
          marginTop: spacing.lg, marginBottom: 0,
          textAlign: 'center', fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.6)',
        }}>
          Contact your administrator if you forgot your password.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;