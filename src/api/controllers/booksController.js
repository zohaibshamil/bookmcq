const { supabase } = require('../../config/supabase');

exports.getAllBooks = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('id, title, author, category')
            .order('title');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch books' });
        }

        res.json(data || []);
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
        
        const { data, error } = await supabase
            .from('chapters')
            .select('id, name, chapter_number')
            .eq('book_id', id)
            .order('chapter_number');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch chapters' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Error in getBookChapters:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
