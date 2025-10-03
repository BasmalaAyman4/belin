'use client';

import { memo } from 'react';
import styles from '@/styles/shop/ProductDetails.module.css';

export const ColorSelector = memo(({ colors, selectedIndex, onColorChange, disabled = false }) => {
    console.log('ColorSelector - colors:', colors);
    console.log('ColorSelector - selectedIndex:', selectedIndex);
    if (!colors || colors.length === 0) return null;
    return (
        <div className={styles.optionGroup}>
            <label className={styles.optionLabel}>
                Color
                <span className={styles.selectedOption}>
                    {colors[selectedIndex]?.name || 'N/A'}
                </span>
            </label>
            <div className={styles.colorOptions}>
                {colors.map((color, index) => (
                    
                    <button
                        key={color.colorId || index}
                        className={`${styles.colorSwatch} ${index === selectedIndex ? styles.colorSwatchActive : ''}`}
                        style={{ backgroundColor: color.colorHex || '#ccc' }}
                        onClick={() => onColorChange(index)}
                        aria-label={`Select ${color.name || 'color'} color`}
                    />
                   
                ))}
            </div>
        </div>
    );
});

ColorSelector.displayName = 'ColorSelector';