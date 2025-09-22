/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://http://cuhiesjewels.com.bd',
    generateRobotsTxt: true,
    exclude: ['/api/**', '/dashboard', '/dashboard/**', '/login', '/register', '/profile', '/cart', '/orders', '/orders/**', '/checkout'],
    robotsTxtOptions: {
        additionalSitemaps: [
            'https://http://cuhiesjewels.com.bd/api/sitemap.xml' // Point to the dynamic sitemap
        ],
    },
};
