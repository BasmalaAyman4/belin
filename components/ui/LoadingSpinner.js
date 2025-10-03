// components/ui/LoadingSpinner.js
'use client';

import { motion } from 'framer-motion';
import styles from '@/styles/ui/LoadingSpinner.module.css';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
    const sizeClass = styles[`spinner${size.charAt(0).toUpperCase() + size.slice(1)}`];

    return (
        <div className={styles.container}>
            <motion.div
                className={`${styles.spinner} ${sizeClass}`}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
            {message && <p className={styles.message}>{message}</p>}
        </div>
    );
};

export default LoadingSpinner;