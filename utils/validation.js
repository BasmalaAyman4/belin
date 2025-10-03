// utils/validation.js - SECURED VERSION
import DOMPurify from 'isomorphic-dompurify';
import { VALIDATION_RULES, ERROR_MESSAGES } from '@/config/api.config';

/**
 * XSS Protection: Sanitizes HTML and dangerous characters
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // First pass: DOMPurify to remove HTML and scripts
    let cleaned = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [], // No attributes allowed
        KEEP_CONTENT: true // Keep text content
    });

    // Second pass: Remove control characters and excessive whitespace
    cleaned = cleaned
        .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces
        .trim()
        .slice(0, VALIDATION_RULES.INPUT.MAX_LENGTH);

    return cleaned;
};

/**
 * Advanced XSS detection
 * @param {string} input - Input to check
 * @returns {boolean} - True if suspicious patterns found
 */
export const containsSuspiciousPatterns = (input) => {
    if (!input || typeof input !== 'string') {
        return false;
    }

    const suspiciousPatterns = [
        /<script[\s\S]*?>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // onclick, onerror, etc.
        /eval\s*\(/gi,
        /expression\s*\(/gi,
        /<iframe[\s\S]*?>/gi,
        /<object[\s\S]*?>/gi,
        /<embed[\s\S]*?>/gi,
        /<svg[\s\S]*?>/gi,
        /data:text\/html/gi,
        /vbscript:/gi,
        /<link[\s\S]*?>/gi,
        /<meta[\s\S]*?>/gi,
        /import\s+/gi,
        /document\./gi,
        /window\./gi,
        /__proto__/gi,
        /constructor/gi
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Validates Egyptian mobile phone numbers
 * @param {string} mobile - Phone number to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateMobile = (mobile) => {
    if (!mobile || typeof mobile !== 'string') {
        return ERROR_MESSAGES.INVALID_MOBILE;
    }

    // Sanitize first
    const sanitized = sanitizeInput(mobile);

    // Check for suspicious patterns
    if (containsSuspiciousPatterns(sanitized)) {
        return ERROR_MESSAGES.INVALID_MOBILE;
    }

    // Remove whitespace and common separators
    const cleanMobile = sanitized.replace(/[\s\-\(\)]/g, '');

    // Must be numeric only
    if (!/^\+?\d+$/.test(cleanMobile)) {
        return ERROR_MESSAGES.INVALID_MOBILE;
    }

    // Check length constraints
    if (cleanMobile.length < VALIDATION_RULES.MOBILE.MIN_LENGTH ||
        cleanMobile.length > VALIDATION_RULES.MOBILE.MAX_LENGTH) {
        return ERROR_MESSAGES.INVALID_MOBILE;
    }

    // Check against Egyptian mobile patterns
    const isValid = VALIDATION_RULES.MOBILE.PATTERNS.some(
        pattern => pattern.test(cleanMobile)
    );

    return isValid ? null : ERROR_MESSAGES.INVALID_MOBILE;
};

/**
 * Validates password strength with security checks
 * @param {string} password - Password to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        return ERROR_MESSAGES.INVALID_PASSWORD_LENGTH;
    }

    // Check for suspicious patterns (but don't sanitize passwords)
    if (containsSuspiciousPatterns(password)) {
        return 'كلمة المرور تحتوي على أحرف غير مسموحة';
    }

    const rules = VALIDATION_RULES.PASSWORD;

    if (password.length < rules.MIN_LENGTH) {
        return ERROR_MESSAGES.INVALID_PASSWORD_LENGTH;
    }

    if (password.length > rules.MAX_LENGTH) {
        return `كلمة المرور طويلة جداً (الحد الأقصى ${rules.MAX_LENGTH} حرف)`;
    }

    if (rules.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
        return 'كلمة المرور يجب أن تحتوي على حرف كبير';
    }

    if (rules.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
        return 'كلمة المرور يجب أن تحتوي على حرف صغير';
    }

    if (rules.REQUIRE_NUMBERS && !/\d/.test(password)) {
        return 'كلمة المرور يجب أن تحتوي على رقم';
    }

    if (rules.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return 'كلمة المرور يجب أن تحتوي على رمز خاص';
    }

    // Check for common weak passwords
    const weakPasswords = [
        '12345678', 'password', 'qwerty123', 'admin123',
        '11111111', 'password123', 'abc12345'
    ];

    if (weakPasswords.includes(password.toLowerCase())) {
        return 'كلمة المرور ضعيفة جداً';
    }

    return null;
};

/**
 * Validates OTP format with security checks
 * @param {string} otp - OTP to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateOtp = (otp) => {
    if (!otp || typeof otp !== 'string') {
        return ERROR_MESSAGES.INVALID_OTP_FORMAT;
    }

    // Sanitize
    const sanitized = sanitizeInput(otp);

    // Check for suspicious patterns
    if (containsSuspiciousPatterns(sanitized)) {
        return ERROR_MESSAGES.INVALID_OTP_FORMAT;
    }

    if (sanitized.length !== VALIDATION_RULES.OTP.LENGTH) {
        return ERROR_MESSAGES.INVALID_OTP_FORMAT;
    }

    if (!/^\d+$/.test(sanitized)) {
        return ERROR_MESSAGES.INVALID_OTP_FORMAT;
    }

    return null;
};

/**
 * Validates name fields with XSS protection
 * @param {string} name - Name to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateName = (name) => {
    if (!name || typeof name !== 'string') {
        return 'الاسم مطلوب';
    }

    // Sanitize first
    const sanitized = sanitizeInput(name);

    // Check for suspicious patterns
    if (containsSuspiciousPatterns(sanitized)) {
        return 'الاسم يحتوي على أحرف غير صالحة';
    }

    if (sanitized.length === 0) {
        return 'الاسم مطلوب';
    }

    if (sanitized.length > VALIDATION_RULES.INPUT.MAX_NAME_LENGTH) {
        return `الاسم طويل جداً (الحد الأقصى ${VALIDATION_RULES.INPUT.MAX_NAME_LENGTH} حرف)`;
    }

    // Allow Arabic and English letters, spaces, and common name characters only
    if (!/^[\u0600-\u06FFa-zA-Z\s\-'\.]+$/.test(sanitized)) {
        return 'الاسم يحتوي على أحرف غير صالحة';
    }

    // Check for SQL injection patterns
    const sqlPatterns = [
        /(\bor\b|\band\b).*[=<>]/gi,
        /union.*select/gi,
        /insert.*into/gi,
        /delete.*from/gi,
        /drop.*table/gi,
        /--;/gi,
        /\/\*/gi
    ];

    if (sqlPatterns.some(pattern => pattern.test(sanitized))) {
        return 'الاسم يحتوي على أحرف غير صالحة';
    }

    return null;
};

/**
 * Validates address with XSS protection
 * @param {string} address - Address to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateAddress = (address) => {
    if (!address || typeof address !== 'string') {
        return 'العنوان مطلوب';
    }

    const sanitized = sanitizeInput(address);

    if (containsSuspiciousPatterns(sanitized)) {
        return 'العنوان يحتوي على أحرف غير صالحة';
    }

    if (sanitized.length === 0) {
        return 'العنوان مطلوب';
    }

    if (sanitized.length > VALIDATION_RULES.INPUT.MAX_LENGTH) {
        return 'العنوان طويل جداً';
    }

    return null;
};

/**
 * Validates complete profile data
 * @param {Object} data - Profile data to validate
 * @returns {Object} - Object with isValid flag and errors object
 */
export const validateProfileData = (data) => {
    const errors = {};

    const firstNameError = validateName(data.firstName);
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = validateName(data.lastName);
    if (lastNameError) errors.lastName = lastNameError;

    const addressError = validateAddress(data.address);
    if (addressError) errors.address = addressError;

    const passwordError = validatePassword(data.password);
    if (passwordError) errors.password = passwordError;

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return 'البريد الإلكتروني مطلوب';
    }

    const sanitized = sanitizeInput(email);

    if (containsSuspiciousPatterns(sanitized)) {
        return 'البريد الإلكتروني غير صالح';
    }

    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(sanitized)) {
        return 'البريد الإلكتروني غير صالح';
    }

    if (sanitized.length > 254) {
        return 'البريد الإلكتروني طويل جداً';
    }

    return null;
};

/**
 * Validates language code
 * @param {string} langCode - Language code to validate
 * @returns {boolean} - True if valid
 */
export const validateLangCode = (langCode) => {
    return ['1', '2'].includes(langCode);
};

/**
 * Normalizes mobile number to standard format
 * @param {string} mobile - Mobile number to normalize
 * @returns {string} - Normalized mobile number
 */
export const normalizeMobile = (mobile) => {
    if (!mobile) return '';

    const sanitized = sanitizeInput(mobile);

    // Remove all non-digit characters
    let cleaned = sanitized.replace(/\D/g, '');

    // Remove leading +2 or 2 if present
    if (cleaned.startsWith('2') && cleaned.length > 11) {
        cleaned = cleaned.substring(1);
    }

    return cleaned;
};

/**
 * Sanitizes URL to prevent open redirect
 * @param {string} url - URL to sanitize
 * @param {string} baseUrl - Base URL to validate against
 * @returns {string} - Sanitized URL or base URL if invalid
 */
export const sanitizeUrl = (url, baseUrl = '/') => {
    if (!url || typeof url !== 'string') {
        return baseUrl;
    }

    const sanitized = sanitizeInput(url);

    // Block javascript: and data: protocols
    if (/^(javascript|data|vbscript):/i.test(sanitized)) {
        return baseUrl;
    }

    // Only allow relative URLs or same-origin URLs
    try {
        const parsed = new URL(sanitized, window.location.origin);

        // Only allow same origin
        if (parsed.origin !== window.location.origin) {
            return baseUrl;
        }

        return parsed.pathname + parsed.search + parsed.hash;
    } catch {
        // If URL parsing fails, return base URL
        return baseUrl;
    }
};

/**
 * Escapes HTML entities
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export const escapeHtml = (text) => {
    if (!text || typeof text !== 'string') {
        return '';
    }

    const htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };

    return text.replace(/[&<>"'\/]/g, (char) => htmlEntities[char]);
};

/**
 * Validates JSON string safely
 * @param {string} jsonString - JSON string to validate
 * @returns {Object|null} - Parsed object or null if invalid
 */
export const safeJsonParse = (jsonString) => {
    try {
        if (!jsonString || typeof jsonString !== 'string') {
            return null;
        }

        // Check for suspicious patterns
        if (containsSuspiciousPatterns(jsonString)) {
            return null;
        }

        const parsed = JSON.parse(jsonString);

        // Prevent prototype pollution
        if (parsed && typeof parsed === 'object') {
            delete parsed.__proto__;
            delete parsed.constructor;
            delete parsed.prototype;
        }

        return parsed;
    } catch {
        return null;
    }
};

/**
 * Debounce function for performance
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle function for rate limiting
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit = 300) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Export all validation functions
export default {
    sanitizeInput,
    containsSuspiciousPatterns,
    validateMobile,
    validatePassword,
    validateOtp,
    validateName,
    validateAddress,
    validateEmail,
    validateProfileData,
    validateLangCode,
    normalizeMobile,
    sanitizeUrl,
    escapeHtml,
    safeJsonParse,
    debounce,
    throttle
};