/*
// config/api.config.js
export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beneshtyapi.geniussystemapi.com/api',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,

    ENDPOINTS: {
        LOGIN: '/Auth/LogInBack',
        SIGNUP: '/Auth/logInWithOTP',
        USER_DATA: '/Auth/completeDataWithOTP',
        VERIFY_TOKEN: '/Auth/verify',
        LOGOUT: '/Auth/logout',
        REFRESH_TOKEN: '/Auth/refresh'
    },

    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
};

// Simplified security config - removed unused sections
export const SECURITY_CONFIG = {
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
    },

    SESSION: {
        MAX_AGE: 24 * 60 * 60,
        UPDATE_AGE: 2 * 60 * 60,
    },

    TOKEN: {
        ACCESS_TOKEN_EXPIRY: 24 * 60 * 60 * 1000,
        REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000,
        OTP_EXPIRY: 10 * 60 * 1000,
        OTP_LENGTH: 6,
    },

    RATE_LIMITS: {
        AUTH: {
            WINDOW: 15 * 60 * 1000,
            MAX_ATTEMPTS: 10,
        },
        API: {
            WINDOW: 60 * 1000,
            MAX_REQUESTS: 100,
        },
        GENERAL: {
            WINDOW: 60 * 1000,
            MAX_REQUESTS: 200,
        },
    },

    VALIDATION: {
        MAX_INPUT_LENGTH: 1000,
        MAX_FILE_SIZE: 10 * 1024 * 1024,
    }
};

export default { API_CONFIG, SECURITY_CONFIG }; */

// config/api.config.js

// Language codes
export const LANG_CODES = {
    ARABIC: '1',
    ENGLISH: '2'
};

export const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://beneshtyapi.geniussystemapi.com/api',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,

    ENDPOINTS: {
        LOGIN: '/Auth/LogInBack',
        SIGNUP: '/Auth/logInWithOTP',
        USER_DATA: '/Auth/completeDataWithOTP',
        VERIFY_TOKEN: '/Auth/verify',
        LOGOUT: '/Auth/logout',
        REFRESH_TOKEN: '/Auth/refresh'
    },

    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
};

// Validation constants
export const VALIDATION_RULES = {
    PASSWORD: {
        MIN_LENGTH: 8,
        MAX_LENGTH: 128,
        REQUIRE_UPPERCASE: false, // Set based on your requirements
        REQUIRE_LOWERCASE: false,
        REQUIRE_NUMBERS: false,
        REQUIRE_SPECIAL: false
    },
    MOBILE: {
        MIN_LENGTH: 11,
        MAX_LENGTH: 15,
        PATTERNS: [
            /^(\+2)?010[0-9]{8}$/, // Vodafone
            /^(\+2)?011[0-9]{8}$/, // Etisalat
            /^(\+2)?012[0-9]{8}$/, // Orange
            /^(\+2)?015[0-9]{8}$/  // We
        ]
    },
    OTP: {
        LENGTH: 6,
        EXPIRY_MS: 10 * 60 * 1000 // 10 minutes
    },
    INPUT: {
        MAX_LENGTH: 1000,
        MAX_NAME_LENGTH: 100
    }
};

// Session configuration
export const SESSION_CONFIG = {
    MAX_AGE: 24 * 60 * 60, // 24 hours in seconds
    UPDATE_AGE: 2 * 60 * 60, // 2 hours
    TOKEN_EXPIRY_MS: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
    AUTH: {
        WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        MAX_ATTEMPTS: 10
    },
    API: {
        WINDOW_MS: 60 * 1000, // 1 minute
        MAX_REQUESTS: 100
    },
    GENERAL: {
        WINDOW_MS: 60 * 1000,
        MAX_REQUESTS: 200
    }
};

// Error messages (centralized for easy translation)
export const ERROR_MESSAGES = {
    // Validation errors
    INVALID_MOBILE: 'رقم الهاتف غير صحيح',
    INVALID_PASSWORD_LENGTH: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    INVALID_OTP_FORMAT: 'كود التحقق يجب أن يكون 6 أرقام',
    INVALID_OTP: 'كود التحقق غير صحيح',
    MISSING_ID: 'رمز المصادقة مفقود',
    ALL_FIELDS_REQUIRED: 'جميع الحقول مطلوبة',

    // API errors
    INVALID_DATA: 'بيانات غير صحيحة',
    INVALID_CREDENTIALS: 'رقم الهاتف أو كلمة المرور غير صحيحة',
    FORBIDDEN: 'غير مسموح بهذا الإجراء',
    NOT_FOUND: 'المورد غير موجود',
    TIMEOUT: 'انتهت مهلة الطلب، حاول مرة أخرى',
    RATE_LIMIT: 'تم تجاوز الحد المسموح، حاول لاحقاً',
    SERVER_ERROR: 'خطأ في الخادم، حاول مرة أخرى',

    // Network errors
    NETWORK_ERROR: 'خطأ في الشبكة، تحقق من اتصالك بالإنترنت',
    UNEXPECTED_ERROR: 'حدث خطأ غير متوقع',

    // Success messages
    OTP_SUCCESS: 'تم التحقق بنجاح',
    OTP_SENT: 'تم إرسال كود التحقق',
    PROFILE_SAVED: 'تم حفظ البيانات بنجاح',

    // Auth specific
    LOGIN_FAILED: 'فشل في تسجيل الدخول',
    OTP_VERIFICATION_FAILED: 'حدث خطأ في التحقق',
    SAVE_FAILED: 'حدث خطأ في حفظ البيانات',
    REQUEST_IN_PROGRESS: 'طلب قيد التنفيذ'
};

// Security headers configuration
export const SECURITY_HEADERS = {
    PRODUCTION: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-XSS-Protection': '1; mode=block',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://beneshtyapi.geniussystemapi.com;"
    },
    DEVELOPMENT: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-XSS-Protection': '1; mode=block',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
};

export default {
    API_CONFIG,
    VALIDATION_RULES,
    SESSION_CONFIG,
    RATE_LIMIT_CONFIG,
    ERROR_MESSAGES,
    SECURITY_HEADERS,
    LANG_CODES
}