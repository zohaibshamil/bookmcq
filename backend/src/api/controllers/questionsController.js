const { supabase } = require('../../config/supabase');

exports.getQuestions = async (req, res) => {
    try {
        const { 
            chapterId, 
            page = 1, 
            pageSize = 10,
            difficulty = '',
            topicId = null
        } = req.query;
        
        if (!chapterId) {
            return res.status(400).json({ error: 'chapterId is required' });
        }

        const parsedPage = parseInt(page);
        const parsedPageSize = parseInt(pageSize);
        const isAll = parsedPageSize === 0;
        
        let query = supabase
            .from('questions')
            .select(`
                id, 
                question_text, 
                difficulty, 
                correct_answer, 
                explanation,
                topic_id,
                subtopics!left (id, name)
            `, { count: 'exact' })
            .eq('chapter_id', chapterId);

        // Apply topic filter
        if (topicId && topicId !== '') {
            query = query.eq('topic_id', topicId);
        }
        
        // Apply difficulty filter
        if (difficulty && difficulty !== '') {
            query = query.eq('difficulty', difficulty);
        }

        query = query.order('id');

        let data, error, count;
        
        if (isAll) {
            const result = await query;
            data = result.data;
            error = result.error;
            count = data?.length || 0;
        } else {
            const from = (parsedPage - 1) * parsedPageSize;
            const to = from + parsedPageSize - 1;
            const result = await query.range(from, to);
            data = result.data;
            error = result.error;
            count = result.count || 0;
        }

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch questions' });
        }

        // Format questions
        const formattedQuestions = (data || []).map(q => ({
            id: q.id,
            text: q.question_text,
            difficulty: q.difficulty,
            correct: q.correct_answer,
            explanation: q.explanation || 'No explanation available',
            topic_id: q.topic_id,
            topic_name: q.subtopics ? q.subtopics.name : null,
            options: []
        }));

        // Fetch options for all questions
        if (formattedQuestions.length > 0) {
            const questionIds = formattedQuestions.map(q => q.id);
            const { data: optionsData, error: optionsError } = await supabase
                .from('options')
                .select('question_id, option_text, option_index')
                .in('question_id', questionIds)
                .order('option_index');

            if (!optionsError && optionsData) {
                const optionsMap = {};
                optionsData.forEach(opt => {
                    if (!optionsMap[opt.question_id]) {
                        optionsMap[opt.question_id] = [];
                    }
                    optionsMap[opt.question_id][opt.option_index] = opt.option_text;
                });
                formattedQuestions.forEach(q => {
                    q.options = optionsMap[q.id] || [];
                });
            }
        }

        const result = {
            questions: formattedQuestions,
            total: count || 0,
            page: parsedPage,
            pageSize: isAll ? count : parsedPageSize,
            totalPages: isAll ? 1 : Math.ceil((count || 0) / parsedPageSize)
        };

        res.json(result);
    } catch (error) {
        console.error('Error in getQuestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .from('questions')
            .select(`
                *,
                subtopics!left (id, name),
                chapters!left (id, name, chapter_number, book_id),
                books!left (id, title)
            `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Question not found' });
            }
            return res.status(500).json({ error: 'Failed to fetch question' });
        }

        // Fetch options
        const { data: optionsData, error: optionsError } = await supabase
            .from('options')
            .select('option_text, option_index')
            .eq('question_id', id)
            .order('option_index');

        const question = {
            ...data,
            options: optionsData || []
        };

        res.json(question);
    } catch (error) {
        console.error('Error in getQuestionById:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
