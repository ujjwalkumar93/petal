/**
 * Whether apps load from their devUrl: always in `next dev`, and in a
 * production build when NEXT_PUBLIC_PETAL_USE_DEV_URLS=1 (fast local runs
 * against app dev servers).
 */
export const USE_DEV_URLS = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_PETAL_USE_DEV_URLS === "1"
