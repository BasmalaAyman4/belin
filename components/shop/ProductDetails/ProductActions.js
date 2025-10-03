'use client';

import { memo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import styles from '@/styles/shop/ProductDetails.module.css';

export const ProductActions = memo(({
    inStock,
    isAddingToCart,
    isFavorite,
    product,
    onAddToCart,
    onToggleFavorite
}) => {
    return (
        <div className={styles.actionContainer}>
            <motion.button
                className={`${styles.addToCartButton} ${!inStock || isAddingToCart ? styles.buttonDisabled : ''}`}
                disabled={!inStock || isAddingToCart}
                onClick={onAddToCart}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: inStock ? 1.02 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
                <ShoppingCart size={20} />
                {isAddingToCart ? 'Adding...' : !inStock ? 'Out of Stock' : 'Add to cart'}
            </motion.button>

            <motion.button
                className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''}`}
                onClick={onToggleFavorite}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
            </motion.button>
        </div>
    );
});

ProductActions.displayName = 'ProductActions';
