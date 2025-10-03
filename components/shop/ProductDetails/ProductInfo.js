'use client';

import { memo } from 'react';
import { Star, Truck, Share2 } from 'lucide-react';
import { ColorSelector } from './ColorSelector';
import { SizeSelector } from './SizeSelector';
import styles from '@/styles/shop/ProductDetails.module.css';

const StarRating = memo(({ rating, reviewCount }) => (
    <div className={styles.ratingContainer}>
        <div className={styles.stars}>
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    className={`${styles.star} ${i < rating ? styles.starFilled : styles.starEmpty}`}
                    size={16}
                />
            ))}
        </div>
        <span className={styles.reviewCount}>({reviewCount || 0} reviews)</span>
    </div>
));

StarRating.displayName = 'StarRating';

export const ProductInfo = memo(({
    product,
    selectedColor,
    selectedColorIndex,
    availableSizes,
    selectedSizeIndex,
    displayPrice,
    originalPrice,
    formatPrice,
    onColorChange,
    onSizeChange,
    onShare,
    locale
}) => {

    console.log(locale)
    return (
        <div className={styles.infoSection}>
            <div className={styles.brandHeader}>
                <span className={styles.brand}>{product.brand || 'Brand'}</span>
                <div className={styles.headerActions}>
                    <button
                        className={styles.shareButton}
                        onClick={onShare}
                        aria-label="Share product"
                    >
                        <Share2 size={16} />
                    </button>
                    <span className={styles.productId}>#{product.productId}</span>
                </div>
            </div>

            <h1 className={styles.productTitle}>{product.name}</h1>

            <StarRating
                rating={product.rate || 0}
                reviewCount={product.productReviews?.length || 0}
            />

            <div className={styles.priceSection}>
                <span className={styles.currentPrice}>
                    {formatPrice(displayPrice, locale)}
                </span>
                {originalPrice && originalPrice !== displayPrice && (
                    <span className={styles.originalPrice}>
                        {formatPrice(originalPrice, locale)}
                    </span>
                )}
            </div>

            {/* Product Options */}
            {product.colors && product.colors.length > 0 && (
                <ColorSelector
                    colors={product.colors}
                    selectedIndex={selectedColorIndex}
                    onColorChange={onColorChange}
                />
            )}

            <SizeSelector
                sizes={availableSizes}
                selectedIndex={selectedSizeIndex}
                onSizeChange={onSizeChange}
            />

            {/* Delivery Info */}
            <div className={styles.deliveryInfo}>
                <Truck size={16} />
                <span>Free delivery on orders over $30.0</span>
            </div>

            {/* Product Features */}
            {(product.isVegan || product.forChildren || product.canTry) && (
                <div className={styles.features}>
                    {product.isVegan && <span className={styles.feature}>Vegan</span>}
                    {product.forChildren && <span className={styles.feature}>For Children</span>}
                    {product.canTry && <span className={styles.feature}>Try Before Buy</span>}
                </div>
            )}

            {/* Description */}
            {product.description && (
                <div className={styles.descriptionContainer}>
                    <h3 className={styles.descriptionTitle}>Description</h3>
                    <div
                        className={styles.description}
                        dangerouslySetInnerHTML={{
                            __html: product.description.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        }}
                    />
                </div>
            )}

            {/* Ingredients */}
            {product.ingredients && (
                <div className={styles.ingredientsContainer}>
                    <h3 className={styles.ingredientsTitle}>Ingredients</h3>
                    <p className={styles.ingredients}>{product.ingredients}</p>
                </div>
            )}
        </div>
    );
});

ProductInfo.displayName = 'ProductInfo';