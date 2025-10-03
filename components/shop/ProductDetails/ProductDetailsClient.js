'use client';
import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Share2, ZoomIn } from 'lucide-react';
import { useProductSelection } from '@/hooks/useProductSelection';
import { getCachedPriceFormatter } from '@/utils/performance';
import { ImageGallery } from './ImageGallery';
import { ProductInfo } from './ProductInfo';
import { ProductActions } from './ProductActions';
import styles from '@/styles/shop/ProductDetails.module.css';
import Image from 'next/image';

const ProductDetailsClient = memo(({ product, locale }) => {
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const {
        selectedColorIndex,
        selectedSizeIndex,
        selectedImageIndex,
        selectedColor,
        selectedSize,
        availableSizes,
        currentImages,
        currentImage,
        displayPrice,
        originalPrice,
        inStock,
        handleColorChange,
        handleSizeChange,
        handleImageChange,
    } = useProductSelection(product);

    // Memoized price formatter with error handling
    const priceFormatter = useMemo(() => {
        try {
            return getCachedPriceFormatter(locale);
        } catch (error) {
            console.error('Failed to create price formatter:', error);
            return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ar-EG', {
                style: 'currency',
                currency: 'EGP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
        }
    }, [locale]);

    const formatPrice = useCallback((price) => {
        if (typeof price !== 'number' || price <= 0) return '0 EGP';
        try {
            return priceFormatter.format(price);
        } catch (error) {
            console.error('Price formatting error:', error);
            return `${price} EGP`;
        }
    }, [priceFormatter]);

    // Event handlers
    const handleAddToCart = useCallback(async () => {
        if (!inStock) return;

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Added to cart:', {
                productId: product.productId,
                colorId: selectedColor?.colorId,
                sizeId: selectedSize?.sizeId,
                qty: 1
            });
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } 
    }, [inStock, product.productId, selectedColor?.colorId, selectedSize?.sizeId]);

    const handleToggleFavorite = useCallback(() => {
        setIsFavorite(prev => !prev);
    }, []);

    const handleShare = useCallback(async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: product.name,
                    text: `Check out ${product.name} from ${product.brand || 'our store'}`,
                    url: window.location.href,
                });
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                console.log('Link copied to clipboard');
            }
        } catch (error) {
            console.log('Share cancelled or failed:', error);
        }
    }, [product.name, product.brand]);

    const handleImageClick = useCallback(() => {
        setIsImageModalOpen(true);
    }, []);

    const handleModalClose = useCallback(() => {
        setIsImageModalOpen(false);
    }, []);

    console.log(currentImages,'currentImages')
    if (!selectedColor) {
        return (
            <div className={styles.errorContainer}>
                <p className={styles.errorText}>Product data is incomplete</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb}>
                <span>{product.category || 'Products'}</span>
                <span className={styles.separator}>/</span>
                <span>{product.productTypeName || 'Items'}</span>
                <span className={styles.separator}>/</span>
                <span className={styles.currentPage}>{product.name}</span>
            </nav>

            <div className={styles.productContainer}>
                <ImageGallery
                    images={currentImages}
                    selectedImageIndex={selectedImageIndex}
                    onImageChange={handleImageChange}
                    onImageClick={handleImageClick}
                />

                <ProductInfo
                    product={product}
                    selectedColor={selectedColor}
                    selectedColorIndex={selectedColorIndex}
                    availableSizes={availableSizes}
                    selectedSizeIndex={selectedSizeIndex}
                    displayPrice={displayPrice}
                    originalPrice={originalPrice}
                    formatPrice={formatPrice}
                    onColorChange={handleColorChange}
                    onSizeChange={handleSizeChange}
                    onShare={handleShare}
                    locale={locale}
                />
                <ProductActions
                    inStock={inStock}
                    isFavorite={isFavorite}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onToggleFavorite={handleToggleFavorite}
                />
            </div> 

            
        </div>
    );
});

ProductDetailsClient.displayName = 'ProductDetailsClient';

export default ProductDetailsClient;