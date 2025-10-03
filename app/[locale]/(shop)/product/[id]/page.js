import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ProductDetailsClient from '@/components/shop/ProductDetails/ProductDetailsClient';
import ProductSkeleton from '@/components/ui/ProductSkeleton';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

// Import from separated API modules
import { serverGetProductById } from '@/lib/api/server';
import { 
    generateProductSEO, 
    validateProductData, 
    APIError, 
    API_ERRORS 
} from '@/lib/api/shared';

// Force static generation for better performance
export const dynamicParams = true;
export const revalidate = 600; // Revalidate every 10 minutes

export default async function ProductPage({ params }) {
    const { id, locale } = params;

    return (
        <ErrorBoundary>
            <Suspense fallback={<ProductSkeleton />}>
                <ProductContent id={id} locale={locale} />
            </Suspense>
        </ErrorBoundary>
    );
}

async function ProductContent({ id, locale }) {
    let product;

    try {
        // Validate ID first
        if (!id || isNaN(Number(id))) {
            notFound();
        }

        product = await serverGetProductById(id, locale);

        // Validate product data structure
        const validation = validateProductData(product);
        if (!validation.isValid) {
            console.error('Product validation failed:', validation.errors);
            notFound();
        }

    } catch (error) {
        console.error('Failed to fetch product:', error);

        // Handle different error types appropriately
        if (error instanceof APIError) {
            switch (error.type) {
                case API_ERRORS.NOT_FOUND:
                    notFound();
                case API_ERRORS.TIMEOUT:
                    // Could show a timeout-specific error page
                    notFound();
                default:
                    notFound();
            }
        }

        notFound();
    }

    return <ProductDetailsClient product={product} locale={locale} />;
}

// Enhanced metadata generation with error handling
export async function generateMetadata({ params }) {
    const { id, locale } = params;

    try {
        if (!id || isNaN(Number(id))) {
            return {
                title: 'Invalid Product | Lajolie',
                description: 'The requested product ID is invalid.'
            };
        }

        const product = await serverGetProductById(id, locale);
        const validation = validateProductData(product);

        if (!validation.isValid) {
            return {
                title: 'Product Not Available | Lajolie',
                description: 'The requested product is not available at the moment.'
            };
        }

        return generateProductSEO(product, locale);

    } catch (error) {
        console.error('Failed to generate metadata:', error);

        return {
            title: 'Product Not Found | Lajolie',
            description: 'The requested product could not be found.',
            robots: 'noindex, nofollow'
        };
    }
}