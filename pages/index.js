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
  
  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, category')
    .order('title')
    .limit(50)

  return {
    props: {
      stats: { books: booksCount || 0, questions: questionsCount || 0 },
      books: books || [],
    },
    revalidate: 3600
  }
}

export default function Home({ stats, books }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4">
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
            <a href="/quiz" className="nav-link">📝 Quiz</a>
            <a href="/practice" className="nav-link">📚 Practice</a>
            <a href="/contact" className="nav-link">📧 Contact</a>
            <a href="/privacy" className="nav-link">🔒 Privacy</a>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn text-white text-2xl">☰</button>
        </div>
      </nav>

      {/* MOBILE DROPDOWN */}
      <div id="mobileDropdown" className={`${mobileOpen ? 'block' : 'hidden'} bg-white rounded-xl shadow-xl w-full mb-4 py-2 z-50`}>
        <a href="/" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">🏠 Home</a>
        <a href="/quiz" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">📝 Quiz</a>
        <a href="/practice" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">📚 Practice</a>
        <a href="/contact" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">📧 Contact</a>
        <a href="/privacy" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">🔒 Privacy</a>
      </div>

      {/* MAIN CONTENT */}
      <div className="quiz-card">
        <div className="flex flex-col items-center">
          <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full p-4 mb-6">
            <i className="fas fa-graduation-cap text-5xl text-purple-600"></i>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">BookMCQ | Master MCQs for Every Exam</h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto mb-8 text-center">
            Your ultimate platform for chapter-wise practice tests from hundreds of books.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full mt-2 mb-8">
            <div className="stats-card" onClick={() => window.location.href = '/practice'}>
              <i className="fas fa-book text-4xl mb-3 opacity-80"></i>
              <div className="stats-number">{stats.books}+</div>
              <p className="text-sm font-semibold mt-2">Books & Categories</p>
            </div>
            <div className="stats-card" onClick={() => window.location.href = '/quiz'}>
              <i className="fas fa-question-circle text-4xl mb-3 opacity-80"></i>
              <div className="stats-number">{stats.questions}+</div>
              <p className="text-sm font-semibold mt-2">Practice Questions</p>
            </div>
            <div className="stats-card" onClick={() => window.location.href = '/quiz'}>
              <i className="fas fa-chart-line text-4xl mb-3 opacity-80"></i>
              <div className="stats-number">Track</div>
              <p className="text-sm font-semibold mt-2">Your Progress</p>
            </div>
          </div>

          {/* Books Section */}
          <div className="w-full mt-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📚 Available Books</h2>
            <div className="books-grid">
              {books.slice(0, 20).map((book, index) => (
                <div key={book.id} className="book-list-item" onClick={() => window.location.href = `/quiz/${book.id}`}>
                  <div className="book-info flex items-center gap-3">
                    <div className="book-number bg-purple-100 text-purple-700 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">{index + 1}</div>
                    <div>
                      <div className="book-title">{book.title}</div>
                      {book.author && <div className="book-author">{book.author}</div>}
                      {book.category && <div className="book-category">{book.category}</div>}
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400 text-sm"></i>
                </div>
              ))}
            </div>
          </div>

          <Link href="/quiz" className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:opacity-90 transition shadow-lg">
            Start Practicing Now <i className="fas fa-arrow-right ml-2"></i>
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 text-center text-white/60 text-xs py-6">
        <p>&copy; 2025 BookMCQ. All rights reserved. | Master Every Chapter</p>
      </footer>
    </div>
  )
}
