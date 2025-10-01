import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

const PhoneAuth = () => {
  const [step, setStep] = useState('phone'); // 'phone' or 'verification'
  const [formData, setFormData] = useState({
    phoneNumber: '',
    verificationCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const { signInWithPhone, verifyPhoneCode } = useAuth();
  const navigate = useNavigate();

  // Cleanup reCAPTCHA on component unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {
          console.log('⚠️ Error cleaning up reCAPTCHA:', e);
        }
      }
    };
  }, []);

  const refreshRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      } catch (e) {
        console.log('⚠️ Error clearing reCAPTCHA:', e);
      }
    }
    setError('');
    // Force page refresh to reinitialize reCAPTCHA
    window.location.reload();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    try {
      setLoading(true);
      const confirmation = await signInWithPhone(formData.phoneNumber);
      setConfirmationResult(confirmation);
      setStep('verification');
    } catch (error) {
      console.error('Phone auth error:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to send verification code. Please try again.';
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please include country code (e.g., +1234567890)';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'Security verification failed. Please complete the reCAPTCHA and try again.';
      } else if (error.message.includes('reCAPTCHA') || error.message.includes('Security verification')) {
        errorMessage = 'Security verification failed. Please complete the reCAPTCHA below and try again.';
      } else if (error.code === 'auth/app-not-authorized') {
        errorMessage = 'App not authorized for phone authentication. Please contact support.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      await verifyPhoneCode(confirmationResult, formData.verificationCode);
      navigate('/profile-setup');
    } catch (error) {
      console.error('Verification error:', error);
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Clear previous reCAPTCHA verifier
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      
      const confirmation = await signInWithPhone(formData.phoneNumber);
      setConfirmationResult(confirmation);
    } catch (error) {
      console.error('Resend code error:', error);
      
      let errorMessage = 'Failed to resend verification code. Please try again.';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a few minutes before requesting another code.';
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number. Please check your number and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-dark-900 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center mb-6">
            <button
              onClick={() => step === 'verification' ? setStep('phone') : navigate('/auth')}
              className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex-1 text-center">
              <img src="/5StarLogo.svg" alt="5Star Logo" className="w-12 h-12 mx-auto" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
              {step === 'phone' ? 'Phone Number' : 'Verify Code'}
            </h1>
            <p className="text-gray-400">
              {step === 'phone' 
                ? 'Enter your phone number to get started' 
                : `We sent a code to ${formData.phoneNumber}`
              }
            </p>
          </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
          {error.includes('Security verification') && (
            <button
              onClick={refreshRecaptcha}
              className="mt-2 text-red-300 hover:text-red-200 text-xs underline"
            >
              Refresh Security Verification
            </button>
          )}
          {import.meta.env.DEV && (
            <details className="mt-2">
              <summary className="text-red-300 text-xs cursor-pointer">Debug Info (Dev Mode)</summary>
              <p className="text-red-300 text-xs mt-1">
                • Check if phone auth is enabled in Firebase Console<br/>
                • Verify phone number format: {formData.phoneNumber || 'Not entered'}<br/>
                • Check browser console for detailed errors<br/>
                • Ensure domain is authorized in Firebase<br/>
                • Complete the reCAPTCHA security verification below
              </p>
            </details>
          )}
        </div>
      )}          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors duration-200"
                  placeholder="Enter your phone number (+1234567890)"
                  autoComplete="tel"
                />
                <p className="text-gray-500 text-sm mt-2">
                  Include country code (e.g., +1 for US)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>

              {/* reCAPTCHA container - visible for better reliability */}
              <div className="mt-4">
                <p className="text-gray-500 text-sm text-center mb-2">Security verification required:</p>
                <div id="recaptcha-container" className="flex justify-center min-h-[78px] items-center">
                  {loading && (
                    <div className="text-gray-500 text-sm">Loading security verification...</div>
                  )}
                </div>
                {import.meta.env.DEV && (
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    <p>If reCAPTCHA doesn't load:</p>
                    <p>• Check if ad blocker is disabled</p>
                    <p>• Ensure internet connection is stable</p>
                    <p>• Try refreshing the page</p>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors duration-200 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <p className="text-gray-500 text-sm mt-2 text-center">
                  Enter the 6-digit code we sent to your phone
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={loading}
                  className="text-primary-400 hover:text-primary-300 text-sm"
                >
                  Didn't receive code? Resend
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhoneAuth;