import Layout from '../../components/Layout'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'

export default function Quiz() {
  const [books, setBooks] = useState([])
  const [topics, setTopics] = useState([])
  const [selectedBook, setSelectedBook] = useState('')
  const [selectedTopics, setSelectedTopics] = useState([])
  const [selectedDifficulties, setSelectedDifficulties] = useState(['easy', 'medium', 'hard'])
  const [questionCount, setQuestionCount] = useState(20)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [isQuizActive, setIsQuizActive] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [userAnswers, setUserAnswers] = useState([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const timerRef = useRef(null)

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
    setSelectedTopics(data.map(t => t.id))
  }

  async function loadQuestions() {
    if (selectedTopics.length === 0) return

    const difficulties = selectedDifficulties
    const limit = questionCount

    let allQuestions = []
    for (const diff of difficulties) {
      const { data } = await supabase
        .from('questions')
        .select('id, question_text, difficulty, correct_answer, explanation, options(option_text, option_index)')
        .in('topic_id', selectedTopics)
        .eq('difficulty', diff)
        .limit(Math.ceil(limit / difficulties.length))

      if (data) {
        const formatted = data.map(q => ({
          id: q.id,
          text: q.question_text,
          options: (q.options || []).sort((a, b) => a.option_index - b.option_index).map(o => o.option_text),
          correct: q.correct_answer,
          explanation: q.explanation || 'No explanation available',
          difficulty: q.difficulty
        }))
        allQuestions = [...allQuestions, ...formatted]
      }
    }

    // Shuffle and limit
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]]
    }

    setQuestions(allQuestions.slice(0, limit))
    setCurrentIndex(0)
    setScore(0)
    setUserAnswers([])
    setIsQuizActive(true)
    setIsComplete(false)
    setTimeRemaining(allQuestions.slice(0, limit).length * 45)
    setIsLocked(false)

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          completeQuiz()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function handleAnswer(selectedIdx) {
    if (isLocked) return
    const currentQ = questions[currentIndex]
    const isCorrect = selectedIdx === currentQ.correct
    if (isCorrect) setScore(prev => prev + 1)

    const newAnswers = [...userAnswers]
    newAnswers[currentIndex] = selectedIdx
    setUserAnswers(newAnswers)
    setIsLocked(true)
  }

  function nextQuestion() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1)
      setIsLocked(false)
    } else {
      completeQuiz()
    }
  }

  function skipQuestion() {
    if (isLocked) return
    const newAnswers = [...userAnswers]
    newAnswers[currentIndex] = null
    setUserAnswers(newAnswers)
    setIsLocked(true)

    // Move to next or complete
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1)
      setIsLocked(false)
    } else {
      completeQuiz()
    }
  }

  function completeQuiz() {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsQuizActive(false)
    setIsComplete(true)
  }

  function restartQuiz() {
    setIsQuizActive(false)
    setIsComplete(false)
    setQuestions([])
    setUserAnswers([])
    setScore(0)
    setCurrentIndex(0)
    setTimeRemaining(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const currentQ = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0

  return (
    <div>
      {/* Filter Section */}
      {!isQuizActive && !isComplete && (
        <div className="quiz-card rounded-2xl p-6 mb-8 shadow-xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="fas fa-filter text-purple-600"></i> Filter Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📚 Select Book</label>
              <select 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                onChange={(e) => {
                  setSelectedBook(e.target.value)
                  loadTopics(e.target.value)
                }}
              >
                <option value="">Select a book</option>
                {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🏷️ Select Topics</label>
              <select 
                multiple
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500 h-24"
                value={selectedTopics}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, opt => opt.value)
                  setSelectedTopics(options)
                }}
                disabled={!selectedBook}
              >
                {topics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.chapter_number ? `Ch ${t.chapter_number}: ` : ''}{t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ Difficulty</label>
              <div className="space-y-2">
                {['easy', 'medium', 'hard'].map(d => (
                  <label key={d} className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={selectedDifficulties.includes(d)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDifficulties([...selectedDifficulties, d])
                        } else {
                          setSelectedDifficulties(selectedDifficulties.filter(x => x !== d))
                        }
                      }}
                    />
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">📊 Questions</label>
              <select 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
              >
                {[10, 20, 30, 50, 100].map(n => (
                  <option key={n} value={n}>{n} Questions</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            onClick={loadQuestions}
            className="mt-6 w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition shadow-lg"
            disabled={!selectedBook || selectedTopics.length === 0}
          >
            <i className="fas fa-play mr-2"></i> Start Quiz
          </button>
        </div>
      )}

      {/* Quiz Active */}
      {isQuizActive && currentQ && (
        <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <i className="fas fa-question-circle text-purple-600"></i>
              <span className="font-bold text-sm">Q{currentIndex + 1} / {questions.length}</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <i className="fas fa-clock text-purple-600"></i>
              <span className={`font-bold text-sm ${timeRemaining < 60 ? 'text-red-600' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div className="progress-bar bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>

          <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-6 question-text">
            {currentQ.text}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={isLocked}
                className={`option-btn w-full text-left p-3 rounded-xl bg-white text-gray-800 font-medium transition text-sm md:text-base ${
                  userAnswers[currentIndex] === idx ? 'selected-option' : ''
                } ${isLocked ? 'disabled-option opacity-60 cursor-not-allowed' : 'hover:bg-purple-600 hover:text-white'}`}
              >
                {String.fromCharCode(65 + idx)}. {opt}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={skipQuestion}
              className="w-1/3 bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition"
              disabled={isLocked}
            >
              <i className="fas fa-forward mr-2"></i> Skip
            </button>
            <button 
              onClick={nextQuestion}
              className="w-2/3 bg-gray-800 text-white font-bold py-3 rounded-xl hover:bg-gray-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isLocked}
            >
              {currentIndex + 1 === questions.length ? 'Finish' : 'Next'} <i className="fas fa-arrow-right ml-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {isComplete && (
        <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl text-center">
          <i className="fas fa-trophy text-6xl text-yellow-500 mb-4"></i>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Quiz Completed!</h2>
          <p className="text-gray-600 mb-4">Your Performance</p>
          <div className="text-5xl font-bold text-purple-600 mb-4">
            {score} / {questions.length}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-4 rounded-full" style={{ width: `${percentage}%` }}></div>
          </div>
          <p className="text-lg font-semibold mb-6">
            {percentage >= 80 ? '🎉 Outstanding!' :
             percentage >= 60 ? '👍 Great job!' :
             percentage >= 40 ? '📚 Good effort!' :
             '📖 Keep practicing!'}
          </p>
          <button 
            onClick={restartQuiz}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition"
          >
            <i className="fas fa-redo-alt mr-2"></i> Try Another Quiz
          </button>
        </div>
      )}
    </div>
  )
}
