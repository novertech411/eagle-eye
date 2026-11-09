
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: "/login",

  images: {
    unoptimized: true,
  },

  serverExternalPackages: ['@react-pdf/renderer'],

  outputFileTracingIncludes: {
    '/api/report/[id]': [
      './lib/pdf/fonts/**',
      './public/images/eagle-eye-logo.jpg'
    ],
  },
}

export default nextConfig
