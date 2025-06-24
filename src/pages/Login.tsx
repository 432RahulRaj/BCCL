import React, { useState, useEffect } from 'react';
import { Building2, Mail, Shield, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, verifyOtp, connectionStatus, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      const routes = {
        employee: '/employee',
        admin: '/admin',
        department: '/department',
      };
      
      // If they were trying to access a specific page, go there, otherwise go to their dashboard
      const destination = from || routes[user.role];
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await login(email);
      if (success) {
        setStep('otp');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsSubmitting(true);
    try {
      await verifyOtp(otp);
      // Navigation is handled in the verifyOtp function
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccountClick = (demoEmail: string) => {
    setEmail(demoEmail);
    setStep('email');
  };

  const demoAccounts = [
    { email: 'admin@coalindia.in', role: 'Admin', icon: Shield },
    { email: 'employee@coalindia.in', role: 'Employee', icon: Building2 },
    { email: 'water@coalindia.in', role: 'Water Dept', icon: Building2 },
    { email: 'electrical@coalindia.in', role: 'Electrical Dept', icon: Building2 },
  ];

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
            <Building2 size={40} className="text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            BCCL Quarters Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Complaint Management System
          </p>
          
          {/* Connection Status */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            {connectionStatus === 'online' ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-600">Offline Mode</span>
              </>
            )}
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your @coalindia.in email"
                    required
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  />
                  <Mail className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Use your official @coalindia.in email address
                </p>
              </div>

              <button
                type="submit"
                disabled={!email.trim() || isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending OTP...
                  </div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Verify OTP</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit code sent to {email}
                </p>
                
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 text-center text-lg tracking-widest"
                  maxLength={6}
                />
                
                <div className="mt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtp('');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    ← Back to email
                  </button>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={otp.length !== 6 || isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Demo Accounts */}
        <div className="bg-white py-6 px-6 shadow-lg rounded-xl border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Demo Accounts</h3>
          <div className="grid grid-cols-2 gap-3">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                onClick={() => handleDemoAccountClick(account.email)}
                className="flex items-center space-x-2 p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition duration-200"
              >
                <account.icon className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs font-medium text-gray-900">{account.role}</div>
                  <div className="text-xs text-gray-500">{account.email}</div>
                </div>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-center text-gray-500">
            OTP for all accounts: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">123456</span>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} BCCL. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;