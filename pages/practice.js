import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Practice() {
  const [books, setBooks] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedTopic, setSelectedTopic] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [difficulty, setDifficulty] = useState('')
  const pageSize = 10

  useEffect(() => {
    loadBooks()
  }, [])

  async function loadBooks() {
    const { data } = await supabase.from('books').select('id, title').order('title')
    setBooks(data || [])
  }

  async function loadTopics(bookId) {
    const { data } = await supabase.from('topics').select('id, name, chapter_number').eq('book_id', bookId).order('chapter_number')
    setTopics(data || [])
    setSelectedTopic('')
    setQuestions([])
  }

  async function loadQuestions(page = 1) {
    if (!selectedTopic) return
    setCurrentPage(page)

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('questions')
      .select('id, question_text, difficulty, correct_answer, explanation, options(option_text, option_index)', { count: 'exact' })
      .eq('topic_id', selectedTopic)

    if (difficulty) {
      query = query.eq('difficulty', difficulty)
    }

    const { data, count } = await query.range(from, to).order('id')
    
    if (data) {
      const formatted = data.map(q => ({
        id: q.id,
        text: q.question_text,
        options: (q.options || []).sort((a, b) => a.option_index - b.option_index).map(o => o.option_text),
        correct: q.correct_answer,
        explanation: q.explanation || 'No explanation available',
        difficulty: q.difficulty
      }))
      setQuestions(formatted)
      setTotalPages(Math.ceil((count || 0) / pageSize))
    }
  }

  return (
    <div>
      <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="fas fa-database text-purple-600"></i> Practice MCQs
        </h2>
        <p className="text-gray-600 mb-6">Browse and practice questions organized by book and topic</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📚 Select Book</label>
            <select 
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
              onChange={(e) => {
                setSelectedBook(e.target.value)
                loadTopics(e.target.value)
              }}
            >
              <option value="">-- Select a Book --</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🏷️ Select Topic</label>
            <select 
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
              onChange={(e) => {
                setSelectedTopic(e.target.value)
                if (e.target.value) loadQuestions(1)
              }}
              disabled={!selectedBook}
            >
              <option value="">-- Select a Topic --</option>
              {topics.map(t => (
                <option key={t.id} value={t.id}>
                  {t.chapter_number ? `Ch ${t.chapter_number}: ` : ''}{t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ Difficulty</label>
            <select 
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value)
                if (selectedTopic) loadQuestions(1)
              }}
            >
              <option value="">All Difficulties</option>
              <option value="easy">🌱 Easy</option>
              <option value="medium">⚡ Medium</option>
              <option value="hard">🔥 Hard</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const globalNumber = (currentPage - 1) * pageSize + idx + 1
            const difficultyColor = q.difficulty === 'easy' ? 'text-green-600 bg-green-50' :
                                   q.difficulty === 'medium' ? 'text-yellow-600 bg-yellow-50' :
                                   'text-red-600 bg-red-50'
            return (
              <div key={q.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 practice-card">
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <span className="font-bold text-purple-600 text-sm">Q{globalNumber}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColor}`}>
                    {q.difficulty.toUpperCase()}
                  </span>
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
                    <i className="fas fa-info-circle text-blue-500 mr-2"></i> {q.explanation}
                  </div>
                )}
              </div>
            )
          })}
          {questions.length === 0 && selectedTopic && (
            <div className="text-center py-8 text-gray-500">No questions found</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button 
              className="bg-gray-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              onClick={() => loadQuestions(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-sm">Page {currentPage} of {totalPages}</span>
            <button 
              className="bg-gray-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              onClick={() => loadQuestions(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Missing Book Request */}
      <div className="missing-book-card rounded-2xl p-6 shadow-xl" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)', border: '2px solid #f59e0b' }}>
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
    </div>
  )
}
