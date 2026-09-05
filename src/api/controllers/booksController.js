// src/api/controllers/booksController.js
const { supabase } = require('../../config/supabase');
const cacheManager = require('../../utils/cacheManager');

const CACHE_KEY = 'books_all';
const CACHE_TTL = process.env.CACHE_TTL || 3600;

exports.getAllBooks = async (req, res) => {
    try {
        // Check cache first
        const cached = cacheManager.get(CACHE_KEY);
        if (cached) {
            return res.json(cached);
        }

        const { data, error } = await supabase
            .from('books')
            .select('id, title, author, category, cover_image, description')
            .order('title');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch books' });
        }

        // Store in cache
        cacheManager.set(CACHE_KEY, data, CACHE_TTL);

        res.json(data);
    } catch (error) {
        console.error('Error in getAllBooks:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Book not found' });
            }
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch book' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error in getBookById:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getBookChapters = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `chapters_book_${id}`;
        
        // Check cache
        const cached = cacheManager.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const { data, error } = await supabase
            .from('chapters')
            .select('id, name, chapter_number, description')
            .eq('book_id', id)
            .order('chapter_number');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch chapters' });
        }

        cacheManager.set(cacheKey, data, CACHE_TTL);
        res.json(data);
    } catch (error) {
        console.error('Error in getBookChapters:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
