import { supabase } from '../lib/supabase'
import { useState, useEffect } from 'react'

export async function getStaticProps() {
  const { data: books } = await supabase
    .from('books')
    .select('id, title')
    .order('title')
    .limit(50)

  return {
    props: { books: books || [] },
    revalidate: 3600
  }
}

export default function Practice({ books }) {
  const [selectedBook, setSelectedBook] = useState('')
  const [topics, setTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', error: false })

  const showToast = (msg, error = false) => {
    setToast({ show: true, message: msg, error })
    setTimeout(() => setToast({ show: false, message: '', error: false }), 3000)
  }

  useEffect(() => {
    if (selectedBook) {
      loadTopics()
    }
  }, [selectedBook])

  useEffect(() => {
    if (selectedTopic) {
      loadQuestions()
    }
  }, [selectedTopic])

  async function loadTopics() {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('id, name, chapter_number')
        .eq('book_id', selectedBook)
        .order('chapter_number')
      
      if (error) throw error
      setTopics(data || [])
      setSelectedTopic('')
      setQuestions([])
    } catch (error) {
      showToast('Error loading topics', true)
    }
  }

  async function loadQuestions() {
    if (!selectedTopic) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          question_text,
          difficulty,
          correct_answer,
          explanation,
          options (option_text, option_index)
        `)
        .eq('topic_id', selectedTopic)
        .limit(20)

      if (error) throw error

      const formatted = (data || []).map(q => ({
        id: q.id,
        text: q.question_text,
        options: (q.options || []).sort((a, b) => a.option_index - b.option_index).map(o => o.option_text),
        correct: q.correct_answer,
        explanation: q.explanation || 'No explanation available',
        difficulty: q.difficulty
      }))

      setQuestions(formatted)
    } catch (error) {
      showToast('Error loading questions', true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="fas fa-database text-purple-600"></i> Practice MCQs
        </h2>
        <p className="text-gray-600 mb-6">Browse and practice questions organized by book, chapter, and topic</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📚 Select Book</label>
            <select 
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Select a Book --</option>
              {books.map(book => (
                <option key={book.id} value={book.id}>{book.title}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🏷️ Select Topic / Chapter</label>
            <select 
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={!selectedBook}
            >
              <option value="">Select a book first</option>
              {topics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.chapter_number ? `Ch ${topic.chapter_number}: ${topic.name}` : topic.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div id="practiceQuestionsContainer" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading questions...</div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedTopic ? 'No questions found' : 'Select a book and topic to view questions'}
            </div>
          ) : (
            questions.map((q, idx) => {
              const difficultyColor = q.difficulty === 'easy' ? 'text-green-600 bg-green-50' : 
                                    q.difficulty === 'medium' ? 'text-yellow-600 bg-yellow-50' : 
                                    'text-red-600 bg-red-50'
              
              return (
                <div key={q.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 practice-card">
                  <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                    <span className="font-bold text-purple-600 text-sm">Q{idx + 1}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColor}`}>{q.difficulty.toUpperCase()}</span>
                  </div>
                  <p className="font-medium text-gray-800 mb-4">{q.text}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className={`flex items-center gap-2 p-2 bg-gray-50 rounded-lg ${optIdx === q.correct ? 'border-l-4 border-green-500' : ''}`}>
                        <span className="font-semibold text-gray-600 w-6">{String.fromCharCode(65 + optIdx)}.</span>
                        <span className="text-gray-700 text-sm">{opt}</span>
                        {optIdx === q.correct && <i className="fas fa-check-circle text-green-500 ml-auto"></i>}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-gray-600">
                      <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                      {q.explanation}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* MISSING BOOK SECTION */}
      <div className="missing-book-card rounded-2xl p-6 shadow-xl mt-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <i className="fas fa-book-open text-3xl text-amber-600"></i>
            <div>
              <h3 className="font-bold text-amber-800 text-lg">Don't see your book?</h3>
              <p className="text-amber-700 text-sm">Want MCQs from a specific book that's not available yet?</p>
            </div>
          </div>
          <a href="/contact" className="bg-amber-600 text-white px-5 py-2 rounded-full font-medium hover:bg-amber-700 transition flex items-center gap-2">
            <i className="fas fa-envelope"></i> Request a Book
          </a>
        </div>
      </div>

      {/* Toast */}
      {toast.show && (
        <div className={`toast ${toast.error ? 'bg-red-500' : 'bg-gray-800'}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
