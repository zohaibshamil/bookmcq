import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export async function getStaticPaths() {
  const { data: books } = await supabase
    .from('books')
    .select('id')
    .limit(50)

  return {
    paths: (books || []).map(book => ({
      params: { bookId: String(book.id) }
    })),
    fallback: 'blocking'
  }
}

export async function getStaticProps({ params }) {
  const bookId = parseInt(params.bookId)

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  const { data: topics } = await supabase
    .from('topics')
    .select('id, name, chapter_number')
    .eq('book_id', bookId)
    .order('chapter_number')

  // Get MCQ counts
  const topicIds = (topics || []).map(t => t.id)
  const { data: questions } = await supabase
    .from('questions')
    .select('topic_id')
    .in('topic_id', topicIds.length > 0 ? topicIds : [0])

  const mcqCounts = {}
  ;(questions || []).forEach(q => {
    mcqCounts[q.topic_id] = (mcqCounts[q.topic_id] || 0) + 1
  })

  return {
    props: {
      book: book || null,
      topics: (topics || []).map(t => ({
        ...t,
        mcqCount: mcqCounts[t.id] || 0
      }))
    },
    revalidate: 3600
  }
}

export default function BookPage({ book, topics }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const totalMcqs = topics.reduce((sum, t) => sum + t.mcqCount, 0)

  if (!book) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="quiz-card rounded-2xl p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600">Book not found</h2>
          <Link href="/quiz" className="text-purple-600 hover:underline">← Back to books</Link>
        </div>
      </div>
    )
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
        <Link href="/quiz" className="text-purple-600 hover:underline mb-4 inline-block">← Back to books</Link>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{book.title}</h1>
        {book.author && <p className="text-gray-600">by {book.author}</p>}
        {book.category && <span className="text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded-full inline-block mt-2">{book.category}</span>}
        
        <div className="mt-4 flex gap-4">
          <span className="text-sm text-gray-600">📚 {topics.length} Chapters</span>
          <span className="text-sm text-gray-600">❓ {totalMcqs} MCQs</span>
        </div>

        <h2 className="text-xl font-bold mt-6 mb-4">Chapters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topics.map(topic => (
            <div key={topic.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition">
              <div>
                <span className="text-sm text-purple-600">Ch {topic.chapter_number}</span>
                <span className="font-medium ml-2">{topic.name}</span>
              </div>
              <span className="text-sm bg-white px-3 py-1 rounded-full shadow-sm">
                {topic.mcqCount} MCQs
              </span>
            </div>
          ))}
        </div>
        
        {topics.length === 0 && (
          <p className="text-gray-500 text-center py-8">No chapters available for this book yet.</p>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-12 text-center text-white/60 text-xs md:text-sm py-6">
        <p>&copy; 2025 BookMCQ. All rights reserved. | Master Every Chapter</p>
      </footer>
    </div>
  )
}
