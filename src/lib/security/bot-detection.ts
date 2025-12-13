/**
 * Bot detection utilities
 * Detects automated requests and malicious patterns
 */

// Known malicious user agents (partial matches)
// Note: curl/ and wget/ are NOT blocked as they're commonly used for legitimate API testing
const BLOCKED_USER_AGENTS = [
  'sqlmap',        // SQL injection tool
  'nikto',         // Web scanner
  'nmap',          // Network scanner
  'masscan',       // Port scanner
  'zgrab',         // Go-based scanner
  'gobuster',      // Directory brute-forcer
  'dirbuster',     // Directory brute-forcer
  'wpscan',        // WordPress scanner
  'nuclei',        // Vulnerability scanner
  'hydra',         // Password cracker
  'libwww-perl',   // Perl LWP
  'scrapy',        // Python scraper
];

// Suspicious path patterns (regex)
const SUSPICIOUS_PATHS = [
  /\.env/i,                    // Environment files
  /\.git/i,                    // Git repository
  /\.svn/i,                    // SVN repository
  /\.htaccess/i,               // Apache config
  /wp-admin/i,                 // WordPress admin
  /wp-login/i,                 // WordPress login
  /wp-content/i,               // WordPress content
  /phpmyadmin/i,               // phpMyAdmin
  /adminer/i,                  // Adminer
  /\.php$/i,                   // PHP files
  /\.asp$/i,                   // ASP files
  /shell/i,                    // Shell scripts
  /admin\/.*\.(php|asp|jsp)/i, // Admin scripts
  /cgi-bin/i,                  // CGI scripts
  /\.sql$/i,                   // SQL files
  /backup/i,                   // Backup files
  /\.bak$/i,                   // Backup extension
  /\.old$/i,                   // Old files
  /\.orig$/i,                  // Original files
  /\/config\./i,               // Config files
  /\/\.well-known\/(?!acme-challenge)/, // Hidden paths except ACME
];

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
  /exec(\s|\+)+(s|x)p\w+/i,
  /union.*select/i,
  /select.*from/i,
  /insert.*into/i,
  /drop.*table/i,
  /delete.*from/i,
  /update.*set/i,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg.*onload/i,
  /expression\s*\(/i,
];

export interface BotDetectionResult {
  isBot: boolean;
  isMalicious: boolean;
  reason?: string;
  score: number; // 0-100, higher = more suspicious
}

/**
 * Analyze a request for bot/malicious patterns
 */
export function analyzeRequest(
  userAgent: string | null,
  path: string,
  queryString: string | null,
  method: string
): BotDetectionResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Check user agent
  const ua = (userAgent || '').toLowerCase();

  if (!userAgent || userAgent.length < 10) {
    score += 30;
    reasons.push('missing-or-short-ua');
  }

  for (const blocked of BLOCKED_USER_AGENTS) {
    if (ua.includes(blocked.toLowerCase())) {
      score += 50;
      reasons.push(`blocked-ua:${blocked}`);
      break;
    }
  }

  // 2. Check path for suspicious patterns
  for (const pattern of SUSPICIOUS_PATHS) {
    if (pattern.test(path)) {
      score += 40;
      reasons.push('suspicious-path');
      break;
    }
  }

  // 3. Check for SQL injection attempts
  const fullUrl = path + (queryString ? '?' + queryString : '');
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(fullUrl) || pattern.test(decodeURIComponent(fullUrl))) {
      score += 80;
      reasons.push('sql-injection-attempt');
      break;
    }
  }

  // 4. Check for XSS attempts
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(fullUrl) || pattern.test(decodeURIComponent(fullUrl))) {
      score += 70;
      reasons.push('xss-attempt');
      break;
    }
  }

  // 5. Check for path traversal
  if (path.includes('..') || path.includes('%2e%2e')) {
    score += 60;
    reasons.push('path-traversal');
  }

  // 6. Unusual HTTP methods on API
  if (['TRACE', 'TRACK', 'OPTIONS', 'CONNECT'].includes(method.toUpperCase())) {
    score += 20;
    reasons.push('unusual-method');
  }

  return {
    isBot: score >= 30,
    isMalicious: score >= 50,
    reason: reasons.length > 0 ? reasons.join(',') : undefined,
    score,
  };
}

/**
 * Check if request contains potential attack payloads
 */
export function containsAttackPayload(body: string): boolean {
  try {
    // Check SQL injection
    for (const pattern of SQL_INJECTION_PATTERNS) {
      if (pattern.test(body)) return true;
    }

    // Check XSS
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(body)) return true;
    }

    return false;
  } catch {
    return false;
  }
}
