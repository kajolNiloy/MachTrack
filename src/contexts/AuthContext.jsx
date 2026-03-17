import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const FAKE_DOMAIN = '@machtrack.local';

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(undefined); // undefined = not checked yet
  const [role, setRole]               = useState(null);
  const [username, setUsername]       = useState(null);
  const [displayName, setDisplayName] = useState(null);

  // loading = true while user is still undefined
  const loading = user === undefined;

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;

      if (!session?.user) {
        setUser(null);
        return;
      }

      setUser(session.user);

      // Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('role, username, full_name')
        .eq('id', session.user.id)
        .single();

      if (cancelled) return;

      if (!error && data) {
        setRole(data.role);
        setUsername(data.username || null);
        setDisplayName(data.full_name || data.username || null);
      } else {
        setUser(null);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const login = async (usernameInput, password) => {
    const email = `${usernameInput.toLowerCase().trim()}${FAKE_DOMAIN}`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error };

    // Fetch profile after login
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, username, full_name')
      .eq('id', data.user.id)
      .single();

    setUser(data.user);
    setRole(profile?.role || null);
    setUsername(profile?.username || null);
    setDisplayName(profile?.full_name || profile?.username || null);

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setUsername(null);
    setDisplayName(null);
  };

  const createUser = async ({ usernameInput, password, role: userRole, displayName: userDisplayName }) => {
    const { data, error } = await supabase.rpc('admin_create_user', {
      username: usernameInput.toLowerCase().trim(),
      password,
      full_name: userDisplayName || usernameInput,
      user_role: userRole || 'viewer',
    });
    return { data, error };
  };

  const adminResetPassword = async (targetUserId, newPassword) => {
    const { data, error } = await supabase.rpc('admin_reset_user_password', {
      target_user_id: targetUserId,
      new_password: newPassword,
    });
    return { data, error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      username,
      displayName,
      loading,
      login,
      logout,
      createUser,
      adminResetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};