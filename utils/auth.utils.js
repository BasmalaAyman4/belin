














































// utils/auth.utils.js
'use client';

import { signOut } from 'next-auth/react';

/**
 * Safely logout user and redirect
 */
export const logout = async (redirectTo = '/') => {
    try {
        await signOut({
            callbackUrl: redirectTo,
            redirect: true
        });
    } catch (error) {
        console.error('Logout failed:', error);
        // Fallback to manual redirect
        window.location.href = redirectTo;
    }
};

/**
 * Check if user session is valid
 */
export const isSessionValid = (session) => {
    if (!session || !session.user) {
        return false;
    }

    // Check token expiration if available
    if (session.tokenExpiresAt) {
        return Date.now() < session.tokenExpiresAt;
    }

    return true;
};

// utils/performance.utils.js

/**
 * Debounce function for performance optimization
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

/**
 * Create in-memory cache with size limit
 */
export const createMemoryCache = (maxSize = 100) => {
    const cache = new Map();

    return {
        get: (key) => {
            const item = cache.get(key);
            if (!item) return undefined;

            // Check expiration if set
            if (item.expiresAt && Date.now() > item.expiresAt) {
                cache.delete(key);
                return undefined;
            }

            return item.value;
        },

        set: (key, value, ttl = null) => {
            // Evict oldest item if cache is full
            if (cache.size >= maxSize) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }

            cache.set(key, {
                value,
                expiresAt: ttl ? Date.now() + ttl : null
            });
        },

        has: (key) => {
            const item = cache.get(key);
            if (!item) return false;

            if (item.expiresAt && Date.now() > item.expiresAt) {
                cache.delete(key);
                return false;
            }

            return true;
        },

        delete: (key) => cache.delete(key),
        clear: () => cache.clear(),
        size: () => cache.size,
    };
};

/**
 * Format price with locale
 */
const priceFormatters = new Map();

export const formatPrice = (price, locale = 'en') => {
    if (!priceFormatters.has(locale)) {
        priceFormatters.set(locale, new Intl.NumberFormat(
            locale === 'en' ? 'en-US' : 'ar-EG',
            {
                style: 'currency',
                currency: 'EGP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }
        ));
    }

    return priceFormatters.get(locale).format(price);
};

// utils/form.utils.js

/**
 * Get form data as object
 */
export const getFormData = (form) => {
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
        // Handle multiple values for same key
        if (data[key]) {
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }

    return data;
};

/**
 * Reset form with animation
 */
export const resetForm = (form) => {
    if (form && form.reset) {
        form.reset();
    }
};

/**
 * Focus first error field in form
 */
export const focusFirstError = (formRef) => {
    if (!formRef.current) return;

    const firstError = formRef.current.querySelector('[aria-invalid="true"]') ||
        formRef.current.querySelector('.error') ||
        formRef.current.querySelector('[data-error]');

    if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
};

// utils/storage.utils.js (Server-side safe storage)

/**
 * Safe localStorage wrapper (checks if available)
 */
export const storage = {
    isAvailable: () => {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    get: (key, defaultValue = null) => {
        if (!storage.isAvailable()) return defaultValue;

        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    set: (key, value) => {
        if (!storage.isAvailable()) return false;

        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    remove: (key) => {
        if (!storage.isAvailable()) return false;

        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    clear: () => {
        if (!storage.isAvailable()) return false;

        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

// utils/error.utils.js

/**
 * Format error for display
 */
export const formatError = (error) => {
    if (typeof error === 'string') {
        return error;
    }

    if (error?.message) {
        return error.message;
    }

    if (error?.error) {
        return error.error;
    }

    return 'حدث خطأ غير متوقع';
};

/**
 * Log error safely
 */
export const logError = (error, context = '') => {
    if (process.env.NODE_ENV === 'development') {
        console.error(`[${context}]`, error);
    }

    // In production, you might want to send to error tracking service
    // Example: Sentry.captureException(error, { extra: { context } });
};

/**
 * Check if error is network error
 */
export const isNetworkError = (error) => {
    return (
        error?.name === 'TypeError' ||
        error?.message?.includes('fetch') ||
        error?.message?.includes('network')
    );
};

/**
 * Check if error is timeout error
 */
export const isTimeoutError = (error) => {
    return (
        error?.name === 'AbortError' ||
        error?.status === 408 ||
        error?.message?.includes('timeout')
    );
};




















































