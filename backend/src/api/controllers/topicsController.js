const { supabase } = require('../../config/supabase');

exports.getTopicQuestions = async (req, res) => {
    try {
        const { topicId } = req.params;
        
        const { data, error } = await supabase
            .from('questions')
            .select('id, question_text, difficulty, correct_answer, explanation')
            .eq('topic_id', topicId)
            .order('id');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch questions' });
        }

        res.json(data || []);
    } catch (error) {
        console.error('Error in getTopicQuestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
