/**
 * In-memory rate limiter for API protection
 * Protects against DDoS and brute force attacks
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockExpiry?: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  blockDurationMs: number; // How long to block after exceeding limit
}

// Default configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Standard API endpoints - generous limits
  api: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 100,           // 100 requests per minute
    blockDurationMs: 60 * 1000, // Block for 1 minute
  },
  // Write operations (POST, PUT, DELETE) - stricter
  write: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 30,            // 30 writes per minute
    blockDurationMs: 2 * 60 * 1000, // Block for 2 minutes
  },
  // Search/heavy operations - most strict
  search: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 20,            // 20 searches per minute
    blockDurationMs: 5 * 60 * 1000, // Block for 5 minutes
  },
} as const;

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Check if a request should be allowed
   * @returns { allowed: boolean, remaining: number, resetIn: number }
   */
  check(
    identifier: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.api
  ): { allowed: boolean; remaining: number; resetIn: number; blocked: boolean } {
    const now = Date.now();
    const key = identifier;
    const entry = this.store.get(key);

    // Check if currently blocked
    if (entry?.blocked && entry.blockExpiry && entry.blockExpiry > now) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.blockExpiry - now,
        blocked: true,
      };
    }

    // Reset if window expired or was blocked but block expired
    if (!entry || entry.resetTime <= now || (entry.blocked && (!entry.blockExpiry || entry.blockExpiry <= now))) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        blocked: false,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetIn: config.windowMs,
        blocked: false,
      };
    }

    // Increment counter
    entry.count++;

    // Check if exceeded limit
    if (entry.count > config.maxRequests) {
      entry.blocked = true;
      entry.blockExpiry = now + config.blockDurationMs;
      return {
        allowed: false,
        remaining: 0,
        resetIn: config.blockDurationMs,
        blocked: true,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetIn: entry.resetTime - now,
      blocked: false,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, entry] of entries) {
      // Remove entries that are past their reset time and not blocked
      // Or blocked entries past their block expiry
      if (
        (entry.resetTime <= now && !entry.blocked) ||
        (entry.blocked && entry.blockExpiry && entry.blockExpiry <= now)
      ) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get current stats (for monitoring)
   */
  getStats(): { totalEntries: number; blockedIPs: number } {
    let blockedIPs = 0;
    const now = Date.now();
    const values = Array.from(this.store.values());
    for (const entry of values) {
      if (entry.blocked && entry.blockExpiry && entry.blockExpiry > now) {
        blockedIPs++;
      }
    }
    return {
      totalEntries: this.store.size,
      blockedIPs,
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
