/** @type {import('next').NextConfig} */
const nextConfig = {
    
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/report/[id]': ['./lib/pdf/fonts/**', './public/images/eagle-eye-logo.jpg'],
  },
  async redirects() {
    // Not permanent, so browsers don't cache it if the home page changes later.
    return [{ source: '/', destination: '/login', permanent: false }]
  },
}

export default nextConfig
