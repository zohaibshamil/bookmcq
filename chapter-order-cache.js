// ============================================
// CHAPTER-ORDER-CACHE.JS - Smart Caching Logic
// ============================================

// This file handles all chapter order operations with Supabase
// and provides smart caching functionality

(function() {
    'use strict';

    // Get config from global scope
    const CONFIG = window.SUPABASE_CONFIG;
    if (!CONFIG) {
        console.error('❌ SUPABASE_CONFIG not found. Make sure config.js is loaded first.');
        return;
    }

    // Initialize Supabase client
    const supabaseClient = supabase.createClient(CONFIG.url, CONFIG.publishableKey);

    // ============================================
    // CHAPTER ORDER FETCHER CLASS
    // ============================================
    class ChapterOrderFetcher {
        constructor() {
            this.cacheKey = CONFIG.cacheKey;
            this.cacheTimestampKey = CONFIG.cacheTimestampKey;
            this.cacheDuration = CONFIG.cacheDuration;
            this.orderData = null;
            this.supabase = supabaseClient;
        }

        // Get chapter order from Supabase
        async fetchFromSupabase() {
            try {
                console.log('📊 Fetching chapter order from Supabase...');
                
                // Query chapters with their book slugs and chapter numbers
                const { data, error } = await this.supabase
                    .from('chapters')
                    .select(`
                        chapter_number,
                        slug,
                        books!inner (
                            slug
                        )
                    `)
                    .order('book_id')
                    .order('chapter_number', { ascending: true });

                if (error) {
                    console.error('❌ Supabase error:', error);
                    return null;
                }

                if (!data || data.length === 0) {
                    console.warn('⚠️ No chapters found in database');
                    return null;
                }

                // Group by book slug
                const grouped = {};
                data.forEach(row => {
                    const bookSlug = row.books.slug;
                    if (!grouped[bookSlug]) {
                        grouped[bookSlug] = {};
                    }
                    // Only add if chapter_number exists
                    if (row.chapter_number !== null && row.chapter_number !== undefined) {
                        grouped[bookSlug][row.slug] = row.chapter_number;
                    }
                });

                console.log(`✅ Fetched order for ${Object.keys(grouped).length} books`);
                return grouped;

            } catch (error) {
                console.error('❌ Failed to fetch chapter order:', error);
                return null;
            }
        }

        // Get cached data or fetch fresh
        async getChapterOrder(forceRefresh = false) {
            // Check if we have cached data
            if (!forceRefresh) {
                const cached = this.getFromCache();
                if (cached) {
                    console.log('📦 Using cached chapter order data');
                    return cached;
                }
            }

            // Fetch from Supabase
            console.log('🔄 Fetching fresh chapter order data...');
            const freshData = await this.fetchFromSupabase();
            
            if (freshData) {
                this.saveToCache(freshData);
                console.log('💾 Chapter order cached successfully');
            }

            return freshData;
        }

        // Get data from localStorage
        getFromCache() {
            try {
                const timestamp = localStorage.getItem(this.cacheTimestampKey);
                const data = localStorage.getItem(this.cacheKey);

                if (!timestamp || !data) {
                    return null;
                }

                // Check if cache is expired
                const age = Date.now() - parseInt(timestamp);
                if (age > this.cacheDuration) {
                    console.log('⏰ Cache expired, will fetch fresh');
                    return null;
                }

                return JSON.parse(data);
            } catch (error) {
                console.warn('⚠️ Failed to read cache:', error);
                return null;
            }
        }

        // Save data to localStorage
        saveToCache(data) {
            try {
                localStorage.setItem(this.cacheKey, JSON.stringify(data));
                localStorage.setItem(this.cacheTimestampKey, String(Date.now()));
            } catch (error) {
                console.warn('⚠️ Failed to save cache:', error);
            }
        }

        // Force refresh the cache
        async refreshCache() {
            console.log('🔄 Forcing cache refresh...');
            const freshData = await this.fetchFromSupabase();
            if (freshData) {
                this.saveToCache(freshData);
                this.orderData = freshData;
                return freshData;
            }
            return null;
        }

        // Get cache status
        getCacheStatus() {
            try {
                const timestamp = localStorage.getItem(this.cacheTimestampKey);
                const data = localStorage.getItem(this.cacheKey);
                
                if (!timestamp || !data) {
                    return { exists: false, age: null, valid: false };
                }
                
                const age = Date.now() - parseInt(timestamp);
                const valid = age < this.cacheDuration;
                
                return {
                    exists: true,
                    age: age,
                    ageFormatted: this.formatDuration(age),
                    valid: valid,
                    expiresIn: this.formatDuration(this.cacheDuration - age)
                };
            } catch (error) {
                return { exists: false, age: null, valid: false, error: error.message };
            }
        }

        // Helper: Format duration
        formatDuration(ms) {
            if (ms < 0) return 'Expired';
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) return `${days}d ${hours % 24}h`;
            if (hours > 0) return `${hours}h ${minutes % 60}m`;
            if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
            return `${seconds}s`;
        }

        // Clear cache
        clearCache() {
            try {
                localStorage.removeItem(this.cacheKey);
                localStorage.removeItem(this.cacheTimestampKey);
                console.log('🗑️ Cache cleared');
                return true;
            } catch (error) {
                console.warn('⚠️ Failed to clear cache:', error);
                return false;
            }
        }
    }

    // ============================================
    // EXPOSE TO GLOBAL SCOPE
    // ============================================
    window.ChapterOrderFetcher = ChapterOrderFetcher;
    window.ChapterOrderFetcherInstance = new ChapterOrderFetcher();

    console.log('✅ Chapter Order Cache module loaded');
})();
