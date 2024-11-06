interface CacheOptions {
    expiryMinutes?: number;
  }
  
  interface CachedData<T> {
    data: T;
    timestamp: number;
    expiry: number;
  }
  
  export class CacheManager {
    static set<T>(key: string, data: T, options: CacheOptions = {}) {
      const { expiryMinutes = 5 } = options;
      
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + (expiryMinutes * 60 * 1000)
      };
  
      try {
        localStorage.setItem(key, JSON.stringify(cachedData));
      } catch (error) {
        console.warn('Cache write failed:', error);
      }
    }
  
    static get<T>(key: string): T | null {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
  
        const parsedCache: CachedData<T> = JSON.parse(cached);
        
        // Check if cache has expired
        if (Date.now() > parsedCache.expiry) {
          localStorage.removeItem(key);
          return null;
        }
  
        return parsedCache.data;
      } catch (error) {
        console.warn('Cache read failed:', error);
        return null;
      }
    }
  
    static clear(key?: string) {
      if (key) {
        localStorage.removeItem(key);
      } else {
        localStorage.clear();
      }
    }
  
    static isExpired(key: string): boolean {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return true;
  
        const { expiry } = JSON.parse(cached);
        return Date.now() > expiry;
      } catch {
        return true;
      }
    }
  }