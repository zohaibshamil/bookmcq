import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export async function getStaticProps() {
  const { count: booksCount } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
  
  const { count: questionsCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  
  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, category')
    .order('title')
    .limit(50)

  // Get unique subjects
  const { data: allBooks } = await supabase
    .from('books')
    .select('category')
  
  const uniqueCategories = [...new Set((allBooks || []).map(b => b.category).filter(Boolean))]

  return {
    props: {
      stats: { books: booksCount || 0, questions: questionsCount || 0 },
      categories: categories || [],
      books: books || [],
      subjects: uniqueCategories || [],
    },
    revalidate: 3600
  }
}

export default function Home({ stats, categories, books, subjects }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [filteredBooks, setFilteredBooks] = useState(books)
  const [newsItems, setNewsItems] = useState([])
  const [newsVisible, setNewsVisible] = useState(true)

  // Navbar scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Filter books by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredBooks(books)
    } else {
      setFilteredBooks(books.filter(b => b.category === selectedCategory))
    }
  }, [selectedCategory, books])

  // Load news ticker
  useEffect(() => {
    loadNews()
  }, [])

  async function loadNews() {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: recentBooks } = await supabase
        .from('books')
        .select('title, author, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3)

      const { data: recentTopics } = await supabase
        .from('topics')
        .select('name, book_id, created_at, books(title)')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(3)

      const items = []

      recentBooks?.forEach(book => {
        items.push({
          icon: '📚',
          text: `New Book Added: "${book.title}"${book.author ? ` by ${book.author}` : ''}`
        })
      })

      recentTopics?.forEach(topic => {
        const bookTitle = topic.books?.title || 'Unknown Book'
        items.push({
          icon: '📖',
          text: `New Chapter Added: "${topic.name}" in "${bookTitle}"`
        })
      })

      setNewsItems(items.slice(0, 10))
    } catch (error) {
      console.error('News error:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 disable-select">
      {/* NAVBAR */}
      <nav className={`bg-white/10 backdrop-blur-lg rounded-full px-4 md:px-6 py-3 mb-8 sticky top-4 z-50 shadow-lg ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="fas fa-graduation-cap text-white text-xl md:text-2xl"></i>
            <span className="text-white font-bold text-lg md:text-xl">BookMCQ</span>
            <span className="text-white/60 text-xs hidden sm:inline">| Master Every Chapter</span>
          </div>
          <div className="desktop-menu flex gap-3 md:gap-6">
            <a href="/" className="nav-link active">🏠 Home</a>
            <a href="/quiz" className="nav-link text-white/80 hover:text-white transition flex items-center gap-1">
              📝 Quiz <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">FREE</span>
            </a>
            <a href="/practice" className="nav-link text-white/80 hover:text-white transition flex items-center gap-1">
              📚 Practice <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">FREE</span>
            </a>
            <a href="/contact" className="nav-link text-white/80 hover:text-white transition">📧 Contact</a>
            <a href="/privacy" className="nav-link text-white/80 hover:text-white transition">🔒 Privacy</a>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn text-white text-2xl">☰</button>
        </div>
      </nav>

      {/* MOBILE DROPDOWN */}
      <div id="mobileDropdown" className={`${mobileOpen ? 'block' : 'hidden'} bg-white rounded-xl shadow-xl w-full mb-4 py-2 z-50`}>
        <a href="/" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">🏠 Home</a>
        <a href="/quiz" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition flex justify-between items-center">
          📝 Quiz <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">FREE</span>
        </a>
        <a href="/practice" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition flex justify-between items-center">
          📚 Practice <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">FREE</span>
        </a>
        <a href="/contact" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">📧 Contact</a>
        <a href="/privacy" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">🔒 Privacy</a>
      </div>

      {/* NEWS TICKER */}
      {newsVisible && newsItems.length > 0 && (
        <div className="news-ticker-container">
          <div className="news-ticker">
            <div className="news-ticker-label">
              <i className="fas fa-bullhorn"></i>
              <span>NEWS</span>
            </div>
            <div className="ticker-wrapper">
              <div className="ticker-track">
                {newsItems.map((item, idx) => (
                  <div key={idx} className="ticker-item">
                    <span>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
                {newsItems.map((item, idx) => (
                  <div key={`dup-${idx}`} className="ticker-item">
                    <span>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setNewsVisible(false)} className="close-news-btn">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full p-4 mb-6">
            <i className="fas fa-graduation-cap text-5xl text-purple-600"></i>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">BookMCQ | Master MCQs for Every Exam</h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto mb-8 text-center">
            Your ultimate platform for chapter-wise practice tests from hundreds of books. 
            Master any subject with our difficulty-based MCQ system. Everything you need is right here.
          </p>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-8 w-full mt-2 mb-8">
            <div className="stats-card rounded-2xl p-5 md:p-7 text-center cursor-pointer shadow-xl" onClick={() => window.location.href = '/practice'}>
              <i className="fas fa-book text-4xl md:text-5xl mb-3 opacity-80"></i>
              <div className="stats-number">{stats.books}+</div>
              <p className="text-sm md:text-base mt-2 font-semibold">Books & Categories</p>
              <p className="text-xs mt-1 opacity-70">Browse by subject →</p>
            </div>
            <div className="stats-card rounded-2xl p-5 md:p-7 text-center cursor-pointer shadow-xl" onClick={() => window.location.href = '/quiz'}>
              <i className="fas fa-question-circle text-4xl md:text-5xl mb-3 opacity-80"></i>
              <div className="stats-number">{stats.questions}+</div>
              <p className="text-sm md:text-base mt-2 font-semibold">Practice Questions</p>
              <p className="text-xs mt-1 opacity-70">Start quiz now →</p>
            </div>
            <div className="stats-card rounded-2xl p-5 md:p-7 text-center cursor-pointer shadow-xl" onClick={() => window.location.href = '/quiz'}>
              <i className="fas fa-chart-line text-4xl md:text-5xl mb-3 opacity-80"></i>
              <div className="stats-number">Track</div>
              <p className="text-sm md:text-base mt-2 font-semibold">Your Progress</p>
              <p className="text-xs mt-1 opacity-70">Monitor improvement →</p>
            </div>
          </div>

          {/* ABOUT SECTION */}
          <div className="about-preview rounded-2xl p-6 mb-8 w-full text-left">
            <div className="flex items-center gap-3 mb-4">
              <i className="fas fa-book-open text-2xl text-purple-600"></i>
              <h2 className="text-xl font-bold text-gray-800">About BookMCQ</h2>
            </div>
            <div style={{ textAlign: 'justify', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
              <p>Our mission is to provide a comprehensive, accessible, and effective platform for students and professionals to test their knowledge across hundreds of books and subjects. Whether you're preparing for government jobs, private sector recruitment, or competitive examinations worldwide, BookMCQ has everything you need.</p>
              
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                <li><strong>One Paper MCQ Preparation</strong> – Master the art of solving multiple-choice questions for CSS, PMS, UPSC, FPSC, PPSC, SPSC, BPSC, IBPS, SSC, Banking, and other competitive exams.</li>
                <li><strong>One Paper MCQ</strong> – Complete preparation for competitive exams:
                  <ul style={{ paddingLeft: '1.2rem' }}>
                    <li><strong>Government Jobs</strong> – CSS, PMS, UPSC, FPSC, PPSC, SPSC, BPSC preparation</li>
                    <li><strong>Private Jobs</strong> – Banking, IT, Management, and Corporate recruitment tests</li>
                    <li><strong>Subject-wise Practice</strong> – Mathematics, English, General Knowledge, Current Affairs, Computer Science, Physics, Chemistry, Biology, and more</li>
                    <li><strong>Difficulty-based questions</strong> (Easy, Medium, Hard)</li>
                    <li><strong>Instant feedback and explanations</strong></li>
                    <li><strong>Progress tracking & Performance analytics</strong></li>
                  </ul>
                </li>
              </ul>
              
              <p className="mt-2">With hundreds of books and thousands of carefully crafted questions, BookMCQ is the most comprehensive MCQ platform for students preparing for government jobs, private jobs, competitive exams, and academic success worldwide.</p>
            </div>
            
            {/* Dynamic Subjects */}
            <div className="mt-4 pt-2">
              <p className="text-sm text-gray-500">
                <i className="fas fa-spinner fa-spin mr-1"></i> 
                <span>📚 Available Subjects: {subjects.join(', ')}</span>
              </p>
            </div>
            
            {/* Categories */}
            <div className="mt-6 pt-4 border-t border-purple-200">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <i className="fas fa-tags text-purple-600"></i> Browse by Category
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === 'all' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white'}`}
                >
                  📚 All Books
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === cat.name ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-600 hover:text-white'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              
              <div className="bg-white/50 rounded-xl p-4 max-h-80 overflow-y-auto">
                {filteredBooks.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No books found in this category</p>
                ) : (
                  <div className="books-grid">
                    {filteredBooks.map((book, index) => (
                      <div key={book.id} className="book-list-item" onClick={() => window.location.href = `/quiz/${book.id}`}>
                        <div className="book-info">
                          <div className="book-number">{index + 1}</div>
                          <div>
                            <div className="book-title">{book.title}</div>
                            {book.author && <div className="book-author">{book.author}</div>}
                            {book.category && <div className="book-category">📁 {book.category}</div>}
                          </div>
                        </div>
                        <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-4 text-center">Click on any book to start practicing</p>
              </div>
            </div>
          </div>

          {/* EXAM PREPARATION SECTION */}
          <div className="w-full mt-4 mb-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Everything for Your Exam Preparation</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 mx-auto rounded-full"></div>
            </div>
            
            <div
