// lib/api/client.js
// Client-side API functions for React components and browser-side operations

import {
    TIMEOUT_CONFIG,
    API_ERRORS,
    APIError,
    buildRequestConfig,
    handleAPIError,
    handleResponse,
    calculateRetryDelay
} from './shared';

// Client-side request function with retry logic
const clientRequest = async (url, options = {}) => {
    const { timeout = TIMEOUT_CONFIG.client, retries = 2, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const config = {
        signal: controller.signal,
        ...buildRequestConfig(fetchOptions, false)
    };

    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            console.log(`🔍 Client API Request (attempt ${attempt + 1}/${retries + 1}):`, url);

            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            const data = await handleResponse(response, url);
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            lastError = handleAPIError(error, url, attempt + 1, retries + 1);

            // If this is the last attempt, throw the error
            if (attempt === retries) {
                throw lastError instanceof APIError ? lastError : new APIError(
                    'Request failed',
                    API_ERRORS.NETWORK
                );
            }

            // Wait before retry (exponential backoff)
            const delay = calculateRetryDelay(attempt, 3000); // Shorter max delay for client
            console.log(`⏳ Client retry in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Client-side GET request
export const clientGet = (url, options = {}) => clientRequest(url, {
    method: 'GET',
    ...options
});

// Client-side POST request
export const clientPost = (url, body, options = {}) => clientRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options
});

// Client-side PUT request
export const clientPut = (url, body, options = {}) => clientRequest(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options
});

// Client-side DELETE request
export const clientDelete = (url, options = {}) => clientRequest(url, {
    method: 'DELETE',
    ...options
});

// Client-side PATCH request
export const clientPatch = (url, body, options = {}) => clientRequest(url, {
    method: 'PATCH',
    body: JSON.stringify(body),
    ...options
});

// File upload helper for client-side
export const clientUpload = async (url, formData, options = {}) => {
    const { timeout = TIMEOUT_CONFIG.upload, onProgress, ...restOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Don't set Content-Type for FormData, let browser set it with boundary
    const config = {
        signal: controller.signal,
        method: 'POST',
        body: formData,
        ...restOptions
    };

    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        return await handleResponse(response, url);
    } catch (error) {
        clearTimeout(timeoutId);
        throw handleAPIError(error, url, 1, 1);
    }
};

// Client-side request with authentication token
export const clientAuthRequest = (url, token, options = {}) => {
    return clientRequest(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
};

// Authenticated GET request
export const clientAuthGet = (url, token, options = {}) => clientAuthRequest(url, token, {
    method: 'GET',
    ...options
});

// Authenticated POST request
export const clientAuthPost = (url, body, token, options = {}) => clientAuthRequest(url, token, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options
});

// Authenticated PUT request
export const clientAuthPut = (url, body, token, options = {}) => clientAuthRequest(url, token, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options
});

// Authenticated DELETE request
export const clientAuthDelete = (url, token, options = {}) => clientAuthRequest(url, token, {
    method: 'DELETE',
    ...options
});