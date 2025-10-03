// utils/validation.js
import { VALIDATION_RULES, ERROR_MESSAGES } from '@/config/api.config';

/**
 * Validates Egyptian mobile phone numbers
 * @param {string} mobile - Phone number to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateMobile = (mobile) => {
    if (!mobile || typeof mobile !== 'string') {
        return ERROR_MESSAGES.INVALID_MOBILE;
    }

    // Remove whitespace and common separators
    const cleanMobile = mobile.replace(/[\s\-\(\)]/g, '');

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
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validatePassword = (password) => {
    if (!password || typeof password !== 'string') {
        return ERROR_MESSAGES.INVALID_PASSWORD_LENGTH;
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

    return null;
};

/**
 * Validates OTP format
 * @param {string} otp - OTP to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateOtp = (otp) => {
    if (!otp || typeof otp !== 'string') {
        return ERROR_MESSAGES.INVALID_OTP_FORMAT;
    }

    if (otp.length !== VALIDATION_RULES.OTP.LENGTH) {
        return ERROR_MESSAGES.INVALID_OTP_FORMAT;
    }

    if (!/^\d+$/.test(otp)) {
        return ERROR_MESSAGES.INVALID_OTP_FORMAT;
    }

    return null;
};

/**
 * Validates name fields (first name, last name)
 * @param {string} name - Name to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateName = (name) => {
    if (!name || typeof name !== 'string') {
        return 'الاسم مطلوب';
    }

    const trimmedName = name.trim();

    if (trimmedName.length === 0) {
        return 'الاسم مطلوب';
    }

    if (trimmedName.length > VALIDATION_RULES.INPUT.MAX_NAME_LENGTH) {
        return `الاسم طويل جداً (الحد الأقصى ${VALIDATION_RULES.INPUT.MAX_NAME_LENGTH} حرف)`;
    }

    // Allow Arabic and English letters, spaces, and common name characters
    if (!/^[\u0600-\u06FFa-zA-Z\s\-'\.]+$/.test(trimmedName)) {
        return 'الاسم يحتوي على أحرف غير صالحة';
    }

    return null;
};

/**
 * Sanitizes user input to prevent XSS and injection attacks
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        .trim()
        // Remove HTML tags and dangerous characters
        .replace(/[<>"'`]/g, '')
        // Remove control characters
        .replace(/[\x00-\x1f\x7f]/g, '')
        // Limit length
        .slice(0, VALIDATION_RULES.INPUT.MAX_LENGTH);
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

    if (!data.address || !data.address.trim()) {
        errors.address = 'العنوان مطلوب';
    } else if (data.address.trim().length > VALIDATION_RULES.INPUT.MAX_LENGTH) {
        errors.address = 'العنوان طويل جداً';
    }

    const passwordError = validatePassword(data.password);
    if (passwordError) errors.password = passwordError;

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Debounce function for input validation
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
 * Checks if input contains potentially malicious patterns
 * @param {string} input - Input to check
 * @returns {boolean} - True if suspicious
 */
export const containsSuspiciousPatterns = (input) => {
    if (!input || typeof input !== 'string') {
        return false;
    }

    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i, // Event handlers like onclick=
        /eval\(/i,
        /expression\(/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Normalizes mobile number to standard format
 * @param {string} mobile - Mobile number to normalize
 * @returns {string} - Normalized mobile number
 */
export const normalizeMobile = (mobile) => {
    if (!mobile) return '';

    // Remove all non-digit characters
    let cleaned = mobile.replace(/\D/g, '');

    // Remove leading +2 or 2 if present
    if (cleaned.startsWith('2') && cleaned.length > 11) {
        cleaned = cleaned.substring(1);
    }

    return cleaned;
};