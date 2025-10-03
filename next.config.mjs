/** @type {import('next').NextConfig} */
const nextConfig = {

    images: {
        domains: ['localhost'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'adminapi.beneshty.com',
                port: '',
                pathname: '/BeneshyStoreData/**', // Broader pattern to catch all paths
            },
            {
                protocol: 'https',
                hostname: 'adminapi.beneshty.com',
                port: '',
                pathname: '/BeneshyStoreData/ItemsImage/**',
            },
            // Add fallback patterns for common image CDNs
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
            }
        ],
    },
    
};

export default nextConfig;
