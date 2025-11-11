// services/apiService.js - API service with caching and error handling
import axios from "axios";
import authService from "./authService";

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.requestQueue = new Map();

    // Configure axios defaults
    axios.defaults.baseURL = this.baseURL;
    axios.defaults.timeout = 10000; // 10 second timeout

    // Setup request interceptor
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        const token = authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for performance monitoring
        config.metadata = { startTime: new Date() };

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axios.interceptors.response.use(
      (response) => {
        // Log response time in development
        if (process.env.NODE_ENV === "development") {
          const endTime = new Date();
          const duration = endTime - response.config.metadata.startTime;
          console.log(
            `[API] ${response.config.method.toUpperCase()} ${
              response.config.url
            } - ${duration}ms`
          );
        }

        return response;
      },
      (error) => {
        return this.handleError(error);
      }
    );
  }

  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          return Promise.reject({
            message:
              data.message || "Invalid request. Please check your input.",
            code: "BAD_REQUEST",
            status,
          });

        case 401:
          // Token expired or invalid
          authService.logout();
          window.location.href = "/login";
          return Promise.reject({
            message: "Your session has expired. Please login again.",
            code: "UNAUTHORIZED",
            status,
          });

        case 403:
          return Promise.reject({
            message: "You do not have permission to perform this action.",
            code: "FORBIDDEN",
            status,
          });

        case 404:
          return Promise.reject({
            message: "The requested resource was not found.",
            code: "NOT_FOUND",
            status,
          });

        case 429:
          return Promise.reject({
            message: "Too many requests. Please try again later.",
            code: "RATE_LIMITED",
            status,
          });

        case 500:
        case 502:
        case 503:
        case 504:
          return Promise.reject({
            message: "Server error. Please try again later.",
            code: "SERVER_ERROR",
            status,
          });

        default:
          return Promise.reject({
            message: data.message || "An unexpected error occurred.",
            code: "UNKNOWN_ERROR",
            status,
          });
      }
    } else if (error.request) {
      // Request made but no response received
      return Promise.reject({
        message: "Network error. Please check your connection.",
        code: "NETWORK_ERROR",
      });
    } else {
      // Error in request configuration
      return Promise.reject({
        message: error.message || "An error occurred while making the request.",
        code: "REQUEST_ERROR",
      });
    }
  }

  // Cache management
  getCacheKey(url, params) {
    return `${url}-${JSON.stringify(params || {})}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);

    if (cached) {
      const { data, timestamp } = cached;
      const now = Date.now();

      if (now - timestamp < this.cacheTimeout) {
        return data;
      } else {
        // Cache expired
        this.cache.delete(key);
      }
    }

    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clearCache() {
    this.cache.clear();
  }

  // Request deduplication
  async deduplicateRequest(key, requestFn) {
    // Check if request is already in flight
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key);
    }

    // Create new request promise
    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  // API Methods
  async fetchNews(params = {}) {
    const {
      page = 1,
      limit = 10,
      category = "all",
      sortBy = "recent",
      search = "",
      language, // 1. ⬇️ เพิ่มตัวแปร language
    } = params;

    const url = "/news";
    const cacheKey = this.getCacheKey(url, params); // cache key จะรวม language ไปด้วย

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    // Deduplicate concurrent requests
    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const response = await axios.get(url, {
          params: {
            page,
            limit,
            category: category !== "all" ? category : undefined,
            sortBy,
            search: search || undefined,
            language, // 2. ⬇️ ส่ง language ไปยัง Backend
          },
        });

        const data = response.data;

        // Cache the response
        this.setCache(cacheKey, data);

        return data;
      } catch (error) {
        throw error;
      }
    });
  }

  async searchStocks(query, options = {}) {
    if (!query || query.length < 2) {
      return { results: [] };
    }

    const url = "/stocks/search";
    const params = { q: query, ...options };
    const cacheKey = this.getCacheKey(url, params);

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const response = await axios.get(url, { params });
        const data = response.data;

        // Cache the response
        this.setCache(cacheKey, data);

        return data;
      } catch (error) {
        throw error;
      }
    });
  }

  async getWatchlist() {
    try {
      const response = await axios.get("/watchlist");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async addToWatchlist(symbol) {
    try {
      const response = await axios.post("/watchlist", { symbol });

      // Clear watchlist cache
      this.clearCache();

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async removeFromWatchlist(symbol) {
    try {
      const response = await axios.delete(`/watchlist/${symbol}`);

      // Clear watchlist cache
      this.clearCache();

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async toggleWatchlistAlert(symbol) {
    try {
      const response = await axios.put(`/watchlist/${symbol}/alert`);

      // Clear watchlist cache
      this.clearCache();

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getStockPrice(symbol) {
    const url = `/stocks/${symbol}/price`;
    const cacheKey = this.getCacheKey(url);

    // Use shorter cache timeout for prices (30 seconds)
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const { data, timestamp } = cached;
      if (Date.now() - timestamp < 30000) {
        return data;
      }
    }

    try {
      const response = await axios.get(url);
      const data = response.data;

      this.setCache(cacheKey, data);

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Batch requests for performance
  async batchFetchStockPrices(symbols) {
    if (!symbols || symbols.length === 0) {
      return {};
    }

    try {
      const response = await axios.post("/stocks/prices/batch", { symbols });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Abort controller for cancellable requests
  createAbortController() {
    return new AbortController();
  }

  async fetchWithAbort(url, options = {}, controller) {
    try {
      const response = await axios.get(url, {
        ...options,
        signal: controller.signal,
      });
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Request cancelled:", error.message);
        return null;
      }
      throw error;
    }
  }
}

export default new ApiService();