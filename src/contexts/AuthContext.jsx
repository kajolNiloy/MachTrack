import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      if (data.user) {
        fetchProfile(data.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setRole(null);
        setUsername(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, username, full_name')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      setRole(null);
      setUsername(null);
    } else {
      setRole(data.role);
      setUsername(data.username || data.full_name || null);
    }
    setLoading(false);
  };

  const loginWithUsername = async (username, password) => {
    // First try username@machtrack.internal format (for worker accounts)
    const internalEmail = `${username.toLowerCase().trim()}@machtrack.internal`;
    const { data: data1, error: error1 } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password,
    });

    if (!error1) return { data: data1, error: null };

    // If that fails, try the username as a real email (for admin accounts)
    const { data: data2, error: error2 } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    return { data: data2, error: error2 };
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, role, username, loading, login, loginWithUsername, logout }}>
      {children}
    </AuthContext.Provider>
  );
};