
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

class JsonApiClient {
    constructor(baseURL, timeout = 10000) {
        this.baseURL = baseURL;
        this.timeout = timeout;
        this.pendingRequests = new Map();
        this.requestQueue = new Map();
    }

    getRequestKey(endpoint, method) {
        return `${method}:${endpoint}`;
    }

    async request(endpoint, method = 'POST', extraHeaders = {}, retryCount = 0) {
        const requestKey = this.getRequestKey(endpoint, method);

        // Return existing pending request if duplicate
        if (this.pendingRequests.has(requestKey)) {
            return this.pendingRequests.get(requestKey);
        }

        const url = `${this.baseURL}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache',
            ...extraHeaders
        };

        const requestPromise = (async () => {
            try {
                const requestConfig = {
                    method,
                    headers,
                    signal: controller.signal,
                    credentials: 'include'
                };

                const response = await fetch(url, requestConfig);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({
                        message: 'Unknown error occurred'
                    }));

                    // Retry on server errors (500-599)
                    if (response.status >= 500 && retryCount < API_CONFIG.RETRY_ATTEMPTS) {
                        await this.delay(API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
                        return this.request(endpoint, method, extraHeaders, retryCount + 1);
                    }

                    throw new ApiError(
                        response.status,
                        errorData.message || errorData.errorMessage || 'Request failed',
                        errorData
                    );
                }

                const data = await response.json();
                return data;

            } catch (error) {
                clearTimeout(timeoutId);

                // Retry on timeout
                if (error.name === 'AbortError') {
                    if (retryCount < API_CONFIG.RETRY_ATTEMPTS) {
                        await this.delay(API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
                        return this.request(endpoint, method, extraHeaders, retryCount + 1);
                    }
                    throw new ApiError(408, ERROR_MESSAGES.TIMEOUT);
                }

                // Retry on network errors
                if (error.name === 'TypeError' && retryCount < API_CONFIG.RETRY_ATTEMPTS) {
                    await this.delay(API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
                    return this.request(endpoint, method, extraHeaders, retryCount + 1);
                }

                throw error;

            } finally {
                this.pendingRequests.delete(requestKey);
            }
        })();

        this.pendingRequests.set(requestKey, requestPromise);
        return requestPromise;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    cancelAll() {
        this.pendingRequests.clear();
    }
}

const jsonApiClient = new JsonApiClient(API_CONFIG.BASE_URL, API_CONFIG.TIMEOUT);

export class AuthService {
    // WARNING: API requires credentials in URL parameters (security risk)
    // This is a backend limitation - avoid this pattern in your own APIs
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

            // Sanitize inputs
            const cleanMobile = sanitizeInput(mobile);

            // Build URL with parameters (API constraint)
            const endpoint = `${API_CONFIG.ENDPOINTS.LOGIN}?mobile=${encodeURIComponent(cleanMobile)}&password=${encodeURIComponent(password)}`;

            const response = await jsonApiClient.request(
                endpoint,
                'POST',
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
                error: response.errorMessage || ERROR_MESSAGES.LOGIN_FAILED
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

            const cleanMobile = sanitizeInput(mobile);
            const endpoint = `${API_CONFIG.ENDPOINTS.SIGNUP}?mobile=${encodeURIComponent(cleanMobile)}`;

            const response = await jsonApiClient.request(
                endpoint,
                'POST',
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

    // Client-side OTP verification (API limitation - no server verification endpoint)
    // WARNING: This is insecure. OTP should be verified server-side.
    static verifyOtpClientSide(userOtp, enteredOtp) {
        try {
            // Validate OTP format
            if (!enteredOtp || enteredOtp.length !== 6) {
                return {
                    success: false,
                    error: ERROR_MESSAGES.INVALID_OTP_FORMAT
                };
            }

            if (!/^\d+$/.test(enteredOtp)) {
                return {
                    success: false,
                    error: ERROR_MESSAGES.INVALID_OTP_FORMAT
                };
            }

            // Compare OTPs
            if (String(userOtp).trim() === String(enteredOtp).trim()) {
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

            // Sanitize inputs
            const cleanFirstName = sanitizeInput(firstName);
            const cleanLastName = sanitizeInput(lastName);
            const cleanAddress = sanitizeInput(address);

            // Build endpoint with parameters
            const endpoint = `${API_CONFIG.ENDPOINTS.USER_DATA}?id=${encodeURIComponent(id)}&firstName=${encodeURIComponent(cleanFirstName)}&lastName=${encodeURIComponent(cleanLastName)}&address=${encodeURIComponent(cleanAddress)}&password=${encodeURIComponent(password)}`;

            const response = await jsonApiClient.request(
                endpoint,
                'POST',
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
                error: response.errorMessage || ERROR_MESSAGES.SAVE_FAILED
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
        // Handle validation errors
        if (error instanceof Error) {
            // Return validation messages directly
            if (Object.values(ERROR_MESSAGES).includes(error.message)) {
                return error.message;
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

            return errorMap[error.status] || ERROR_MESSAGES.UNEXPECTED_ERROR;
        }

        // Handle network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return ERROR_MESSAGES.NETWORK_ERROR;
        }

        return ERROR_MESSAGES.UNEXPECTED_ERROR;
    }

    // Utility to cancel all pending requests
    static cancelAllRequests() {
        jsonApiClient.cancelAll();
    }
}

export { ApiError, jsonApiClient };