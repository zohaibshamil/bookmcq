import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export async function getStaticProps() {
  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, category')
    .order('title')
    .limit(50)

  return {
    props: { books: books || [] },
    revalidate: 3600
  }
}

export default function QuizBooks({ books }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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
            <a href="/" className="nav-link text-white/80 hover:text-white transition">🏠 Home</a>
            <a href="/quiz" className="nav-link active text-white transition flex items-center gap-1">📝 Quiz <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">FREE</span></a>
            <a href="/practice" className="nav-link text-white/80 hover:text-white transition flex items-center gap-1">📚 Practice <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">FREE</span></a>
            <a href="/contact" className="nav-link text-white/80 hover:text-white transition">📧 Contact</a>
            <a href="/privacy" className="nav-link text-white/80 hover:text-white transition">🔒 Privacy</a>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn text-white text-2xl">☰</button>
        </div>
      </nav>

      {/* MOBILE DROPDOWN */}
      <div id="mobileDropdown" className={`${mobileOpen ? 'block' : 'hidden'} bg-white rounded-xl shadow-xl w-full mb-4 py-2 z-50`}>
        <a href="/" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">🏠 Home</a>
        <a href="/quiz" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition flex justify-between items-center">📝 Quiz <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">FREE</span></a>
        <a href="/practice" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition flex justify-between items-center">📚 Practice <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">FREE</span></a>
        <a href="/contact" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">📧 Contact</a>
        <a href="/privacy" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">🔒 Privacy</a>
      </div>

      {/* MAIN CONTENT */}
      <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <i className="fas fa-filter text-purple-600"></i> Filter Questions
        </h2>
        <p className="text-gray-600 mb-6">Select a book to start practicing MCQs</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map(book => (
            <Link key={book.id} href={`/quiz/${book.id}`}>
              <div className="p-4 bg-white rounded-xl shadow hover:shadow-lg transition border border-purple-100 cursor-pointer">
                <h3 className="font-bold text-lg">{book.title}</h3>
                {book.author && <p className="text-gray-600 text-sm">by {book.author}</p>}
                {book.category && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full inline-block mt-2">{book.category}</span>}
              </div>
            </Link>
          ))}
        </div>
        
        {books.length === 0 && (
          <p className="text-gray-500 text-center py-8">No books available yet.</p>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-12 text-center text-white/60 text-xs md:text-sm py-6">
        <p>&copy; 2025 BookMCQ. All rights reserved. | Master Every Chapter</p>
      </footer>
    </div>
  )
}
