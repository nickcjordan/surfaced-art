/**
 * Reserved slug validation for root-level artist URLs.
 *
 * When artists get vanity URLs at surfaced.art/artist-name, we must prevent
 * conflicts with platform routes, brand terms, and offensive content.
 */

// --- Reserved slug categories ---

/** Current Next.js routes and API paths */
const CURRENT_ROUTES = [
  'about', 'admin', 'api', 'apply', 'artist', 'artists',
  'category', 'dashboard', 'for-artists', 'forgot-password',
  'listing', 'privacy', 'reset-password', 'search',
  'sign-in', 'sign-up', 'studio', 'terms', 'verify-email',
] as const

/** Planned routes for future platform features */
const PLANNED_ROUTES = [
  'account', 'blog', 'cart', 'checkout', 'commissions',
  'contact', 'content-guidelines', 'dmca', 'faq', 'for-buyers',
  'help', 'orders', 'refund-policy', 'shipping-policy',
  'venue', 'venues',
] as const

/** Brand terms that should never be artist slugs */
const BRAND_TERMS = [
  'surfaced', 'surfaced-art', 'surfacedart', 'sa',
] as const

/** Generic platform words that would be confusing as artist URLs */
const GENERIC_PLATFORM_WORDS = [
  'art', 'artwork', 'artworks', 'new', 'featured', 'popular',
  'trending', 'latest', 'best', 'top', 'all', 'home', 'index',
  'page', 'pages', 'post', 'posts', 'user', 'users', 'member',
  'members', 'browse',
] as const

/** Social and communication features */
const SOCIAL_COMMUNICATION = [
  'chat', 'messages', 'inbox', 'conversations', 'forums',
  'discussions', 'announcements',
] as const

/** Marketing and content pages */
const MARKETING_CONTENT = [
  'campaign', 'campaigns', 'promo', 'promotions', 'deals',
  'sale', 'sales', 'holiday', 'seasonal', 'curated', 'picks',
  'editors-picks', 'staff-picks', 'spotlight',
] as const

/** Business and operational pages */
const BUSINESS_OPERATIONAL = [
  'careers', 'hiring', 'team', 'investors', 'affiliate',
  'affiliates', 'brand', 'brands', 'wholesale', 'trade',
  'enterprise', 'developer', 'developers', 'docs',
  'documentation', 'status', 'health',
] as const

/** Platform identity and trust */
const PLATFORM_IDENTITY = [
  'verified', 'official', 'authentic', 'handmade', 'vetting',
  'trust', 'safety', 'report', 'abuse', 'copyright',
  'trademark', 'uptime',
] as const

/** Future feature routes */
const FUTURE_FEATURES = [
  'artist-agreement', 'artist-terms', 'auth', 'categories',
  'collections', 'community', 'discover', 'events', 'explore',
  'favorites', 'feed', 'gallery', 'gifts', 'guide', 'guides',
  'how-it-works', 'invite', 'jobs', 'join', 'legal', 'magazine',
  'media', 'newsletter', 'notifications', 'onboarding', 'partners',
  'partnerships', 'press', 'pricing', 'profile', 'referral',
  'referrals', 'register', 'reviews', 'saved', 'settings', 'shop',
  'signup', 'login', 'logout', 'sitemap', 'stories', 'subscribe',
  'support', 'tags', 'trends', 'unsubscribe', 'waitlist', 'wishlist',
] as const

/** Technical and infrastructure paths */
const TECHNICAL_INFRASTRUCTURE = [
  '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',
  'manifest.json', 'sw.js', '.well-known', 'callback', 'redirect',
  'oauth', 'webhook', 'webhooks', 'embed', 'widget', 'rss', 'cdn',
  'assets', 'static', 'public', 'uploads', 'images', 'img', 'files',
  'download', 'downloads', 'null', 'undefined', 'true', 'false',
  'test', 'testing', 'staging', 'dev', 'debug', 'error', '404', '500',
] as const

/**
 * Profane/offensive words that should never be artist slugs.
 * Curated list covering common English profanity. Exact match only —
 * compound words like "assemble" won't be blocked because slug validation
 * checks the entire slug, not substrings.
 */
const PROFANITY = [
  'ass', 'asshole', 'bastard', 'bitch', 'bollocks', 'cock',
  'crap', 'cunt', 'damn', 'dick', 'dildo', 'dyke', 'fag',
  'faggot', 'fuck', 'goddamn', 'hell', 'homo', 'jerk',
  'kike', 'nigga', 'nigger', 'penis', 'piss', 'prick',
  'pussy', 'queer', 'shit', 'slut', 'spic', 'tit', 'tits',
  'twat', 'vagina', 'wanker', 'whore',
] as const

/**
 * Complete set of reserved slugs.
 * Uses exact matching — "admin" is blocked but "admin-tools" is not.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  ...CURRENT_ROUTES,
  ...PLANNED_ROUTES,
  ...BRAND_TERMS,
  ...GENERIC_PLATFORM_WORDS,
  ...SOCIAL_COMMUNICATION,
  ...MARKETING_CONTENT,
  ...BUSINESS_OPERATIONAL,
  ...PLATFORM_IDENTITY,
  ...FUTURE_FEATURES,
  ...TECHNICAL_INFRASTRUCTURE,
  ...PROFANITY,
])

/**
 * Check if a slug is reserved (blocked from use as an artist vanity URL).
 *
 * Checks the hardcoded blocklist which includes platform routes, brand terms,
 * generic words, and profanity. Uses exact match, case-insensitive.
 *
 * @param slug - The slug to check
 * @returns true if the slug is reserved or profane
 */
export function isReservedSlug(slug: string): boolean {
  if (!slug) return false
  return RESERVED_SLUGS.has(slug.toLowerCase())
}
