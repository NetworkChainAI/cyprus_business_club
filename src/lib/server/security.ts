/**
 * Security utilities: rate limiting, file validation, password policy,
 * sanitization, and security headers.
 */

// ─── Rate Limiter (in-memory, per-IP) ────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Simple in-memory rate limiter.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 */
export function rateLimit(
  storeName: string,
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfter: number } {
  if (!stores.has(storeName)) stores.set(storeName, new Map());
  const store = stores.get(storeName)!;

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

/** Convenience: check rate limit and return a 429 Response if exceeded, or null if OK */
export function checkRateLimit(
  storeName: string,
  ip: string,
  maxRequests: number,
  windowMs: number
): Response | null {
  const result = rateLimit(storeName, ip, maxRequests, windowMs);
  if (!result.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Try again later." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfter),
        },
      }
    );
  }
  return null;
}

// Periodic cleanup every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const store of stores.values()) {
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref?.();

// ─── File Upload Validation ──────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const ALLOWED_CHAT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

/** Max file sizes in bytes */
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,     // 5 MB
  document: 20 * 1024 * 1024,  // 20 MB
  chat: 10 * 1024 * 1024,      // 10 MB
} as const;

export type FileCategory = "image" | "document" | "chat";

const TYPE_MAP: Record<FileCategory, Set<string>> = {
  image: ALLOWED_IMAGE_TYPES,
  document: ALLOWED_DOCUMENT_TYPES,
  chat: ALLOWED_CHAT_TYPES,
};

/**
 * Validate an uploaded file. Returns an error string or null if valid.
 */
export function validateFile(
  file: File,
  category: FileCategory
): string | null {
  const maxSize = MAX_FILE_SIZES[category];
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return `File too large. Maximum size is ${maxMB} MB.`;
  }

  const allowedTypes = TYPE_MAP[category];
  if (!allowedTypes.has(file.type)) {
    return `File type "${file.type}" is not allowed.`;
  }

  return null;
}

/**
 * Sanitize a filename — remove path separators and special chars.
 * Returns only the base name with safe characters.
 */
export function sanitizeFileName(name: string): string {
  // Take only the basename (remove any path components)
  const base = name.replace(/^.*[/\\]/, "");
  // Replace anything that isn't alphanumeric, dot, hyphen, or underscore
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200) || "file";
}

// ─── Password Policy ─────────────────────────────────────────────────────────

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password strength.
 * Requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 digit.
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one digit");
  }

  return { valid: errors.length === 0, errors };
}

// ─── Security Headers ────────────────────────────────────────────────────────

/**
 * Returns security headers to be added to responses.
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  };
}

// ─── Client IP Helper ────────────────────────────────────────────────────────

/**
 * Extract client IP from request, respecting common proxy headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
