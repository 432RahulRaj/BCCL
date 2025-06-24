import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface EmailFormProps {
  onOtpSent: () => void;
}

const EmailForm: React.FC<EmailFormProps> = ({ onOtpSent }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await login(email);
      if (success) {
        onOtpSent();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your @coalindia.in email"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 border"
          />
          <p className="mt-2 text-sm text-gray-500">
            Please use your official @coalindia.in email
          </p>
        </div>

        <div>
          <button
            type="submit"
            disabled={!email.trim() || isSubmitting}
            className={`w-full py-3 px-4 rounded-md transition duration-200 ease-in-out
              ${!email.trim() || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Sending OTP...
              </span>
            ) : (
              'Get OTP'
            )}
          </button>
        </div>
      </form>
      
      <div className="mt-8 text-sm text-center text-gray-500">
        <p>For the demo, please use one of these emails:</p>
        <ul className="mt-2 space-y-1">
          <li>Employee: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">employee@coalindia.in</span></li>
          <li>Admin: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">admin@coalindia.in</span></li>
          <li>Department: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">water@coalindia.in</span> or <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">electrical@coalindia.in</span></li>
        </ul>
        <p className="mt-2">OTP for all: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">123456</span></p>
      </div>
    </div>
  );
};

export default EmailForm;