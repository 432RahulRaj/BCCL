import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, testConnection } from '../lib/supabase';
import toast from 'react-hot-toast';

export type UserRole = 'employee' | 'admin' | 'department';
export type ConnectionStatus = 'local' | 'online' | 'offline';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  employeeInfo?: {
    quarter: string;
    area: string;
    contactNumber: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  connectionStatus: ConnectionStatus;
  login: (email: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Demo users for development
const DEMO_USERS: Record<string, User> = {
  'admin@coalindia.in': {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@coalindia.in',
    role: 'admin',
  },
  'employee@coalindia.in': {
    id: 'employee-1',
    name: 'John Employee',
    email: 'employee@coalindia.in',
    role: 'employee',
    employeeInfo: {
      quarter: 'A-123',
      area: 'Sector 5',
      contactNumber: '9876543210',
    },
  },
  'water@coalindia.in': {
    id: 'dept-water',
    name: 'Water Department',
    email: 'water@coalindia.in',
    role: 'department',
    department: 'Water Department',
  },
  'electrical@coalindia.in': {
    id: 'dept-electrical',
    name: 'Electrical Department',
    email: 'electrical@coalindia.in',
    role: 'department',
    department: 'Electrical Department',
  },
  'plumbing@coalindia.in': {
    id: 'dept-plumbing',
    name: 'Plumbing Department',
    email: 'plumbing@coalindia.in',
    role: 'department',
    department: 'Plumbing Department',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('offline');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Test connection
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'online' : 'offline');
      
      // Load stored user
      const storedUser = localStorage.getItem('bccl_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Navigate to appropriate dashboard if user is logged in
          const routes = {
            employee: '/employee',
            admin: '/admin',
            department: '/department',
          };
          
          // Only navigate if we're on the login page or root
          if (window.location.pathname === '/' || window.location.pathname === '/login') {
            navigate(routes[parsedUser.role], { replace: true });
          }
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('bccl_user');
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string): Promise<boolean> => {
    if (!email.endsWith('@coalindia.in')) {
      toast.error('Please use a valid @coalindia.in email address');
      return false;
    }

    try {
      if (connectionStatus === 'offline') {
        // Offline mode - check demo users
        if (!DEMO_USERS[email]) {
          toast.error('User not found. Please use a demo account.');
          return false;
        }
        setPendingEmail(email);
        toast.success('OTP sent (Demo mode: use 123456)');
        return true;
      }

      // Online mode - use our custom authentication function
      const { data, error } = await supabase.rpc('check_demo_user_exists', {
        user_email: email
      });

      if (error) {
        console.error('Login error:', error);
        toast.error('Database error. Switching to offline mode...');
        setConnectionStatus('offline');
        return await login(email);
      }

      if (!data.success) {
        toast.error(data.error || 'User not found. Please contact administrator.');
        return false;
      }

      setPendingEmail(email);
      toast.success('OTP sent to your email (Demo: use 123456)');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const verifyOtp = async (otp: string): Promise<boolean> => {
    if (otp !== '123456' || !pendingEmail) {
      toast.error('Invalid OTP');
      return false;
    }

    try {
      let userProfile: User | null = null;

      if (connectionStatus === 'offline') {
        // Offline mode
        userProfile = DEMO_USERS[pendingEmail];
      } else {
        // Online mode - use our custom authentication function
        const { data, error } = await supabase.rpc('authenticate_demo_user', {
          user_email: pendingEmail,
          user_otp: otp
        });

        if (error) {
          console.error('Authentication error:', error);
          throw error;
        }

        if (!data.success) {
          toast.error(data.error || 'Authentication failed');
          return false;
        }

        userProfile = data.user;
      }

      if (!userProfile) {
        toast.error('Failed to load user profile');
        return false;
      }

      // Set user and save to localStorage
      setUser(userProfile);
      localStorage.setItem('bccl_user', JSON.stringify(userProfile));

      // Navigate based on role
      const routes = {
        employee: '/employee',
        admin: '/admin',
        department: '/department',
      };

      navigate(routes[userProfile.role], { replace: true });
      toast.success(`Welcome, ${userProfile.name}${connectionStatus === 'offline' ? ' (Offline Mode)' : ''}`);
      setPendingEmail(null);
      return true;
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed. Please try again.');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setPendingEmail(null);
    localStorage.removeItem('bccl_user');
    
    if (connectionStatus === 'online') {
      supabase.auth.signOut().catch(console.error);
    }
    
    navigate('/login', { replace: true });
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      connectionStatus,
      login,
      verifyOtp,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};