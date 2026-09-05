// src/api/controllers/chaptersController.js
const { supabase } = require('../../config/supabase');
const cacheManager = require('../../utils/cacheManager');

exports.getChaptersByBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const cacheKey = `chapters_book_${bookId}`;
        
        const cached = cacheManager.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const { data, error } = await supabase
            .from('chapters')
            .select('id, name, chapter_number, description')
            .eq('book_id', bookId)
            .order('chapter_number');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch chapters' });
        }

        cacheManager.set(cacheKey, data, CACHE_TTL);
        res.json(data);
    } catch (error) {
        console.error('Error in getChaptersByBook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getChapterTopics = async (req, res) => {
    try {
        const { chapterId } = req.params;
        const cacheKey = `topics_chapter_${chapterId}`;
        
        const cached = cacheManager.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const { data, error } = await supabase
            .from('subtopics')
            .select('id, name, description')
            .eq('chapter_id', chapterId)
            .order('id');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch topics' });
        }

        cacheManager.set(cacheKey, data, CACHE_TTL);
        res.json(data);
    } catch (error) {
        console.error('Error in getChapterTopics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
