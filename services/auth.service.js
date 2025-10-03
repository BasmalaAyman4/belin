// services/auth.service.js - SECURED VERSION
import DOMPurify from 'isomorphic-dompurify';
import { API_CONFIG, ERROR_MESSAGES } from '@/config/api.config';
import { validateMobile, sanitizeInput, validatePassword } from '@/utils/validation';

class ApiError extends Error {
    constructor(status, message, details = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

// Request deduplication cache
const requestCache = new Map();
const CACHE_TTL = 5000; // 5 seconds

class JsonApiClient {
    constructor(baseURL, timeout = 10000) {
        this.baseURL = baseURL;
        this.timeout = timeout;
        this.pendingRequests = new Map();
    }

    // Generate cache key for request deduplication
    getCacheKey(endpoint, method, body = null) {
        const bodyKey = body ? JSON.stringify(body) : '';
        return `${method}:${endpoint}:${bodyKey}`;
    }

    // Check if we have a recent cached response
    getCachedResponse(cacheKey) {
        const cached = requestCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.response;
        }
        requestCache.delete(cacheKey);
        return null;
    }

    // Store response in cache
    setCachedResponse(cacheKey, response) {
        requestCache.set(cacheKey, {
            response,
            timestamp: Date.now()
        });

        // Clean old cache entries
        if (requestCache.size > 100) {
            const firstKey = requestCache.keys().next().value;
            requestCache.delete(firstKey);
        }
    }

    async request(endpoint, method = 'POST', body = null, extraHeaders = {}, retryCount = 0) {
        const cacheKey = this.getCacheKey(endpoint, method, body);

        // Check cache for GET requests
        if (method === 'GET') {
            const cached = this.getCachedResponse(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Prevent duplicate requests
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }

        const url = `${this.baseURL}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        // Security headers
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Content-Type-Options': 'nosniff',
            ...extraHeaders
        };

        const requestPromise = (async () => {
            try {
                const requestConfig = {
                    method,
                    headers,
                    signal: controller.signal,
                    credentials: 'include',
                    mode: 'cors'
                };

                // Add body for POST/PUT/PATCH
                if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                    requestConfig.body = JSON.stringify(body);
                }

                // Only log in development
                if (process.env.NODE_ENV === 'development') {
                    console.log(`🔒 API Request:`, { method, endpoint });
                }

                const response = await fetch(url, requestConfig);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({
                        message: 'Unknown error occurred'
                    }));

                    // Retry on server errors (500-599)
                    if (response.status >= 500 && retryCount < API_CONFIG.RETRY_ATTEMPTS) {
                        await this.delay(API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
                        return this.request(endpoint, method, body, extraHeaders, retryCount + 1);
                    }

                    throw new ApiError(
                        response.status,
                        errorData.message || errorData.errorMessage || 'Request failed',
                        errorData
                    );
                }

                const data = await response.json();

                // Cache successful GET requests
                if (method === 'GET') {
                    this.setCachedResponse(cacheKey, data);
                }

                return data;

            } catch (error) {
                clearTimeout(timeoutId);

                // Retry on timeout
                if (error.name === 'AbortError') {
                    if (retryCount < API_CONFIG.RETRY_ATTEMPTS) {
                        await this.delay(API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
                        return this.request(endpoint, method, body, extraHeaders, retryCount + 1);
                    }
                    throw new ApiError(408, ERROR_MESSAGES.TIMEOUT);
                }

                // Retry on network errors
                if (error.name === 'TypeError' && retryCount < API_CONFIG.RETRY_ATTEMPTS) {
                    await this.delay(API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
                    return this.request(endpoint, method, body, extraHeaders, retryCount + 1);
                }

                throw error;

            } finally {
                this.pendingRequests.delete(cacheKey);
            }
        })();

        this.pendingRequests.set(cacheKey, requestPromise);
        return requestPromise;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    cancelAll() {
        this.pendingRequests.clear();
        requestCache.clear();
    }
}

const jsonApiClient = new JsonApiClient(API_CONFIG.BASE_URL, API_CONFIG.TIMEOUT);

export class AuthService {
    // ⚠️ CRITICAL SECURITY ISSUE: This method is inherently insecure
    // TODO: Backend must be updated to accept credentials in request body
    static async loginWithPassword(mobile, password, langCode = '1') {
        try {
            // Client-side validation
            const mobileError = validateMobile(mobile);
            if (mobileError) {
                throw new Error(mobileError);
            }

            const passwordError = validatePassword(password);
            if (passwordError) {
                throw new Error(passwordError);
            }

            // Sanitize and escape inputs
            const cleanMobile = DOMPurify.sanitize(sanitizeInput(mobile));
            const cleanPassword = DOMPurify.sanitize(password);

            // ⚠️ SECURITY WARNING: Sending credentials in URL is dangerous
            // This should be changed to POST body once backend is updated
            const endpoint = `${API_CONFIG.ENDPOINTS.LOGIN}?mobile=${encodeURIComponent(cleanMobile)}&password=${encodeURIComponent(cleanPassword)}`;

            const response = await jsonApiClient.request(
                endpoint,
                'POST',
                null,
                { 'langCode': langCode }
            );

            if (response.success) {
                return {
                    success: true,
                    user: response,
                    error: null
                };
            }

            return {
                success: false,
                user: null,
                error: DOMPurify.sanitize(response.errorMessage) || ERROR_MESSAGES.LOGIN_FAILED
            };

        } catch (error) {
            return {
                success: false,
                user: null,
                error: this.handleError(error)
            };
        }
    }

    static async loginWithOtp(mobile, langCode = '1') {
        try {
            const mobileError = validateMobile(mobile);
            if (mobileError) {
                throw new Error(mobileError);
            }

            const cleanMobile = DOMPurify.sanitize(sanitizeInput(mobile));
            const endpoint = `${API_CONFIG.ENDPOINTS.SIGNUP}?mobile=${encodeURIComponent(cleanMobile)}`;

            const response = await jsonApiClient.request(
                endpoint,
                'POST',
                null,
                { 'langCode': langCode }
            );

            return {
                success: true,
                user: response,
                error: null
            };

        } catch (error) {
            return {
                success: false,
                user: null,
                error: this.handleError(error)
            };
        }
    }

    // ⚠️ CRITICAL SECURITY ISSUE: Client-side OTP verification
    // TODO: This MUST be moved to backend - anyone can bypass this
    static verifyOtpClientSide(userOtp, enteredOtp) {
        try {
            // Sanitize inputs
            const cleanUserOtp = DOMPurify.sanitize(String(userOtp).trim());
            const cleanEnteredOtp = DOMPurify.sanitize(String(enteredOtp).trim());

            // Validate OTP format
            if (!cleanEnteredOtp || cleanEnteredOtp.length !== 6) {
                return {
                    success: false,
                    error: ERROR_MESSAGES.INVALID_OTP_FORMAT
                };
            }

            if (!/^\d+$/.test(cleanEnteredOtp)) {
                return {
                    success: false,
                    error: ERROR_MESSAGES.INVALID_OTP_FORMAT
                };
            }

            // Compare OTPs (THIS IS INSECURE - BACKEND SHOULD DO THIS)
            if (cleanUserOtp === cleanEnteredOtp) {
                return {
                    success: true,
                    message: ERROR_MESSAGES.OTP_SUCCESS
                };
            }

            return {
                success: false,
                error: ERROR_MESSAGES.INVALID_OTP
            };

        } catch (error) {
            return {
                success: false,
                error: ERROR_MESSAGES.OTP_VERIFICATION_FAILED
            };
        }
    }

    static async setPersonalInfo(id, personalData, langCode = '1') {
        try {
            if (!id) {
                throw new Error(ERROR_MESSAGES.MISSING_ID);
            }

            const { firstName, lastName, address, password } = personalData;

            // Validate all fields
            if (!firstName?.trim() || !lastName?.trim() || !address?.trim() || !password?.trim()) {
                throw new Error(ERROR_MESSAGES.ALL_FIELDS_REQUIRED);
            }

            const passwordError = validatePassword(password);
            if (passwordError) {
                throw new Error(passwordError);
            }

            // Sanitize inputs with DOMPurify
            const cleanFirstName = DOMPurify.sanitize(sanitizeInput(firstName));
            const cleanLastName = DOMPurify.sanitize(sanitizeInput(lastName));
            const cleanAddress = DOMPurify.sanitize(sanitizeInput(address));
            const cleanPassword = DOMPurify.sanitize(password);

            // Build endpoint
            const endpoint = `${API_CONFIG.ENDPOINTS.USER_DATA}?id=${encodeURIComponent(id)}&firstName=${encodeURIComponent(cleanFirstName)}&lastName=${encodeURIComponent(cleanLastName)}&address=${encodeURIComponent(cleanAddress)}&password=${encodeURIComponent(cleanPassword)}`;

            const response = await jsonApiClient.request(
                endpoint,
                'POST',
                null,
                { 'langCode': langCode }
            );

            if (response.success) {
                return {
                    success: true,
                    data: response,
                    error: null
                };
            }

            return {
                success: false,
                data: null,
                error: DOMPurify.sanitize(response.errorMessage) || ERROR_MESSAGES.SAVE_FAILED
            };

        } catch (error) {
            return {
                success: false,
                data: null,
                error: this.handleError(error)
            };
        }
    }

    static handleError(error) {
        // Sanitize error messages to prevent XSS
        const sanitizeError = (msg) => DOMPurify.sanitize(String(msg));

        // Handle validation errors
        if (error instanceof Error) {
            if (Object.values(ERROR_MESSAGES).includes(error.message)) {
                return sanitizeError(error.message);
            }
        }

        // Handle API errors
        if (error instanceof ApiError) {
            const errorMap = {
                400: ERROR_MESSAGES.INVALID_DATA,
                401: ERROR_MESSAGES.INVALID_CREDENTIALS,
                403: ERROR_MESSAGES.FORBIDDEN,
                404: ERROR_MESSAGES.NOT_FOUND,
                408: ERROR_MESSAGES.TIMEOUT,
                422: ERROR_MESSAGES.INVALID_DATA,
                429: ERROR_MESSAGES.RATE_LIMIT,
                500: ERROR_MESSAGES.SERVER_ERROR,
                502: ERROR_MESSAGES.SERVER_ERROR,
                503: ERROR_MESSAGES.SERVER_ERROR,
                504: ERROR_MESSAGES.TIMEOUT
            };

            return sanitizeError(errorMap[error.status] || ERROR_MESSAGES.UNEXPECTED_ERROR);
        }

        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }

        // Only log in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Auth Service Error:', error);
        }

        return ERROR_MESSAGES.UNEXPECTED_ERROR;
    }

    // Utility to cancel all pending requests
    static cancelAllRequests() {
        jsonApiClient.cancelAll();
    }
}

export { ApiError, jsonApiClient };