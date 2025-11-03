// services/authService.js
import axios from 'axios';

class AuthService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    this.tokenKey = 'auth_token';
    this.refreshTokenKey = 'refresh_token';
    this.maxLoginAttempts = 5;
    this.lockoutTime = 15 * 60 * 1000; 
    
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    // Request interceptor to add token
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            return axios(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Rate limiting check
  checkRateLimit(email) {
    const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
    const userAttempts = attempts[email] || { count: 0, lastAttempt: null, lockedUntil: null };
    
    // Check if user is locked out
    if (userAttempts.lockedUntil && new Date(userAttempts.lockedUntil) > new Date()) {
      const remainingTime = Math.ceil((new Date(userAttempts.lockedUntil) - new Date()) / 60000);
      throw new Error(`Too many login attempts. Please try again in ${remainingTime} minutes.`);
    }
    
    return userAttempts;
  }

  updateLoginAttempts(email, success = false) {
    const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
    
    if (success) {
      // Clear attempts on successful login
      delete attempts[email];
    } else {
      // Increment failed attempts
      const userAttempts = attempts[email] || { count: 0, lastAttempt: null, lockedUntil: null };
      userAttempts.count += 1;
      userAttempts.lastAttempt = new Date().toISOString();
      
      // Lock account if max attempts reached
      if (userAttempts.count >= this.maxLoginAttempts) {
        userAttempts.lockedUntil = new Date(Date.now() + this.lockoutTime).toISOString();
      }
      
      attempts[email] = userAttempts;
    }
    
    localStorage.setItem('login_attempts', JSON.stringify(attempts));
  }

  async login(email, password) {
    try {
      // Check rate limiting
      this.checkRateLimit(email);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Make API request
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email,
        password
      }, {
        withCredentials: true, // For CSRF token
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const { token, refreshToken, user } = response.data;
      
      // Store tokens securely
      this.setTokens(token, refreshToken);
      
      // Clear login attempts on success
      this.updateLoginAttempts(email, true);
      
      // Set session timeout
      this.setupSessionTimeout();
      
      return { success: true, user };
      
    } catch (error) {
      // Update failed attempts
      if (error.response?.status === 401) {
        this.updateLoginAttempts(email, false);
      }
      
      throw error;
    }
  }

  async signup(userData) {
    try {
      // Validate password strength
      this.validatePassword(userData.password);
      
      const response = await axios.post(`${this.baseURL}/auth/signup`, userData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const { token, refreshToken, user } = response.data;
      
      // Store tokens
      this.setTokens(token, refreshToken);
      
      // Set session timeout
      this.setupSessionTimeout();
      
      return { success: true, user };
      
    } catch (error) {
      throw error;
    }
  }

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refreshToken
      });
      
      const { token, refreshToken: newRefreshToken } = response.data;
      
      this.setTokens(token, newRefreshToken);
      
      return token;
      
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters long`);
    }
    
    if (!hasUpperCase || !hasLowerCase) {
      throw new Error('Password must contain both uppercase and lowercase letters');
    }
    
    if (!hasNumbers) {
      throw new Error('Password must contain at least one number');
    }
    
    if (!hasSpecialChar) {
      throw new Error('Password must contain at least one special character');
    }
  }

  setupSessionTimeout() {
    // Clear existing timeout
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Set new timeout (30 minutes)
    const timeout = 30 * 60 * 1000;
    
    this.sessionTimeout = setTimeout(() => {
      this.logout();
      alert('Your session has expired. Please login again.');
      window.location.href = '/login';
    }, timeout);
    
    // Reset timeout on user activity
    this.resetSessionTimeout();
  }

  resetSessionTimeout() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (this.isAuthenticated()) {
          this.setupSessionTimeout();
        }
      }, { once: true });
    });
  }

  setTokens(token, refreshToken) {
    // Use httpOnly cookies in production, localStorage for development
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
    
    // Decode token to get expiration
    const tokenPayload = this.decodeToken(token);
    if (tokenPayload.exp) {
      localStorage.setItem('token_expiry', tokenPayload.exp);
    }
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }

  decodeToken(token) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      return null;
    }
  }

  isAuthenticated() {
    const token = this.getToken();
    
    if (!token) {
      return false;
    }
    
    // Check token expiration
    const tokenPayload = this.decodeToken(token);
    if (tokenPayload && tokenPayload.exp) {
      const expirationTime = tokenPayload.exp * 1000; // Convert to milliseconds
      return Date.now() < expirationTime;
    }
    
    return false;
  }

  logout() {
    // Clear tokens
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem('token_expiry');
    
    // Clear session timeout
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }
    
    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];
    
    // Call logout API endpoint
    axios.post(`${this.baseURL}/auth/logout`).catch(() => {
      // Ignore logout errors
    });
  }

  async validateSession() {
    if (!this.isAuthenticated()) {
      return false;
    }
    
    try {
      const response = await axios.get(`${this.baseURL}/auth/validate`);
      return response.data.valid;
    } catch (error) {
      return false;
    }
  }
}

export default new AuthService();