/**
 * Input validation utilities for API routes
 * Prevents payload attacks and ensures data integrity
 */

// Maximum payload sizes (in bytes)
export const MAX_PAYLOAD_SIZE = {
  default: 10 * 1024,     // 10KB for most requests
  large: 100 * 1024,      // 100KB for bulk operations
  tiny: 1024,             // 1KB for simple updates
} as const;

// Maximum string lengths
export const MAX_STRING_LENGTH = {
  name: 100,              // DJ names, titles
  url: 500,               // URLs
  notes: 1000,            // Notes, descriptions
  searchQuery: 200,       // Search queries
} as const;

/**
 * Validate payload size from request body
 */
export async function validatePayloadSize(
  request: Request,
  maxSize: number = MAX_PAYLOAD_SIZE.default
): Promise<{ valid: boolean; error?: string; body?: unknown }> {
  try {
    const contentLength = request.headers.get('content-length');

    // Check content-length header if present
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return {
        valid: false,
        error: `Payload too large. Maximum size is ${Math.round(maxSize / 1024)}KB`,
      };
    }

    // Clone request to read body without consuming it
    const clonedRequest = request.clone();
    const text = await clonedRequest.text();

    // Check actual body size
    if (text.length > maxSize) {
      return {
        valid: false,
        error: `Payload too large. Maximum size is ${Math.round(maxSize / 1024)}KB`,
      };
    }

    // Empty body is valid for some requests
    if (!text) {
      return { valid: true, body: {} };
    }

    // Parse JSON
    try {
      const body = JSON.parse(text);
      return { valid: true, body };
    } catch {
      return { valid: false, error: 'Invalid JSON' };
    }
  } catch {
    return { valid: false, error: 'Failed to read request body' };
  }
}

/**
 * Sanitize a string input
 */
export function sanitizeString(
  input: unknown,
  maxLength: number = MAX_STRING_LENGTH.name
): string | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input !== 'string') {
    return null;
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  // Remove control characters (except newlines for notes)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Validate and sanitize a URL
 */
export function validateUrl(
  input: unknown,
  allowedHosts?: string[]
): { valid: boolean; url?: string; error?: string } {
  if (typeof input !== 'string') {
    return { valid: false, error: 'URL must be a string' };
  }

  const sanitized = input.trim();

  if (sanitized.length > MAX_STRING_LENGTH.url) {
    return { valid: false, error: 'URL too long' };
  }

  try {
    const url = new URL(sanitized);

    // Check protocol
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Invalid URL protocol' };
    }

    // Check allowed hosts if specified
    if (allowedHosts && !allowedHosts.some((host) => url.hostname.includes(host))) {
      return { valid: false, error: 'URL host not allowed' };
    }

    return { valid: true, url: url.toString() };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate YouTube URL specifically
 */
export function validateYouTubeUrl(input: unknown): { valid: boolean; url?: string; error?: string } {
  return validateUrl(input, ['youtube.com', 'youtu.be']);
}

/**
 * Validate a number within range
 */
export function validateNumber(
  input: unknown,
  min: number,
  max: number,
  defaultValue?: number
): number | null {
  if (input === null || input === undefined) {
    return defaultValue ?? null;
  }

  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (typeof num !== 'number' || isNaN(num)) {
    return defaultValue ?? null;
  }

  // Clamp to range
  return Math.max(min, Math.min(max, num));
}

/**
 * Validate an ID (CUID format)
 */
export function validateId(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  // CUID format: starts with 'c', followed by alphanumeric, ~25 chars
  if (!/^c[a-z0-9]{20,30}$/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Check for potential injection patterns in any string
 */
export function containsInjection(input: string): boolean {
  const patterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\bunion\b.*\bselect\b/i,
    /\bselect\b.*\bfrom\b/i,
    /\binsert\b.*\binto\b/i,
    /\bdrop\b.*\btable\b/i,
    /\bdelete\b.*\bfrom\b/i,
    /\bexec\b\s*\(/i,
    /\beval\b\s*\(/i,
    /<!--/,
    /-->/,
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Deep sanitize an object (recursive)
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxDepth: number = 3
): T {
  if (maxDepth <= 0) {
    return {} as T;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip prototype pollution attempts
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    if (typeof value === 'string') {
      const clean = sanitizeString(value, MAX_STRING_LENGTH.notes);
      if (clean && !containsInjection(clean)) {
        sanitized[key] = clean;
      }
    } else if (typeof value === 'number') {
      if (!isNaN(value) && isFinite(value)) {
        sanitized[key] = value;
      }
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value
        .slice(0, 100) // Max 100 items
        .map((item) =>
          typeof item === 'object' && item !== null
            ? sanitizeObject(item as Record<string, unknown>, maxDepth - 1)
            : typeof item === 'string'
              ? sanitizeString(item, MAX_STRING_LENGTH.notes)
              : item
        )
        .filter((item) => item !== null);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, maxDepth - 1);
    }
  }

  return sanitized as T;
}
