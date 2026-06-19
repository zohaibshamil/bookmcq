import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [stats, setStats] = useState({ books: 0, questions: 0 })
  const [categories, setCategories] = useState([])
  const [books, setBooks] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    loadStats()
    loadCategories()
    loadBooks()
  }, [])

  async function loadStats() {
    try {
      const { count: booksCount } = await supabase.from('books').select('*', { count: 'exact', head: true })
      const { count: questionsCount } = await supabase.from('questions').select('*', { count: 'exact', head: true })
      setStats({ books: booksCount || 0, questions: questionsCount || 0 })
    } catch (e) { console.error(e) }
  }

  async function loadCategories() {
    try {
      const { data } = await supabase.from('categories').select('*').order('name')
      setCategories(data || [])
    } catch (e) { console.error(e) }
  }

  async function loadBooks() {
    try {
      const { data } = await supabase.from('books').select('id, title, author, category').order('title')
      setBooks(data || [])
    } catch (e) { console.error(e) }
  }

  const filteredBooks = selectedCategory === 'all' 
    ? books 
    : books.filter(book => book.category === selectedCategory)

  return (
    <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="flex flex-col items-center">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full p-4 mb-6">
          <i className="fas fa-graduation-cap text-5xl text-purple-600"></i>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          BookMCQ | Master MCQs for Every Exam
        </h1>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto mb-8 text-center">
          Your ultimate platform for chapter-wise practice tests from hundreds of books.
          Master any subject with our difficulty-based MCQ system.
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-8 w-full mt-2 mb-8">
          <div className="stats-card rounded-2xl p-5 md:p-7 text-center cursor-pointer shadow-xl" 
               style={{ background: 'linear-gradient(135deg, #c7d2fe 0%, #ddd6fe 100%)' }}
               onClick={() => window.location.href = '/practice'}>
            <i className="fas fa-book text-4xl md:text-5xl mb-3 opacity-80"></i>
            <div className="stats-number text-2xl md:text-3xl font-bold text-purple-800">
              {stats.books}+
            </div>
            <p className="text-sm md:text-base mt-2 font-semibold">Books & Categories</p>
          </div>

          <div className="stats-card rounded-2xl p-5 md:p-7 text-center cursor-pointer shadow-xl"
               style={{ background: 'linear-gradient(135deg, #bfdbfe 0%, #c7d2fe 100%)' }}
               onClick={() => window.location.href = '/quiz'}>
            <i className="fas fa-question-circle text-4xl md:text-5xl mb-3 opacity-80"></i>
            <div className="stats-number text-2xl md:text-3xl font-bold text-purple-800">
              {stats.questions}+
            </div>
            <p className="text-sm md:text-base mt-2 font-semibold">Practice Questions</p>
          </div>

          <div className="stats-card rounded-2xl p-5 md:p-7 text-center cursor-pointer shadow-xl"
               style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' }}
               onClick={() => window.location.href = '/quiz'}>
            <i className="fas fa-chart-line text-4xl md:text-5xl mb-3 opacity-80"></i>
            <div className="stats-number text-2xl md:text-3xl font-bold text-purple-800">
              Track
            </div>
            <p className="text-sm md:text-base mt-2 font-semibold">Your Progress</p>
          </div>
        </div>

        {/* About Section */}
        <div className="about-preview rounded-2xl p-6 mb-8 w-full text-left" 
             style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
          <div className="flex items-center gap-3 mb-4">
            <i className="fas fa-book-open text-2xl text-purple-600"></i>
            <h2 className="text-xl font-bold text-gray-800">About BookMCQ</h2>
          </div>
          <div style={{ textAlign: 'justify', lineHeight: 1.6 }}>
            <p className="mb-3">
              Our mission is to provide a comprehensive, accessible, and effective platform for students and professionals to test their knowledge across hundreds of books and subjects. Whether you're preparing for government jobs, private sector recruitment, or competitive examinations worldwide, BookMCQ has everything you need.
            </p>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li><strong>One Paper MCQ Preparation</strong> – CSS, PMS, UPSC, FPSC, PPSC, SPSC, BPSC, IBPS, SSC, Banking</li>
              <li><strong>Government Jobs</strong> – Complete preparation for all government exams</li>
              <li><strong>Private Jobs</strong> – Banking, IT, Management, Corporate recruitment</li>
              <li><strong>Subject-wise Practice</strong> – Mathematics, English, GK, Current Affairs, Computer Science, Physics, Chemistry, Biology</li>
              <li><strong>Difficulty-based questions</strong> (Easy, Medium, Hard)</li>
            </ul>
          </div>

          {/* Categories Section */}
          <div className="mt-6 pt-4 border-t border-purple-200">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <i className="fas fa-tags text-purple-600"></i> Browse by Category
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === 'all' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white'
                }`}
              >
                📚 All Books
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedCategory === cat.name 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="bg-white/50 rounded-xl p-4 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredBooks.map((book, index) => (
                  <div 
                    key={book.id}
                    className="book-list-item p-3 bg-white rounded-xl border border-purple-100 hover:bg-purple-50 transition cursor-pointer flex items-center justify-between"
                    onClick={() => window.location.href = '/quiz'}
                  >
                    <div className="flex items-center gap-3">
                      <span className="bg-purple-100 text-purple-700 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{book.title}</div>
                        {book.author && <div className="text-xs text-gray-500">{book.author}</div>}
                        {book.category && <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mt-1 inline-block">{book.category}</span>}
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Exam Cards */}
        <div className="w-full mt-4 mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Everything for Your Exam Preparation
          </h2>
          <div className="exam-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: '🎓', title: 'SAT', subjects: 'Math, Reading & Writing', books: 'Kaplan, Princeton Review' },
              { icon: '✍️', title: 'ACT', subjects: 'English, Math, Reading, Science', books: "Barron's, Princeton Review" },
              { icon: '📊', title: 'GRE', subjects: 'Quant, Verbal, Writing', books: 'Manhattan Review, Kaplan' },
              { icon: '💼', title: 'GMAT', subjects: 'Quant, Verbal, Data Insights', books: 'GMAC, Manhattan Prep' },
              { icon: '🔬', title: 'AP & IB', subjects: 'Calculus, Biology, Chemistry', books: 'Princeton Review, Cambridge' },
              { icon: '⚡', title: 'JEE & NEET', subjects: 'Physics, Chemistry, Math', books: 'NCERT, H.C. Verma' }
            ].map((exam, i) => (
              <div key={i} className="exam-card p-5 rounded-xl bg-white shadow-sm border-t-4 transition hover:shadow-md"
                   style={{ borderTopColor: ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f59e0b', '#ea580c'][i] }}>
                <div className="exam-icon w-12 h-12 flex items-center justify-center rounded-xl mb-3 text-2xl"
                     style={{ background: ['#dbeafe', '#d1fae5', '#fee2e2', '#ede9fe', '#fef3c7', '#ffedd5'][i] }}>
                  {exam.icon}
                </div>
                <h3 className="font-bold text-lg mb-1">{exam.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{exam.subjects}</p>
                <div className="text-xs text-purple-600 border-t border-purple-100 pt-2 mt-1">
                  <i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> {exam.books}
                </div>
              </div>
            ))}
          </div>
        </div>

        <a href="/quiz" className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-bold hover:opacity-90 transition shadow-lg text-sm md:text-base inline-block">
          Start Practicing Now <i className="fas fa-arrow-right ml-2"></i>
        </a>
      </div>
    </div>
  )
}
