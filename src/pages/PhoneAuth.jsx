import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import BackButton from '../components/ui/BackButton';

// Error Boundary Component
class PhoneAuthErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PhoneAuth Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-dark-900 rounded-2xl p-8 shadow-xl">
            <div className="text-center">
              <h1 className="text-lg font-bold text-white mb-4">Something went wrong</h1>
              <p className="text-gray-400 mb-6">
                There was an error with phone authentication. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary w-full"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const PhoneAuth = () => {
  const [step, setStep] = useState('phone'); // 'phone' or 'verification'
  const [formData, setFormData] = useState({
    phoneNumber: '',
    verificationCode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const { signInWithPhone, verifyPhoneCode } = useAuth();
  const navigate = useNavigate();

  // Setup reCAPTCHA by calling the Firebase auth function (which handles it properly)
  const setupRecaptcha = async () => {
    try {
      console.log('🔧 Setting up reCAPTCHA via Firebase auth...');
      
      // Check if container exists
      const container = document.getElementById('recaptcha-container');
      if (!container) {
        console.error('❌ reCAPTCHA container not found');
        setError('reCAPTCHA container missing. Please refresh the page.');
        return;
      }

      // Use a dummy phone number to trigger reCAPTCHA setup without actually sending SMS
      // This is a safer approach than manually creating RecaptchaVerifier
      
      // First, let's check if Firebase is properly initialized
      const { auth } = await import('../firebase/config');
      console.log('🔧 Firebase auth object:', !!auth);
      
      if (!auth) {
        console.error('❌ Firebase auth not initialized');
        setError('Firebase not configured. Please check your environment variables.');
        return;
      }

      // Clear existing verifier safely
      if (window.recaptchaVerifier) {
        try {
          if (container && container.children.length > 0) {
            window.recaptchaVerifier.clear();
          }
        } catch (e) {
          console.log('⚠️ Error clearing previous reCAPTCHA:', e);
        }
        window.recaptchaVerifier = null;
      }

      // Import and create RecaptchaVerifier with proper error handling
      const { RecaptchaVerifier } = await import('firebase/auth');
      
      console.log('🔧 Creating RecaptchaVerifier with proper auth object...');
      
      // Create RecaptchaVerifier with explicit parameters
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        theme: 'light',
        callback: (response) => {
          console.log('✅ reCAPTCHA solved:', response);
          setRecaptchaReady(true);
          setError(''); // Clear any previous errors
        },
        'expired-callback': () => {
          console.log('⚠️ reCAPTCHA expired');
          setRecaptchaReady(false);
          setError('reCAPTCHA expired. Please try again.');
        },
        'error-callback': (error) => {
          console.error('❌ reCAPTCHA callback error:', error);
          setRecaptchaReady(false);
          setError('reCAPTCHA error. Please refresh the page and try again.');
        }
      });

      // Store globally for cleanup
      window.recaptchaVerifier = recaptchaVerifier;

      console.log('🔧 Rendering reCAPTCHA widget...');
      
      // Render the reCAPTCHA
      await recaptchaVerifier.render();
      console.log('✅ reCAPTCHA rendered successfully');
      
      // Clear any setup messages
      setError('');
      
    } catch (error) {
      console.error('❌ Error setting up reCAPTCHA:', error);
      console.error('❌ Full error object:', error);
      
      let errorMessage = 'Failed to load security verification. ';
      
      if (error.code === 'auth/argument-error') {
        errorMessage += 'Firebase configuration issue. Please check your setup.';
        console.error('❌ Argument error - check Firebase auth initialization');
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage += 'Domain not authorized. Please check Firebase Console settings.';
      } else if (error.message && error.message.includes('network')) {
        errorMessage += 'Network error. Please check your connection.';
      } else {
        errorMessage += 'Please refresh the page and try again.';
      }
      
      setError(errorMessage);
    }
  };

  // Setup reCAPTCHA automatically when component mounts
  useEffect(() => {
    console.log('🎯 PhoneAuth component mounted');
    
    // Let's not auto-setup reCAPTCHA, wait for user to click button
    // This avoids the argument error on component mount
    
    return () => {
      // Better cleanup to prevent React DOM errors
      if (window.recaptchaVerifier) {
        try {
          // Check if the DOM element still exists before clearing
          const container = document.getElementById('recaptcha-container');
          if (container && container.children.length > 0) {
            window.recaptchaVerifier.clear();
          }
          window.recaptchaVerifier = null;
        } catch (e) {
          console.log('⚠️ Error cleaning up reCAPTCHA:', e);
          // Force cleanup
          window.recaptchaVerifier = null;
        }
      }
    };
  }, []);

  const refreshRecaptcha = () => {
    if (window.recaptchaVerifier) {
      try {
        // Check if the DOM element still exists before clearing
        const container = document.getElementById('recaptcha-container');
        if (container && container.children.length > 0) {
          window.recaptchaVerifier.clear();
        }
        window.recaptchaVerifier = null;
      } catch (e) {
        console.log('⚠️ Error clearing reCAPTCHA:', e);
        window.recaptchaVerifier = null;
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

    console.log('📱 Phone submit started');

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

    // Check Firebase configuration before proceeding
    try {
      console.log('🔧 Checking Firebase configuration...');
      
      // Import and check Firebase config
      const { auth } = await import('../firebase/config');
      console.log('🔧 Firebase auth object:', auth);
      console.log('🔧 Environment variables:', {
        API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? 'SET' : 'MISSING',
        AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'SET' : 'MISSING',
        PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'SET' : 'MISSING',
        APP_ID: import.meta.env.VITE_FIREBASE_APP_ID ? 'SET' : 'MISSING'
      });
      
      if (!auth) {
        throw new Error('Firebase auth not initialized. Check environment variables.');
      }
      
      setLoading(true);
      console.log('🔄 Starting phone authentication (will setup reCAPTCHA automatically)...');
      
      // Check if reCAPTCHA container exists before proceeding
      const container = document.getElementById('recaptcha-container');
      console.log('🔧 Checking reCAPTCHA container:', {
        exists: !!container,
        element: container,
        innerHTML: container?.innerHTML,
        parentNode: container?.parentNode?.tagName
      });
      
      if (!container) {
        throw new Error('reCAPTCHA container not found in DOM. Please refresh the page and try again.');
      }
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const confirmation = await signInWithPhone(formData.phoneNumber);
      
      console.log('✅ Phone authentication successful, received confirmation:', !!confirmation);
      setConfirmationResult(confirmation);
      setStep('verification');
      console.log('✅ Step changed to verification');
    } catch (error) {
      console.error('❌ Phone auth error caught in component:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      });

      // More specific error messages including timeout handling
      let errorMessage = 'Failed to send verification code. Please try again.';
      
      if (error.code === 'auth/timeout' || error.name === 'TimeoutError' || (error.message && error.message.includes('timed out'))) {
        errorMessage = 'Request timed out after 30 seconds. Please check your internet connection and try again.';
      } else if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please include country code (e.g., +1234567890)';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'Security verification failed. Please complete the reCAPTCHA and try again.';
      } else if (error.message.includes('reCAPTCHA') || error.message.includes('Security verification')) {
        errorMessage = 'Security verification failed. Please complete the reCAPTCHA below and try again.';
      } else if (error.code === 'auth/app-not-authorized') {
        errorMessage = 'App not authorized for phone authentication. Please contact support.';
      } else if (error.code === 'auth/argument-error') {
        errorMessage = 'Firebase configuration error. Please refresh the page and try again.';
      } else if (error.message && error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
      console.log('❌ Error set:', errorMessage);
    } finally {
      setLoading(false);
      console.log('🔄 Loading state reset');
    }
  };  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      const result = await verifyPhoneCode(confirmationResult, formData.verificationCode);
      // Only redirect to profile setup if profile is not completed
      if (!result || !result.profileCompleted) {
        navigate('/profile-setup');
      } else {
        navigate('/', { replace: true });
      }
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

  console.log('🎨 PhoneAuth rendering - step:', step, 'loading:', loading, 'error:', error);
  console.log('🔧 Environment check on render:', {
    NODE_ENV: import.meta.env.MODE,
    FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? 'LOADED' : 'MISSING',
    FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
  });

  // Test Firebase initialization on render
  React.useEffect(() => {
    const testFirebase = async () => {
      try {
        const { auth } = await import('../firebase/config');
        console.log('🔥 Firebase test on render:', {
          authExists: !!auth,
          authApp: auth?.app?.name || 'NO_APP',
          authConfig: auth?.app?.options?.projectId || 'NO_PROJECT_ID'
        });
      } catch (error) {
        console.error('🔥 Firebase import error:', error);
      }
    };
    testFirebase();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      {/* Loading Overlay - Only show during SMS sending */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-dark-900 rounded-2xl p-6 flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white text-sm">
              {step === 'phone' ? 'Sending verification code...' : 'Verifying code...'}
            </p>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-md">
        <div className="bg-dark-900 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center mb-6">
            <BackButton 
              onClick={() => step === 'verification' ? setStep('phone') : navigate('/auth')}
              className="-ml-2"
            />
            <div className="flex-1 text-center">
              <img src="/5StarLogo.svg" alt="5Star Logo" className="w-12 h-12 mx-auto" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-lg font-bold text-white tracking-tight mb-2">
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
                className="btn-primary w-full relative"
              >
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <span className={loading ? 'opacity-0' : 'opacity-100'}>
                  {loading ? 'Setting up verification...' : 'Send Verification Code'}
                </span>
              </button>

              {/* reCAPTCHA container - visible for better reliability */}
              <div className="mt-4">
                <p className="text-gray-500 text-sm text-center mb-2">
                  Security verification will appear here:
                </p>
                <div id="recaptcha-container" className="flex justify-center min-h-[78px] items-center">
                  <div className="text-gray-500 text-sm text-center">
                    Click "Send Verification Code" to load security verification
                  </div>
                </div>
                <p className="text-gray-400 text-xs text-center mt-2">
                  You'll need to complete a security check before receiving your verification code.
                </p>
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
                  className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 focus:border-gray-400 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors duration-200 text-center text-lg tracking-widest"
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
                className="btn-primary w-full relative"
              >
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <span className={loading ? 'opacity-0' : 'opacity-100'}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </span>
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

const PhoneAuthWithErrorBoundary = () => (
  <PhoneAuthErrorBoundary>
    <PhoneAuth />
  </PhoneAuthErrorBoundary>
);

export default PhoneAuthWithErrorBoundary;