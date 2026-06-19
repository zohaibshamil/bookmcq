import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import NewsTicker from '../components/NewsTicker'

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
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [filteredBooks, setFilteredBooks] = useState(books)

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredBooks(books)
    } else {
      setFilteredBooks(books.filter(b => b.category === selectedCategory))
    }
  }, [selectedCategory, books])

  return (
    <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl">
      <NewsTicker />
      
      <div className="flex flex-col items-center">
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full p-4 mb-6">
          <i className="fas fa-graduation-cap text-5xl text-purple-600"></i>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">BookMCQ | Master MCQs for Every Exam</h1>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto mb-8 text-center">
          Your ultimate platform for chapter-wise practice tests from hundreds of books. 
          Master any subject with our difficulty-based MCQ system. Everything you need is right here.
        </p>
        
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
        
        <div className="about-preview rounded-2xl p-6 mb-8 w-full text-left">
          <div className="flex items-center gap-3 mb-4">
            <i className="fas fa-book-open text-2xl text-purple-600"></i>
            <h2 className="text-xl font-bold text-gray-800">About BookMCQ</h2>
          </div>
          <div style={{ textAlign: 'justify', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
            <p>Our mission is to provide a comprehensive, accessible, and effective platform for students and professionals to test their knowledge across hundreds of books and subjects. Whether you're preparing for government jobs, private sector recruitment, or competitive examinations worldwide, BookMCQ has everything you need.</p>
            
            <ul style={{ paddingLeft: '1.2rem' }}>
              <li><strong>One Paper MCQ Preparation</strong> – Master the art of solving multiple-choice questions for CSS, PMS, UPSC, FPSC, PPSC, SPSC, BPSC, IBPS, SSC, Banking, and other competitive exams.</li>
              <li><strong>One Paper MCQ</strong> – Complete preparation for competitive exams:
                <ul>
                  <li><strong>Government Jobs</strong> – CSS, PMS, UPSC, FPSC, PPSC, SPSC, BPSC preparation</li>
                  <li><strong>Private Jobs</strong> – Banking, IT, Management, and Corporate recruitment tests</li>
                  <li><strong>Subject-wise Practice</strong> – Mathematics, English, General Knowledge, Current Affairs, Computer Science, Physics, Chemistry, Biology, and more</li>
                  <li><strong>Difficulty-based questions</strong> (Easy, Medium, Hard)</li>
                  <li><strong>Instant feedback and explanations</strong></li>
                  <li><strong>Progress tracking & Performance analytics</strong></li>
                </ul>
              </li>
            </ul>
            
            <p>With hundreds of books and thousands of carefully crafted questions, BookMCQ is the most comprehensive MCQ platform for students preparing for government jobs, private jobs, competitive exams, and academic success worldwide.</p>
          </div>
          
          <div className="mt-4 pt-2">
            <p className="text-sm text-gray-500">
              <i className="fas fa-spinner fa-spin mr-1"></i> 
              <span>📚 Available Subjects: {subjects.join(', ')}</span>
            </p>
          </div>
          
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
                    <div key={book.id} className="book-list-item" onClick={() => window.location.href = '/quiz'}>
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
        
        <div className="w-full mt-4 mb-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Everything for Your Exam Preparation</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="exam-grid">
            <div className="exam-card"><div className="exam-icon">🎓</div><h3 className="exam-title">SAT</h3><p className="exam-subjects">Math (Algebra, Data, Geometry) · Reading & Writing</p><div className="exam-books"><i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> Kaplan, Princeton Review, College Board</div></div>
            <div className="exam-card"><div className="exam-icon">✍️</div><h3 className="exam-title">ACT</h3><p className="exam-subjects">English · Math · Reading · Science (Optional)</p><div className="exam-books"><i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> Barron's, Princeton Review, Magoosh</div></div>
            <div className="exam-card"><div className="exam-icon">📊</div><h3 className="exam-title">GRE</h3><p className="exam-subjects">Quant (Math) · Verbal · Analytical Writing</p><div className="exam-books"><i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> Manhattan Review, Kaplan, ETS</div></div>
            <div className="exam-card"><div className="exam-icon">💼</div><h3 className="exam-title">GMAT</h3><p className="exam-subjects">Quant · Verbal · Data Insights</p><div className="exam-books"><i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> GMAC, Manhattan Prep, PowerScore</div></div>
            <div className="exam-card"><div className="exam-icon">🔬</div><h3 className="exam-title">AP & IB</h3><p className="exam-subjects">Calculus, Biology, Chemistry, Physics, English, Statistics</p><div className="exam-books"><i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> Princeton Review, Cambridge, Norton</div></div>
            <div className="exam-card"><div className="exam-icon">⚡</div><h3 className="exam-title">JEE & NEET</h3><p className="exam-subjects">Physics · Chemistry · Math (JEE) · Biology (NEET)</p><div className="exam-books"><i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> NCERT, H.C. Verma, Irodov, DC Pandey</div></div>
          </div>
        </div>
        
        <Link href="/quiz" legacyBehavior>
          <a className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-bold hover:opacity-90 transition shadow-lg text-sm md:text-base inline-block">
            Start Practicing Now <i className="fas fa-arrow-right ml-2"></i>
          </a>
        </Link>
      </div>
    </div>
  )
}
