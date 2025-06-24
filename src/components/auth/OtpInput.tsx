import React, { useState } from 'react';
import OtpInput from 'react-otp-input';
import { useAuth } from '../../contexts/AuthContext';

interface OtpVerificationProps {
  onVerificationSuccess: () => void;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({ onVerificationSuccess }) => {
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { verifyOtp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setIsSubmitting(true);
    try {
      const success = await verifyOtp(otp);
      if (success) {
        onVerificationSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify OTP</h2>
          <p className="text-gray-600 mb-6">
            Enter the 6-digit code sent to your email
          </p>
          
          <div className="flex justify-center my-8">
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              renderInput={(props) => (
                <input
                  {...props}
                  className="!w-12 h-12 mx-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              )}
              inputStyle={{
                width: '2.5rem',
                height: '2.5rem',
                margin: '0 0.5rem',
                fontSize: '1.25rem',
                borderRadius: '0.375rem',
                border: '1px solid #D1D5DB',
              }}
              containerStyle="flex justify-center"
              inputType="number"
              shouldAutoFocus
            />
          </div>
          
          <div className="text-center mt-4">
            <p className="text-gray-500 text-sm">
              Didn't receive a code? <button type="button" className="text-primary-600 hover:text-primary-700 underline">Resend OTP</button>
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={otp.length !== 6 || isSubmitting}
            className={`w-full py-3 px-4 rounded-md transition duration-200 ease-in-out
              ${isSubmitting || otp.length !== 6
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Verifying...
              </span>
            ) : (
              'Verify OTP'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OtpVerification;