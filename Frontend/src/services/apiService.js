import axios from "axios";
import authService from "./authService";

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000;
    this.requestQueue = new Map();
    this.retryCount = 3;
    this.retryDelay = 1000;

    axios.defaults.baseURL = this.baseURL;
    axios.defaults.timeout = 10000;

    this.setupInterceptors();
  }

  setupInterceptors() {
    axios.interceptors.request.use(
      (config) => {
        const token = authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.metadata = { startTime: new Date() };
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => {
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
      async (error) => {
        return this.handleError(error);
      }
    );
  }

  async handleError(error) {
    // Retry logic for network errors
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
      const config = error.config;
      
      if (!config || !config.retry) {
        config.retry = 0;
      }

      if (config.retry < this.retryCount) {
        config.retry += 1;
        
        const delay = this.retryDelay * Math.pow(2, config.retry - 1);
        console.log(`⚠️ Retrying request (${config.retry}/${this.retryCount}) after ${delay}ms`);
        
        await this.sleep(delay);
        return axios(config);
      }
    }

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          return Promise.reject({
            message: data.message || "Invalid request. Please check your input.",
            code: "BAD_REQUEST",
            status,
          });

        case 401:
          authService.logout();
          window.location.href = "/";
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
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          
          return Promise.reject({
            message: `Too many requests. Please try again in ${Math.ceil(waitTime/1000)} seconds.`,
            code: "RATE_LIMITED",
            status,
            retryAfter: waitTime
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
      return Promise.reject({
        message: "Network error. Please check your connection.",
        code: "NETWORK_ERROR",
      });
    } else {
      return Promise.reject({
        message: error.message || "An error occurred while making the request.",
        code: "REQUEST_ERROR",
      });
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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

    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clearCache() {
    this.cache.clear();
  }

  async deduplicateRequest(key, requestFn) {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key);
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  async fetchNews(params = {}) {
    const {
      page = 1,
      limit = 10,
      category = "all",
      sortBy = "recent",
      search = "",
      language,
    } = params;

    const url = "/news";
    const cacheKey = this.getCacheKey(url, params);

    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    return this.deduplicateRequest(cacheKey, async () => {
      try {
        const response = await axios.get(url, {
          params: {
            page,
            limit,
            category: category !== "all" ? category : undefined,
            sortBy,
            search: search || undefined,
            language,
          },
        });

        const data = response.data;
        this.setCache(cacheKey, data);
        return data;
      } catch (error) {
        throw error;
      }
    });
  }

  // ... rest of methods remain the same
}

export default new ApiService();