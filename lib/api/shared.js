// lib/api/shared.js
// Shared API configurations, utilities, and error handling

// Cache configuration
export const CACHE_CONFIG = {
    home: 300, // 5 minutes
    product: 600, // 10 minutes
    productBundle: 300, // 5 minutes
    advancedSearch: 60, // 1 minute
};

// Request timeout configuration
export const TIMEOUT_CONFIG = {
    default: 10000, // 10 seconds
    client: 8000, // 8 seconds for client requests
    upload: 30000, // 30 seconds for file uploads
};

// Error types for better error handling
export const API_ERRORS = {
    TIMEOUT: 'TIMEOUT',
    NETWORK: 'NETWORK',
    NOT_FOUND: 'NOT_FOUND',
    SERVER_ERROR: 'SERVER_ERROR',
    INVALID_RESPONSE: 'INVALID_RESPONSE',
};

// Custom API Error class
export class APIError extends Error {
    constructor(message, type, status = null, details = null) {
        super(message);
        this.name = 'APIError';
        this.type = type;
        this.status = status;
        this.details = details;
    }
}

// Utility function to get language headers
export const getLangHeaders = (locale) => ({
    'langCode': locale === 'en' ? '2' : '1',
    'Accept-Language': locale === 'en' ? 'en-US' : 'ar-EG',
});

// Common request configuration builder
export const buildRequestConfig = (options = {}, isServer = false) => {
    const { timeout, headers = {}, ...fetchOptions } = options;
    
    const baseHeaders = {
        'Content-Type': 'application/json',
        ...headers,
    };

    if (isServer) {
        baseHeaders['User-Agent'] = 'NextJS-Server/1.0';
        baseHeaders['X-Client-Type'] = 'Web';
    }

    return {
        ...fetchOptions,
        headers: baseHeaders,
    };
};

// Error handling utility
export const handleAPIError = (error, url, attempt, maxRetries) => {
    console.error(`❌ API Error (attempt ${attempt}/${maxRetries}):`, { url, error: error.message });

    if (error.name === 'AbortError') {
        throw new APIError('Request timeout', API_ERRORS.TIMEOUT);
    }

    if (error.message === 'fetch failed') {
        throw new APIError(
            'Network error - Unable to connect to API',
            API_ERRORS.NETWORK
        );
    }

    return error;
};

// HTTP response handler
export const handleResponse = async (response, url) => {
    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        let errorType = API_ERRORS.SERVER_ERROR;

        try {
            const errorData = await response.text();
            errorMessage = `HTTP ${response.status}: ${errorData}`;
        } catch (e) {
            // Ignore error parsing response body
        }

        switch (response.status) {
            case 404:
                errorType = API_ERRORS.NOT_FOUND;
                break;
            case 408:
            case 504:
                errorType = API_ERRORS.TIMEOUT;
                break;
            default:
                if (response.status >= 500) {
                    errorType = API_ERRORS.SERVER_ERROR;
                }
        }

        throw new APIError(errorMessage, errorType, response.status);
    }

    const data = await response.json();
    console.log('✅ API Success:', { url, dataKeys: Object.keys(data || {}) });
    return data;
};

// Retry delay calculation
export const calculateRetryDelay = (attempt, maxDelay = 5000) => {
    return Math.min(1000 * Math.pow(2, attempt), maxDelay);
};

// Data validation and transformation utilities
export const validateProductData = (product) => {
    const errors = [];

    if (!product) {
        errors.push('Product data is null or undefined');
        return { isValid: false, errors };
    }

    if (!product.productId) errors.push('Missing productId');
    if (!product.name) errors.push('Missing product name');
    if (!product.colors || !Array.isArray(product.colors)) {
        errors.push('Missing or invalid colors array');
    } else if (product.colors.length === 0) {
        errors.push('Product has no color variants');
    }

    // Validate color data
    product.colors?.forEach((color, index) => {
        if (!color.colorId) errors.push(`Color ${index}: Missing colorId`);
        if (!color.name) errors.push(`Color ${index}: Missing color name`);
        if (!color.sizes || !Array.isArray(color.sizes)) {
            errors.push(`Color ${index}: Missing or invalid sizes array`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
};

// Format price with locale support
export const formatPrice = (price, locale = 'ar') => {
    if (typeof price !== 'number' || price < 0) return '0';

    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(price);
};

// Get available sizes for a color
export const getAvailableSizes = (color) => {
    if (!color?.sizes) return [];
    return color.sizes;
};

// Get best price (discount or regular)
export const getBestPrice = (size, color) => {
    const sizePrice = size?.discountPrice > 0 ? size.discountPrice : size?.salesPrice;
    const colorPrice = color?.discountPrice > 0 ? color.discountPrice : color?.salesPrice;
    return sizePrice || colorPrice || 0;
};

// Check if product/variant is in stock
export const isInStock = (size) => {
    return size && size.qty > 0 && size.salesPrice > 0;
};

// Generate product SEO data
export const generateProductSEO = (product, locale = 'ar') => {
    if (!product) return {};

    const title = `${product.name} | ${product.brand || ''}`.trim();
    const description = product.description
        ? product.description.replace(/<[^>]*>/g, '').substring(0, 160)
        : `${product.name} from ${product.brand || 'our store'}`;

    const images = product.colors?.[0]?.productImages || [];
    const primaryImage = images.find(img => img.isPrimary) || images[0];

    return {
        title,
        description,
        keywords: [
            product.name,
            product.brand,
            product.category,
            product.productTypeName,
            ...(product.colors?.map(c => c.name) || [])
        ].filter(Boolean).join(', '),
        openGraph: {
            title,
            description,
            type: 'website',
            images: primaryImage ? [{
                url: primaryImage.fileLink,
                width: 800,
                height: 600,
                alt: product.name
            }] : [],
            siteName: 'Lajolie',
        },
        jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            brand: product.brand,
            category: product.category,
            description,
            image: primaryImage?.fileLink,
            offers: {
                '@type': 'Offer',
                price: getBestPrice(product.colors?.[0]?.sizes?.[0], product.colors?.[0]),
                priceCurrency: 'EGP',
                availability: isInStock(product.colors?.[0]?.sizes?.[0])
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock'
            }
        }
    };
};