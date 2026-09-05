// src/utils/cacheManager.js
const NodeCache = require('node-cache');

// Initialize cache with default TTL of 1 hour
const cache = new NodeCache({
    stdTTL: process.env.CACHE_TTL || 3600,
    checkperiod: 120,
    useClones: false
});

class CacheManager {
    get(key) {
        return cache.get(key) || null;
    }

    set(key, value, ttl = 3600) {
        return cache.set(key, value, ttl);
    }

    delete(key) {
        return cache.del(key);
    }

    flush() {
        return cache.flushAll();
    }

    getStats() {
        return cache.getStats();
    }

    // Clear all cache entries that match a pattern
    clearPattern(pattern) {
        const keys = cache.keys();
        const matchedKeys = keys.filter(key => key.includes(pattern));
        if (matchedKeys.length > 0) {
            cache.del(matchedKeys);
        }
        return matchedKeys.length;
    }
}

module.exports = new CacheManager();
