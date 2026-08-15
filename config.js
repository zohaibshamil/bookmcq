// ============================================
// CONFIG.JS - Supabase Configuration
// ============================================

// These are safe to expose as they are publishable keys
// Never expose the SERVICE_ROLE key or ANON key in client-side code
const SUPABASE_CONFIG = {
    url: 'https://wnsuuazwcxmuwqyphvse.supabase.co',
    // This is the publishable key - safe for client-side
    publishableKey: 'sb_publishable_qsQzf3RycZtO8Uj1hd3mcg_jaX6iQ9C',
    // Cache duration (24 hours)
    cacheDuration: 24 * 60 * 60 * 1000,
    // Cache key names
    cacheKey: 'chapterOrderData',
    cacheTimestampKey: 'chapterOrderTimestamp'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
} else {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
}
