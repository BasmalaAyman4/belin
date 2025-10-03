// lib/api/server.js
// Server-side API functions for Next.js server components and API routes

import { endpoints } from '@/lib/api/endpoints';
import {
    CACHE_CONFIG,
    TIMEOUT_CONFIG,
    API_ERRORS,
    APIError,
    getLangHeaders,
    buildRequestConfig,
    handleAPIError,
    handleResponse,
    calculateRetryDelay,
    validateProductData
} from './shared';

// Enhanced server request function with better error handling and performance
const serverRequest = async (url, options = {}) => {
    const { timeout = TIMEOUT_CONFIG.default, retries = 1, ...fetchOptions } = options;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    const config = {
        signal: controller.signal,
        ...buildRequestConfig(fetchOptions, true)
    };

    let lastError;

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            console.log(`🔍 Server API Request (attempt ${attempt + 1}/${retries + 1}):`, url);

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            const data = await handleResponse(response, url);
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            lastError = handleAPIError(error, url, attempt + 1, retries + 1);

            // Don't retry for certain error types
            if (error instanceof APIError && error.type === API_ERRORS.NOT_FOUND) {
                throw error; // Don't retry 404s
            }

            // If this is the last attempt, throw the error
            if (attempt === retries) {
                throw lastError instanceof APIError ? lastError : new APIError(
                    lastError.message || 'Unknown error',
                    API_ERRORS.SERVER_ERROR
                );
            }

            // Wait before retry (exponential backoff)
            const delay = calculateRetryDelay(attempt);
            console.log(`⏳ Server retry in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Enhanced GET request with caching for server components
export const serverGet = (url, options = {}) => {
    const { cacheTime, ...restOptions } = options;

    return serverRequest(url, {
        method: 'GET',
        next: {
            revalidate: cacheTime || CACHE_CONFIG.default,
            tags: [url] // For revalidation
        },
        ...restOptions
    });
};

// Server POST request
export const serverPost = (url, body, options = {}) => serverRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    timeout: TIMEOUT_CONFIG.upload,
    ...options
});

// Server PUT request
export const serverPut = (url, body, options = {}) => serverRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options
});

// Server DELETE request
export const serverDelete = (url, options = {}) => serverRequest(url, {
    method: 'DELETE',
    ...options
});

// API functions with optimized caching and error handling
export const serverGetHome = (locale) => {
    const langCode = locale === 'en' ? '2' : '1';
    return serverGet(endpoints.home, {
        headers: {
            'langCode': langCode,
        },
        cacheTime: CACHE_CONFIG.home,
    });
};

export const serverGetProductBundle = (locale) => {
    const langCode = locale === 'en' ? '2' : '1';
    return serverGet(endpoints.productBundle, {
        headers: {
            'langCode': langCode,
        },
        cacheTime: CACHE_CONFIG.productBundle,
    });
};

export const serverGetAdvancedSearch = async (locale, filters = {}) => {
    try {
        const searchParams = new URLSearchParams(filters);
        const url = `${endpoints.advancedSearch}${searchParams.toString() ? `?${searchParams}` : ''}`;

        return await serverGet(url, {
            headers: getLangHeaders(locale),
            cacheTime: CACHE_CONFIG.advancedSearch,
        });
    } catch (error) {
        console.error('❌ Failed to fetch search results:', error);
        throw error;
    }
};

export const serverGetProductById = async (id, locale) => {
    if (!id || isNaN(Number(id))) {
        throw new APIError('Invalid product ID', API_ERRORS.INVALID_RESPONSE);
    }

    try {
        const data = await serverGet(endpoints.productById(id), {
            headers: getLangHeaders(locale),
            cacheTime: CACHE_CONFIG.product,
        });

        // Validate product data structure
        if (!data || typeof data !== 'object') {
            throw new APIError('Invalid product data received', API_ERRORS.INVALID_RESPONSE);
        }

        // Ensure required fields exist
        if (!data.productId || !data.name) {
            throw new APIError('Product data is incomplete', API_ERRORS.INVALID_RESPONSE);
        }

        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        console.error(`❌ Failed to fetch product ${id}:`, error);
        throw new APIError('Failed to fetch product details', API_ERRORS.SERVER_ERROR);
    }
};