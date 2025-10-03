'use client';

import { memo } from 'react';
import styles from '@/styles/shop/ProductDetails.module.css';

export const SizeSelector = memo(({ sizes, selectedIndex, onSizeChange, disabled = false }) => {
    // Debug logging
    console.log('SizeSelector - sizes:', sizes);
    console.log('SizeSelector - selectedIndex:', selectedIndex);

    if (!sizes || sizes.length === 0) {
        console.log('SizeSelector - No sizes available or empty array');
        return null;
    }

    // Show selector even for single size to display size info
    return (
        <div className={styles.optionGroup}>
            <label className={styles.optionLabel}>
                Size
            </label>
            <div className={styles.sizeOptions}>
                {sizes.map((size, index) => {
                    console.log(`SizeSelector - Size ${index}:`, size);
                    return (
                        <button
                            key={size.sizeId || index}
                            className={`${styles.sizeButton} ${index === selectedIndex ? styles.sizeButtonActive : ''}`}
                            onClick={() => onSizeChange(index)}
/*                             disabled={size.qty === 0}
 */                        >
                            {size.name || `Size ${index + 1}`}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});

SizeSelector.displayName = 'SizeSelector';
