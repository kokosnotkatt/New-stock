// pages/LoginPage.jsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, X, AlertCircle } from 'lucide-react';
import authService from '../services/authService';
import { useLanguage } from '../context/LanguageContext'; // 1. Import

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
  const { t } = useLanguage(); // 2. เรียกใช้ t

  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // 3. (อัปเดต) ใช้ t() สำหรับข้อความ Error
  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'email':
        if (!value) return t('login.errors.emailRequired'); // (ควรเพิ่ม key นี้ใน Context)
        if (!validateEmail(value)) return t('login.errors.emailInvalid');
        return null;
      case 'password':
        if (!value) return t('login.errors.passwordRequired');
        if (value.length < 6) return t('login.errors.passwordLength');
        return null;
      default:
        return null;
    }
  }, [t]); // เพิ่ม t dependency

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

  // 3. (อัปเดต) ใช้ t() สำหรับข้อความ Error
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
      else if (error.response?.status === 401) setApiError(t('login.errors.invalidCredentials')); // (ควรเพิ่ม key)
      else if (error.code === 'NETWORK_ERROR') setApiError(t('login.errors.network')); // (ควรเพิ่ม key)
      else setApiError(error.message || t('login.errors.unknown')); // (ควรเพิ่ม key)
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
    <div className="fixed inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md relative border border-white/20">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10" aria-label="Close">
          <X className="w-6 h-6" />
        </button>
        <div className="p-8 pb-6">
          {/* 4. ใช้ t() */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('login.welcome')}</h2>
          <p className="text-gray-600">{t('login.signInContinue')}</p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5" noValidate>
          {apiError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">{t('login.emailLabel')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                ref={emailInputRef} type="email" id="email" name="email"
                value={formData.email} onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white/50 ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                placeholder={t('login.emailPlaceholder')}
                autoComplete="email" disabled={isLoading}
              />
            </div>
            {errors.email && <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">{t('login.passwordLabel')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'} id="password" name="password"
                value={formData.password} onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all bg-white/50 ${
                  errors.password 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                }`}
                placeholder={t('login.passwordPlaceholder')}
                autoComplete="current-password" disabled={isLoading}
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
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                disabled={isLoading}
              />
              <span className="ml-2 text-sm text-gray-700">{t('login.rememberMe')}</span>
            </label>
            <button type="button" className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors" disabled={isLoading}>
              {t('login.forgotPassword')}
            </button>
          </div>
          <button type="submit" disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('login.signingIn')}
              </div>
            ) : t('login.signInBtn')}
          </button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-500">{t('login.or')}</span></div>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('login.continueWithGoogle')}
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('line')}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700 bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00B900">
                <path d="M19.5 3H4.5C3.67 3 3 3.67 3 4.5V19.5C3 20.33 3.67 21 4.5 21H19.5C20.33 21 21 20.33 21 19.5V4.5C21 3.67 20.33 3 19.5 3Z"/>
              </svg>
              {t('login.continueWithLine')}
            </button>
          </div>
          <p className="text-center text-sm text-gray-600 pt-4">
            {t('login.noAccount')}{' '}
            <button type="button" onClick={onSwitchToSignup} className="text-green-600 hover:text-green-700 font-semibold transition-colors" disabled={isLoading}>
              {t('login.signUpLink')}
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