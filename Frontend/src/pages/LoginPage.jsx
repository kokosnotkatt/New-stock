import { useState, useCallback, useRef, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, X, AlertCircle } from 'lucide-react';
import authService from '../services/authService';

const LoginPage = ({ onClose, onSwitchToSignup, onLoginSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!validateEmail(value)) return 'Please enter a valid email address';
        return null;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      default:
        return null;
    }
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (key !== 'rememberMe') {
        const error = validateField(key, formData[key]);
        if (error) newErrors[key] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: fieldValue }));
    if (apiError) setApiError(null);
    if (errors[name]) {
      const error = validateField(name, fieldValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [errors, apiError, validateField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }
    setIsLoading(true);
    try {
      const response = await authService.login(formData.email, formData.password);
      if (formData.rememberMe) {
        localStorage.setItem('remember_email', formData.email);
      } else {
        localStorage.removeItem('remember_email');
      }
      if (onLoginSuccess) onLoginSuccess(response.user);
      onClose?.();
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'RATE_LIMITED') setApiError(error.message);
      else if (error.response?.status === 401) setApiError('Invalid email or password. Please try again.');
      else if (error.code === 'NETWORK_ERROR') setApiError('Network error. Please check your connection.');
      else setApiError(error.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = useCallback((provider) => {
    setIsLoading(true);
    window.location.href = `/api/auth/oauth/${provider}`;
  }, []);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remember_email');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"> {/* <-- แก้ไข */}
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div> {/* <-- แก้ไข */}
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div> {/* <-- แก้ไข */}
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div> {/* <-- แก้ไข */}
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md relative border border-white/20">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10" aria-label="Close">
          <X className="w-6 h-6" />
        </button>
        <div className="p-8 pb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-600">Sign in to continue to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5" noValidate>
          {apiError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                ref={emailInputRef} type="email" id="email" name="email"
                value={formData.email} onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white/50 ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500' // <-- แก้ไข
                }`}
                placeholder="Enter your email" autoComplete="email" disabled={isLoading}
              />
            </div>
            {errors.email && <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'} id="password" name="password"
                value={formData.password} onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white/50 ${
                  errors.password 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500' // <-- แก้ไข
                }`}
                placeholder="Enter your password" autoComplete="current-password" disabled={isLoading}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer" // <-- แก้ไข
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-700">Remember me</span>
            </label>
            <button type="button" className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors" disabled={isLoading}> {/* <-- แก้ไข */}
              Forgot password?
            </button>
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30" // <-- แก้ไข
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </div>
            ) : 'Sign In'}
          </button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">or</span></div>
          </div>
          <div className="space-y-3">
          </div>
          <p className="text-center text-sm text-gray-600 pt-4">
            Don't have an account?{' '}
            <button type="button" onClick={onSwitchToSignup} className="text-green-600 hover:text-green-700 font-semibold transition-colors" disabled={isLoading}> {/* <-- แก้ไข */}
              Sign up
            </button>
          </p>
        </form>
      </div>
      <style jsx>{`
        @keyframes blob { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default LoginPage;