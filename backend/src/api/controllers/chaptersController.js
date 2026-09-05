const { supabase } = require('../../config/supabase');

exports.getChapterTopics = async (req, res) => {
    try {
        const { chapterId } = req.params;
        
        const { data, error } = await supabase
            .from('subtopics')
            .select('id, name')
            .eq('chapter_id', chapterId)
            .order('id');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch topics' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Error in getChapterTopics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
