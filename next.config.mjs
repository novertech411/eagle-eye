// The main site (www.eagleeyetech.org) forwards /login/* to this app, so every route lives
// under /login: the login page is /login and the dashboard is /login/dashboard.
const basePath = '/login'

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  // Next.js adds the base path to links and redirects, but not to fetch() calls, image src
  // strings or browser redirects, so lib/base-path.ts reads it from here for those.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  images: {
    unoptimized: true,
  },

  serverExternalPackages: ['@react-pdf/renderer'],

  outputFileTracingIncludes: {
    '/api/report/[id]': ['./lib/pdf/fonts/**', './public/images/eagle-eye-logo.jpg'],
  },
}

export default nextConfig
