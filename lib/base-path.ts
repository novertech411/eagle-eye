// Set from basePath in next.config.mjs.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

// For URLs Next.js doesn't prefix itself: fetch() calls, image src strings and browser redirects.
// Links, router navigation and redirect() already include the base path.
export function withBasePath(path: string) {
  return `${BASE_PATH}${path}`
}
