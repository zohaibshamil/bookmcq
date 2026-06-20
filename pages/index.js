import Head from 'next/head'

export async function getStaticProps() {
  const supabaseUrl = 'https://wnsuuazwcxmuwqyphvse.supabase.co'
  const supabaseKey = 'sb_publishable_qsQzf3RycZtO8Uj1hd3mcg_jaX6iQ9C'
  
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseKey)
  
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

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentBooks } = await supabase
    .from('books')
    .select('title, author, created_at')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  const { data: recentTopics } = await supabase
    .from('topics')
    .select('name, book_id, created_at, books(title)')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(5)

  const newsItems = []
  recentBooks?.forEach(book => {
    newsItems.push({
      icon: '📚',
      text: `New Book Added: "${book.title}"${book.author ? ` by ${book.author}` : ''}`
    })
  })
  recentTopics?.forEach(topic => {
    const bookTitle = topic.books?.title || 'Unknown Book'
    newsItems.push({
      icon: '📖',
      text: `New Chapter Added: "${topic.name}" in "${bookTitle}"`
    })
  })

  return {
    props: {
      stats: { books: booksCount || 0, questions: questionsCount || 0 },
      categories: categories || [],
      books: books || [],
      subjects: uniqueCategories || [],
      newsItems: newsItems.slice(0, 10),
    },
    revalidate: 3600
  }
}

export default function Home({ stats, categories, books: initialBooks, subjects, newsItems: initialNewsItems }) {
  return (
    <>
      <Head>
        <title>BookMCQ - Master Any Book | One Paper MCQ | Govt & Private Job Preparation</title>
        <meta name="description" content="Practice One Paper MCQs for government jobs, private jobs, and competitive exams worldwide. Subject-wise, topic-wise, and difficulty-based questions from hundreds of books. Prepare for CSS, PMS, UPSC, FPSC, PPSC, SPSC, BPSC, SSC, Banking, and more." />
        <meta name="keywords" content="One Paper MCQ, government job preparation, private job test, competitive exam preparation, CSS MCQs, PMS MCQs, UPSC MCQs, FPSC MCQs, PPSC MCQs, SPSC MCQs, BPSC MCQs, subject-wise MCQs, topic-wise practice, exam preparation, online test, study guide, SAT prep, GRE prep, GMAT prep, ACT prep, JEE prep, NEET prep, AP exam, IB exam" />
        <meta name="author" content="BookMCQ" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href="https://bookmcq.com/" />
        <link rel="alternate" href="https://bookmcq.com/" hreflang="en" />
        <link rel="alternate" href="https://bookmcq.com/" hreflang="x-default" />
        <link rel="alternate" href="https://bookmcq.com/" hreflang="en-us" />
        <link rel="alternate" href="https://bookmcq.com/" hreflang="en-gb" />
        <link rel="alternate" href="https://bookmcq.com/" hreflang="en-in" />
        <link rel="alternate" href="https://bookmcq.com/" hreflang="en-pk" />
        <meta property="og:title" content="BookMCQ - One Paper MCQ | Govt & Private Job Preparation" />
        <meta property="og:description" content="Practice subject-wise MCQs for government jobs, private jobs, and competitive exams worldwide. One paper preparation made easy." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bookmcq.com" />
        <meta property="og:site_name" content="BookMCQ" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BookMCQ - One Paper MCQ | Govt & Private Job Preparation" />
        <meta name="theme-color" content="#7c3aed" />
        
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": "BookMCQ",
            "url": "https://bookmcq.com",
            "description": "Practice One Paper MCQs for government jobs, private jobs, and competitive exams worldwide.",
            "sameAs": ["https://twitter.com/bookmcq", "https://www.facebook.com/bookmcq"]
          })
        }} />
        
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-5WGZ1P0EV1" />
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5WGZ1P0EV1');
          `
        }} />
        
        <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* 
        ============================================
        IMPORTANT FIX: ALL CSS MUST BE IN style JSX
        ============================================
      */}
      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .disable-select { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
        .disable-select img, .disable-select video { pointer-events: none; }
        
        .quiz-card { backdrop-filter: blur(10px); background: rgba(255,255,255,0.95); transition: transform 0.3s ease, box-shadow 0.3s ease; border-radius: 1.5rem; overflow: hidden; }
        .quiz-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        
        .nav-link { position: relative; transition: all 0.3s ease; }
        .nav-link::after { content: ''; position: absolute; bottom: -5px; left: 0; width: 0; height: 2px; background: white; transition: width 0.3s ease; }
        .nav-link:hover::after, .nav-link.active::after { width: 100%; }
        
        .navbar-scrolled { background: white !important; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .navbar-scrolled .nav-link { color: #4a5568 !important; }
        .navbar-scrolled .nav-link:hover { color: #667eea !important; }
        .navbar-scrolled .nav-link::after { background: #667eea !important; }
        .navbar-scrolled .text-white { color: #2d3748 !important; }
        .navbar-scrolled .text-white\\/60 { color: #718096 !important; }
        .navbar-scrolled i { color: #667eea !important; }
        
        .mobile-menu-btn { display: none; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
        @media (max-width: 768px) { .desktop-menu { display: none !important; } .mobile-menu-btn { display: block; } }
        @media (min-width: 769px) { .mobile-menu-btn { display: none; } #mobileDropdown { display: none !important; } }
        
        .stats-card { background: linear-gradient(135deg, #c7d2fe 0%, #ddd6fe 100%); transition: all 0.3s ease; cursor: pointer; position: relative; overflow: hidden; color: #4c1d95; }
        .stats-card:nth-child(2) { background: linear-gradient(135deg, #bfdbfe 0%, #c7d2fe 100%); }
        .stats-card:nth-child(3) { background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); }
        .stats-card::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%); opacity: 0; transition: opacity 0.5s ease; }
        .stats-card:hover::before { opacity: 1; }
        .stats-card:hover { transform: translateY(-8px); box-shadow: 0 25px 40px -12px rgba(0,0,0,0.2); }
        .stats-number { font-size: 2.5rem; font-weight: 800; color: #4c1d95; }
        @media (min-width: 768px) { .stats-number { font-size: 3rem; } }
        .stats-card p { color: #5b21b6; }
        .stats-card .text-xs { color: #6d28d9; }
        
        .about-preview { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); }
        
        .category-filter-btn { transition: all 0.2s ease; }
        .category-filter-btn:hover { background-color: #7c3aed; color: white; transform: translateY(-2px); }
        .category-filter-btn.active { background-color: #7c3aed; color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        
        .books-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
        .book-list-item { transition: all 0.2s ease; cursor: pointer; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: white; border-radius: 12px; border: 1px solid #f3e8ff; }
        .book-list-item:hover { background-color: #f3e8ff; transform: translateX(5px); border-color: #d8b4fe; }
        .book-list-item .book-info { flex: 1; display: flex; align-items: center; gap: 12px; }
        .book-number { background: #f3e8ff; color: #7c3aed; border-radius: 9999px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
        .book-title { font-weight: 500; color: #1f2937; font-size: 14px; }
        .book-author { font-size: 11px; color: #6b7280; }
        .book-category { font-size: 10px; color: #8b5cf6; background: #f3e8ff; padding: 2px 8px; border-radius: 20px; display: inline-block; margin-top: 4px; }
        
        .exam-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .exam-card { border-radius: 1rem; padding: 1.5rem; transition: all 0.3s ease; position: relative; overflow: hidden; color: #1f2937; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f3e8ff; }
        .exam-card:nth-child(1) { border-top: 4px solid #3b82f6; background: linear-gradient(135deg, #fff 0%, #eff6ff 100%); }
        .exam-card:nth-child(2) { border-top: 4px solid #10b981; background: linear-gradient(135deg, #fff 0%, #ecfdf5 100%); }
        .exam-card:nth-child(3) { border-top: 4px solid #ef4444; background: linear-gradient(135deg, #fff 0%, #fef2f2 100%); }
        .exam-card:nth-child(4) { border-top: 4px solid #8b5cf6; background: linear-gradient(135deg, #fff 0%, #f5f3ff 100%); }
        .exam-card:nth-child(5) { border-top: 4px solid #f59e0b; background: linear-gradient(135deg, #fff 0%, #fffbeb 100%); }
        .exam-card:nth-child(6) { border-top: 4px solid #ea580c; background: linear-gradient(135deg, #fff 0%, #fff7ed 100%); }
        .exam-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at top right, rgba(255,255,255,0.8) 0%, transparent 70%); opacity: 0; transition: opacity 0.4s ease; pointer-events: none; }
        .exam-card:hover::before { opacity: 1; }
        .exam-card:hover { transform: translateY(-4px); box-shadow: 0 15px 30px -12px rgba(0,0,0,0.15); border-color: transparent; }
        .exam-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 14px; margin-bottom: 16px; font-size: 1.6rem; }
        .exam-card:nth-child(1) .exam-icon { background: #dbeafe; }
        .exam-card:nth-child(2) .exam-icon { background: #d1fae5; }
        .exam-card:nth-child(3) .exam-icon { background: #fee2e2; }
        .exam-card:nth-child(4) .exam-icon { background: #ede9fe; }
        .exam-card:nth-child(5) .exam-icon { background: #fef3c7; }
        .exam-card:nth-child(6) .exam-icon { background: #ffedd5; }
        .exam-title { font-weight: 700; font-size: 1.25rem; margin-bottom: 8px; color: #1f2937; letter-spacing: -0.3px; }
        .exam-subjects { font-size: 0.8rem; line-height: 1.5; margin-bottom: 12px; color: #4b5563; }
        .exam-books { font-size: 0.7rem; color: #8b5cf6; border-top: 1px solid #f3e8ff; padding-top: 10px; margin-top: 6px; }
        @media (max-width: 640px) { .exam-grid { grid-template-columns: 1fr; gap: 14px; } .exam-card { padding: 1.25rem; } }
        
        .news-ticker-container { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); border-radius: 12px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .news-ticker { display: flex; align-items: center; position: relative; background: inherit; }
        .news-ticker-label { background: rgba(0,0,0,0.2); padding: 10px 18px; border-radius: 10px 0 0 10px; font-weight: bold; color: white; display: flex; align-items: center; gap: 8px; white-space: nowrap; z-index: 2; backdrop-filter: blur(4px); }
        .news-ticker-label i { font-size: 1.1rem; animation: pulse 1.5s infinite; }
        .news-ticker-label span { letter-spacing: 2px; font-weight: 800; animation: textGlow 1.5s ease-in-out infinite; }
        @keyframes textGlow { 0%, 100% { text-shadow: 0 0 5px rgba(255,255,255,0.8); } 50% { text-shadow: 0 0 15px rgba(255,255,255,1), 0 0 5px #ff416c; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .ticker-wrapper { flex: 1; overflow: hidden; position: relative; height: 50px; }
        .ticker-track { display: flex; align-items: center; white-space: nowrap; position: absolute; left: 0; top: 0; height: 100%; will-change: transform; animation: scrollLeft linear infinite; }
        .ticker-item { display: inline-flex; align-items: center; padding: 0 30px; color: white; font-size: 0.95rem; font-weight: 500; gap: 10px; white-space: nowrap; }
        .ticker-item i { font-size: 1rem; opacity: 0.9; }
        @keyframes scrollLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-wrapper:hover .ticker-track { animation-play-state: paused; }
        .close-news-btn { background: rgba(0,0,0,0.15); border: none; color: white; padding: 10px 16px; cursor: pointer; font-size: 1.2rem; transition: all 0.2s; border-radius: 0 10px 10px 0; }
        .close-news-btn:hover { background: rgba(0,0,0,0.3); }
        @media (max-width: 640px) { .news-ticker-label { padding: 8px 12px; font-size: 0.8rem; } .ticker-item { font-size: 0.75rem; padding: 0 20px; } .ticker-wrapper { height: 44px; } }
        
        .missing-book-card { background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%); border: 2px solid #f59e0b; transition: all 0.3s ease; }
        .missing-book-card:hover { transform: scale(1.02); box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.2); }
        
        .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; background-color: #1f2937; color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        
        .ai-chat-btn { position: fixed; bottom: 30px; right: 30px; z-index: 1000; }
        .ai-chat-window { position: fixed; bottom: 100px; right: 30px; width: 350px; max-width: calc(100vw - 60px); height: 500px; background: white; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.2); z-index: 1001; display: flex; flex-direction: column; overflow: hidden; animation: slideUp 0.3s ease; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .chat-messages { flex: 1; overflow-y: auto; padding: 15px; }
        .chat-message { margin-bottom: 12px; display: flex; }
        .chat-message.user { justify-content: flex-end; }
        .chat-message.bot { justify-content: flex-start; }
        .chat-bubble { max-width: 80%; padding: 10px 14px; border-radius: 18px; font-size: 14px; }
        .chat-message.user .chat-bubble { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-bottom-right-radius: 4px; }
        .chat-message.bot .chat-bubble { background: #f3f4f6; color: #1f2937; border-bottom-left-radius: 4px; }
        .typing-indicator { display: flex; gap: 4px; padding: 10px 14px; }
        .typing-indicator span { width: 8px; height: 8px; background: #9ca3af; border-radius: 50%; animation: typing 1.4s infinite; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-10px); opacity: 1; } }
        
        .page-link { cursor: pointer; }
        
        .category-card { cursor: pointer; transition: all 0.3s ease; }
        .category-card:hover { transform: translateY(-5px); }
        .category-card.active { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        
        .book-card { cursor: pointer; transition: all 0.2s ease; }
        .book-card:hover { background-color: #f3e8ff; transform: translateX(5px); }
        .book-card.selected { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        
        .chapter-card { cursor: pointer; transition: all 0.2s ease; }
        .chapter-card:hover { background-color: #f3e8ff; }
        .chapter-card.selected { background-color: #667eea; color: white; }
        
        @keyframes blinkIcon { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .news-ticker-label:hover { box-shadow: 0 0 20px rgba(255,65,108,0.9); transition: box-shadow 0.3s ease; }
        
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .news-item { transition: all 0.3s ease; }
        .news-item:not(:last-child) { border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px; margin-bottom: 6px; }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 disable-select" id="appRoot">
        
        <nav className="bg-white/10 backdrop-blur-lg rounded-full px-4 md:px-6 py-3 mb-8 sticky top-4 z-50 shadow-lg" id="mainNav">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <i className="fas fa-graduation-cap text-white text-xl md:text-2xl"></i>
              <span className="text-white font-bold text-lg md:text-xl">BookMCQ</span>
              <span className="text-white/60 text-xs hidden sm:inline">| Master Every Chapter</span>
            </div>
            
            <div className="desktop-menu flex gap-3 md:gap-6">
              <a href="/" id="navHome" className="nav-link text-white transition">🏠 Home</a>
              <a href="/quiz" id="navQuiz" className="nav-link text-white/80 hover:text-white transition flex items-center gap-1">📝 Quiz <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">FREE</span></a>
              <a href="/practice" id="navPractice" className="nav-link text-white/80 hover:text-white transition flex items-center gap-1">📚 Practice <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">FREE</span></a>
              <a href="/contact" id="navContact" className="nav-link text-white/80 hover:text-white transition">📧 Contact</a>
              <a href="/privacy" id="navPrivacy" className="nav-link text-white/80 hover:text-white transition">🔒 Privacy</a>
            </div>
            
            <button id="mobileMenuBtn" className="mobile-menu-btn text-white text-2xl">☰</button>
          </div>
        </nav>
        
        <div id="mobileDropdown" className="hidden bg-white rounded-xl shadow-xl w-full mb-4 py-2 z-50" style={{ display: 'none' }}>
          <a href="/" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">🏠 Home</a>
          <a href="/quiz" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition flex justify-between items-center">📝 Quiz <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">FREE</span></a>
          <a href="/practice" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition flex justify-between items-center">📚 Practice <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">FREE</span></a>
          <a href="/contact" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">📧 Contact</a>
          <a href="/privacy" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition">🔒 Privacy</a>
        </div>

        <div id="newsTickerContainer" className={`news-ticker-container ${initialNewsItems.length === 0 ? 'hidden' : ''}`}>
          <div className="news-ticker">
            <div className="news-ticker-label">
              <i className="fas fa-bullhorn"></i>
              <span>NEWS</span>
            </div>
            <div className="ticker-wrapper">
              <div id="tickerTrack" className="ticker-track">
                {initialNewsItems.map((item, idx) => (
                  <div key={idx} className="ticker-item">
                    <span>{item.icon}</span> {item.text}
                  </div>
                ))}
                {initialNewsItems.map((item, idx) => (
                  <div key={`dup-${idx}`} className="ticker-item">
                    <span>{item.icon}</span> {item.text}
                  </div>
                ))}
              </div>
            </div>
            <button id="closeNewsTicker" className="close-news-btn">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div id="homePage" className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl">
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
              <div id="categoryBooks" className="stats-card rounded-2xl p-5 md:p-7 text-center cursor-pointer shadow-xl">
                <i className="fas fa-book text-4xl md:text-5xl mb-3 opacity-80"></i>
                <div className="stats-number" id="statBooks">{stats.books}+</div>
                <p className="text-sm md:text-base mt-2 font-semibold">Books & Categories</p>
                <p className="text-xs mt-1 opacity-70">Browse by subject →</p>
              </div>
              <div id="categoryMcqs" className="stats-card rounded-2xl p-5 md:p-7 text-center cursor-pointer shadow-xl">
                <i className="fas fa-question-circle text-4xl md:text-5xl mb-3 opacity-80"></i>
                <div className="stats-number" id="statMcqs">{stats.questions}+</div>
                <p className="text-sm md:text-base mt-2 font-semibold">Practice Questions</p>
                <p className="text-xs mt-1 opacity-70">Start quiz now →</p>
              </div>
              <div id="categoryProgress" className="stats-card rounded-2xl p-5 md:p-7 text-center cursor-pointer shadow-xl">
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
              <div style={{ textAlign: 'justify', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', lineHeight: '1.6' }}>
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
                  <span id="dynamicSubjectsText">📚 Available Subjects: {subjects.join(', ')}</span>
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-purple-200">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <i className="fas fa-tags text-purple-600"></i> Browse by Category
                </h3>
                <div id="categoryFilters" className="flex flex-wrap gap-2 mb-4">
                  <button data-category="all" className="category-filter-btn px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium active">📚 All Books</button>
                  {categories.map(cat => (
                    <button key={cat.name} data-category={cat.name} className="category-filter-btn px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-600 hover:text-white transition">{cat.name}</button>
                  ))}
                </div>
                
                <div id="booksByCategory" className="bg-white/50 rounded-xl p-4 max-h-80 overflow-y-auto">
                  <div className="books-grid">
                    {initialBooks.map((book, index) => (
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
                <div className="exam-card">
                  <div className="exam-icon">🎓</div>
                  <h3 className="exam-title">SAT</h3>
                  <p className="exam-subjects">Math (Algebra, Data, Geometry) · Reading & Writing</p>
                  <div className="exam-books">
                    <i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> Kaplan, Princeton Review, College Board
                  </div>
                </div>
                <div className="exam-card">
                  <div className="exam-icon">✍️</div>
                  <h3 className="exam-title">ACT</h3>
                  <p className="exam-subjects">English · Math · Reading · Science (Optional)</p>
                  <div className="exam-books">
                    <i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> Barron's, Princeton Review, Magoosh
                  </div>
                </div>
                <div className="exam-card">
                  <div className="exam-icon">📊</div>
                  <h3 className="exam-title">GRE</h3>
                  <p className="exam-subjects">Quant (Math) · Verbal · Analytical Writing</p>
                  <div className="exam-books">
                    <i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> Manhattan Review, Kaplan, ETS
                  </div>
                </div>
                <div className="exam-card">
                  <div className="exam-icon">💼</div>
                  <h3 className="exam-title">GMAT</h3>
                  <p className="exam-subjects">Quant · Verbal · Data Insights</p>
                  <div className="exam-books">
                    <i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> GMAC, Manhattan Prep, PowerScore
                  </div>
                </div>
                <div className="exam-card">
                  <div className="exam-icon">🔬</div>
                  <h3 className="exam-title">AP & IB</h3>
                  <p className="exam-subjects">Calculus, Biology, Chemistry, Physics, English, Statistics</p>
                  <div className="exam-books">
                    <i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> Princeton Review, Cambridge, Norton
                  </div>
                </div>
                <div className="exam-card">
                  <div className="exam-icon">⚡</div>
                  <h3 className="exam-title">JEE & NEET</h3>
                  <p className="exam-subjects">Physics · Chemistry · Math (JEE) · Biology (NEET)</p>
                  <div className="exam-books">
                    <i className="fas fa-book-open text-purple-500 text-xs mr-1"></i> NCERT, H.C. Verma, Irodov, DC Pandey
                  </div>
                </div>
              </div>
            </div>
            
            <a href="/quiz" className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-bold hover:opacity-90 transition shadow-lg text-sm md:text-base inline-block">
              Start Practicing Now <i className="fas fa-arrow-right ml-2"></i>
            </a>
          </div>
        </div>

        <footer className="mt-12 text-center text-white/60 text-xs md:text-sm py-6">
          <p>&copy; 2025 BookMCQ. All rights reserved. | Master Every Chapter | One Paper MCQ | Govt & Private Job Preparation</p>
        </footer>
      </div>

      <div className="ai-chat-btn">
        <button id="aiChatBtn" className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-105 transition">
          <i className="fas fa-robot text-xl"></i>
        </button>
      </div>

      <div id="aiChatWindow" className="ai-chat-window hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="fas fa-robot"></i>
            <span className="font-semibold">MCQ Assistant</span>
          </div>
          <button id="closeChatBtn" className="text-white hover:opacity-70">&times;</button>
        </div>
        <div id="chatMessages" className="chat-messages bg-gray-50">
          <div className="chat-message bot">
            <div className="chat-bubble">
              👋 Hi! I can help you find MCQs. Ask me about any book, topic, or subject for government jobs, private jobs, or competitive exams!
            </div>
          </div>
        </div>
        <div className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <input type="text" id="chatInput" placeholder="Ask about books, topics, or MCQs for job preparation..." className="flex-1 p-2 border rounded-xl text-sm" />
            <button id="sendChatBtn" className="bg-purple-600 text-white px-4 py-2 rounded-xl">Send</button>
          </div>
        </div>
      </div>

      <div id="toast" className="toast hidden"></div>

      <script dangerouslySetInnerHTML={{
        __html: `
          // ============================================
          // COMPLETE JAVASCRIPT - SAME AS HTML
          // ============================================

          class SecurityManager {
            constructor() {
              this.#initSecurity();
            }
            #initSecurity() {
              document.addEventListener('contextmenu', (e) => { e.preventDefault(); return false; });
              document.addEventListener('keydown', (e) => {
                if (e.key === 'F5' || e.keyCode === 116) { return true; }
                const forbidden = ['PrintScreen', 'F12', 'F11',
                  (e.ctrlKey && e.shiftKey && e.key === 'I'),
                  (e.ctrlKey && e.shiftKey && e.key === 'C'),
                  (e.ctrlKey && e.key === 'u'),
                  (e.ctrlKey && e.key === 's')
                ];
                if (forbidden.includes(e.key) || forbidden.some(cond => cond === true)) {
                  e.preventDefault(); return false;
                }
              });
              document.addEventListener('dragstart', (e) => { e.preventDefault(); return false; });
              document.addEventListener('selectstart', (e) => {
                if (!e.target.closest('input') && !e.target.closest('textarea')) {
                  e.preventDefault(); return false;
                }
              });
            }
          }

          class CacheManager {
            #cachePrefix = 'bookmcq_';
            #ttl = 3600000;
            set(key, data, ttl = this.#ttl) {
              try {
                localStorage.setItem(this.#cachePrefix + key, JSON.stringify({ data, timestamp: Date.now(), ttl }));
                return true;
              } catch(e) { return false; }
            }
            get(key) {
              try {
                const item = localStorage.getItem(this.#cachePrefix + key);
                if (!item) return null;
                const parsed = JSON.parse(item);
                if (Date.now() - parsed.timestamp > parsed.ttl) { this.remove(key); return null; }
                return parsed.data;
              } catch(e) { return null; }
            }
            remove(key) { localStorage.removeItem(this.#cachePrefix + key); }
          }

          class SupabaseService {
            #supabase;
            #cache;
            #url = 'https://wnsuuazwcxmuwqyphvse.supabase.co';
            #key = 'sb_publishable_qsQzf3RycZtO8Uj1hd3mcg_jaX6iQ9C';
            constructor() {
              this.#cache = new CacheManager();
              this.#supabase = window.supabase.createClient(this.#url, this.#key);
            }
            async getBooks() {
              const cached = this.#cache.get('books');
              if (cached) return cached;
              const { data, error } = await this.#supabase.from('books').select('id, title, author, category').order('title');
              if (error) throw error;
              this.#cache.set('books', data);
              return data;
            }
            async getStats() {
              const cached = this.#cache.get('stats');
              if (cached) return cached;
              const { count: booksCount } = await this.#supabase.from('books').select('*', { count: 'exact', head: true });
              const { count: questionsCount } = await this.#supabase.from('questions').select('*', { count: 'exact', head: true });
              const stats = { books: booksCount || 0, questions: questionsCount || 0 };
              this.#cache.set('stats', stats);
              return stats;
            }
            async getCategories() {
              const cached = this.#cache.get('categories');
              if (cached) return cached;
              const { data, error } = await this.#supabase.from('categories').select('*').order('name');
              if (error) {
                console.error('Error loading categories:', error);
                return [];
              }
              this.#cache.set('categories', data);
              return data;
            }
            async getSubjects() {
              const cached = this.#cache.get('subjects');
              if (cached) return cached;
              const { data, error } = await this.#supabase.from('books').select('category').order('category');
              if (error) return [];
              const uniqueCategories = [...new Set(data.map(book => book.category).filter(c => c))];
              this.#cache.set('subjects', uniqueCategories);
              return uniqueCategories;
            }
            get supabase() {
              return this.#supabase;
            }
          }

          class AIChatManager {
            #supabaseService;
            constructor(supabaseService) {
              this.#supabaseService = supabaseService;
            }
            async processQuery(query) {
              const lowerQuery = query.toLowerCase();
              let response = '';
              if (lowerQuery.includes('book') || lowerQuery.includes('available')) {
                const books = await this.#supabaseService.getBooks();
                if (books && books.length > 0) {
                  response = "📚 We have " + books.length + " books available. Some of them include: " + books.slice(0,5).map(b => b.title).join(', ') + (books.length > 5 ? ' and more.' : '.') + " You can practice MCQs from any of these books.";
                } else {
                  response = "We're adding more books every day! If you don't see your book, please use the Contact page to request it.";
                }
              } else if (lowerQuery.includes('question') || lowerQuery.includes('mcq')) {
                response = "🔍 You can find MCQs in the Quiz and Practice sections. Select a book and topic to get started!";
              } else if (lowerQuery.includes('request') || lowerQuery.includes('add book')) {
                response = "📖 Want to request a book? Go to the Contact page and select 'Book Request' from the dropdown. Tell us the book title and author, and we'll add it within 48 hours!";
              } else if (lowerQuery.includes('job') || lowerQuery.includes('government') || lowerQuery.includes('private') || lowerQuery.includes('css') || lowerQuery.includes('pps') || lowerQuery.includes('upsc')) {
                response = "💼 We offer comprehensive preparation for government jobs (CSS, PMS, UPSC, FPSC, PPSC, SPSC, BPSC), private jobs (Banking, IT, Management), and competitive exams. Practice subject-wise MCQs to ace your tests!";
              } else {
                response = "I can help you find books and MCQs. Try asking: \"What books are available?\" or \"How to request a book?\" or \"How to prepare for government jobs?\"";
              }
              return response;
            }
          }

          class CategoryBooksManager {
            #supabaseService;
            #booksData = [];
            #categoriesData = [];
            
            constructor(supabaseService) {
              this.#supabaseService = supabaseService;
            }
            
            async loadBooks() {
              this.#booksData = await this.#supabaseService.getBooks();
              return this.#booksData;
            }
            
            async loadCategories() {
              this.#categoriesData = await this.#supabaseService.getCategories();
              return this.#categoriesData;
            }
            
            getCategoryIcon(categoryName) {
              const name = categoryName.toLowerCase();
              if (name.includes('computer') || name.includes('programming') || name.includes('coding') || name.includes('science')) return '💻';
              if (name.includes('web') || name.includes('html') || name.includes('css') || name.includes('react')) return '🌐';
              if (name.includes('data') || name.includes('machine') || name.includes('ai')) return '📊';
              if (name.includes('interview') || name.includes('prep') || name.includes('placement')) return '🎯';
              if (name.includes('math') || name.includes('mathematics')) return '📐';
              if (name.includes('physics') || name.includes('chemistry') || name.includes('biology')) return '🔬';
              if (name.includes('business') || name.includes('management')) return '💼';
              if (name.includes('language') || name.includes('english')) return '📖';
              if (name.includes('general') || name.includes('gk') || name.includes('current')) return '🌍';
              return '📚';
            }
            
            getBooksByCategory(categoryName) {
              if (categoryName === 'all') {
                return this.#booksData;
              }
              return this.#booksData.filter(book => {
                return book.category && book.category.toLowerCase() === categoryName.toLowerCase();
              });
            }
            
            renderCategories(containerId, onCategoryClick) {
              const container = document.getElementById(containerId);
              if (!container) return;
              
              if (!this.#categoriesData || this.#categoriesData.length === 0) {
                container.innerHTML = '<div class="text-gray-500 text-sm py-2">No categories available</div>';
                return;
              }
              
              let buttonsHtml = '';
              buttonsHtml += '<button data-category="all" class="category-filter-btn px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium">📚 All Books</button>';
              
              this.#categoriesData.forEach(category => {
                const icon = this.getCategoryIcon(category.name);
                buttonsHtml += '<button data-category="' + category.name + '" class="category-filter-btn px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-600 hover:text-white transition">' + icon + ' ' + category.name + '</button>';
              });
              
              container.innerHTML = buttonsHtml;
              
              const categoryButtons = document.querySelectorAll('.category-filter-btn');
              categoryButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                  const categoryName = btn.getAttribute('data-category');
                  onCategoryClick(categoryName);
                });
              });
            }
            
            displayBooks(books, containerId) {
              const container = document.getElementById(containerId);
              if (!container) return;
              
              if (!books || books.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">No books found in this category</p>';
                return;
              }
              
              let html = '<div class="books-grid">';
              books.forEach((book, index) => {
                html += '<div class="book-list-item" onclick="window.location.href=\'/quiz\'">';
                html += '<div class="book-info">';
                html += '<div class="book-number">' + (index + 1) + '</div>';
                html += '<div>';
                html += '<div class="book-title">' + this.#escapeHtml(book.title) + '</div>';
                if (book.author) {
                  html += '<div class="book-author">' + this.#escapeHtml(book.author) + '</div>';
                }
                if (book.category) {
                  html += '<div class="book-category">📁 ' + this.#escapeHtml(book.category) + '</div>';
                }
                html += '</div></div>';
                html += '<i class="fas fa-chevron-right text-gray-400 text-sm"></i>';
                html += '</div>';
              });
              html += '</div>';
              html += '<p class="text-xs text-gray-400 mt-4 text-center">Click on any book to start practicing</p>';
              
              container.innerHTML = html;
            }
            
            #escapeHtml(str) {
              if (!str) return '';
              return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
            }
          }

          function initMobileMenu() {
            const mobileBtn = document.getElementById('mobileMenuBtn');
            const dropdown = document.getElementById('mobileDropdown');
            
            if (mobileBtn && dropdown) {
              mobileBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (dropdown.style.display === 'none' || dropdown.style.display === '') {
                  dropdown.style.display = 'block';
                } else {
                  dropdown.style.display = 'none';
                }
              });
              
              document.addEventListener('click', function(e) {
                const isMobile = window.innerWidth <= 768;
                if (isMobile && dropdown && mobileBtn) {
                  if (!mobileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.style.display = 'none';
                  }
                }
              });
              
              window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                  dropdown.style.display = 'none';
                }
              });
            }
          }

          function initNavbarScroll() {
            const navbar = document.getElementById('mainNav');
            if (!navbar) return;
            window.addEventListener('scroll', () => {
              if (window.scrollY > 50) {
                navbar.classList.add('navbar-scrolled');
              } else {
                navbar.classList.remove('navbar-scrolled');
              }
            });
          }

          async function initCategoryFilters(supabaseService) {
            const categoryBooksManager = new CategoryBooksManager(supabaseService);
            await categoryBooksManager.loadBooks();
            await categoryBooksManager.loadCategories();
            
            categoryBooksManager.renderCategories('categoryFilters', async (categoryName) => {
              document.querySelectorAll('.category-filter-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.classList.add('bg-purple-100', 'text-purple-700');
                btn.classList.remove('bg-purple-600', 'text-white');
              });
              
              const clickedBtn = document.querySelector('.category-filter-btn[data-category="' + categoryName + '"]');
              if (clickedBtn) {
                clickedBtn.classList.add('active', 'bg-purple-600', 'text-white');
                clickedBtn.classList.remove('bg-purple-100', 'text-purple-700');
              }
              
              const filteredBooks = categoryBooksManager.getBooksByCategory(categoryName);
              categoryBooksManager.displayBooks(filteredBooks, 'booksByCategory');
            });
            
            setTimeout(() => {
              const allBooksBtn = document.querySelector('.category-filter-btn[data-category="all"]');
              if (allBooksBtn) {
                allBooksBtn.classList.add('active', 'bg-purple-600', 'text-white');
                allBooksBtn.classList.remove('bg-purple-100', 'text-purple-700');
              }
              const allBooks = categoryBooksManager.getBooksByCategory('all');
              categoryBooksManager.displayBooks(allBooks, 'booksByCategory');
            }, 100);
          }

          function setupStatsCardHandlers() {
            const booksCard = document.getElementById('categoryBooks');
            if (booksCard) {
              booksCard.addEventListener('click', () => {
                window.location.href = '/practice';
              });
            }
            
            const mcqsCard = document.getElementById('categoryMcqs');
            if (mcqsCard) {
              mcqsCard.addEventListener('click', () => {
                window.location.href = '/quiz';
              });
            }
            
            const progressCard = document.getElementById('categoryProgress');
            if (progressCard) {
              progressCard.addEventListener('click', () => {
                window.location.href = '/quiz';
              });
            }
          }

          async function updateDynamicSEO(supabaseService) {
            try {
              const subjects = await supabaseService.getSubjects();
              if (subjects && subjects.length > 0) {
                const subjectsText = subjects.join(', ');
                const subjectsElement = document.getElementById('dynamicSubjectsText');
                if (subjectsElement) {
                  subjectsElement.innerHTML = '📚 Available Subjects: ' + subjectsText;
                }
              }
            } catch(e) {
              console.log('Dynamic SEO update skipped:', e);
            }
          }

          async function setupAIChat(supabaseService) {
            const chatManager = new AIChatManager(supabaseService);
            const chatBtn = document.getElementById('aiChatBtn');
            const chatWindow = document.getElementById('aiChatWindow');
            const closeChatBtn = document.getElementById('closeChatBtn');
            const sendBtn = document.getElementById('sendChatBtn');
            const chatInput = document.getElementById('chatInput');
            const chatMessages = document.getElementById('chatMessages');
            
            chatBtn.onclick = () => { chatWindow.classList.toggle('hidden'); };
            closeChatBtn.onclick = () => { chatWindow.classList.add('hidden'); };
            
            const addMessage = (text, isUser) => {
              const messageDiv = document.createElement('div');
              messageDiv.className = 'chat-message ' + (isUser ? 'user' : 'bot');
              messageDiv.innerHTML = '<div class="chat-bubble">' + text + '</div>';
              chatMessages.appendChild(messageDiv);
              chatMessages.scrollTop = chatMessages.scrollHeight;
            };
            
            const showTyping = () => {
              const typingDiv = document.createElement('div');
              typingDiv.className = 'chat-message bot';
              typingDiv.id = 'typingIndicator';
              typingDiv.innerHTML = '<div class="chat-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
              chatMessages.appendChild(typingDiv);
              chatMessages.scrollTop = chatMessages.scrollHeight;
            };
            
            const removeTyping = () => { const typing = document.getElementById('typingIndicator'); if (typing) typing.remove(); };
            
            const sendMessage = async () => {
              const message = chatInput.value.trim();
              if (!message) return;
              addMessage(message, true);
              chatInput.value = '';
              showTyping();
              const response = await chatManager.processQuery(message);
              removeTyping();
              addMessage(response, false);
            };
            
            sendBtn.onclick = sendMessage;
            chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
          }

          function showToast(message, isError = false) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.style.background = isError ? '#ef4444' : '#1f2937';
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3000);
          }

          class NewsTicker {
            constructor(supabaseClient) {
              this.supabase = supabaseClient;
              this.sevenDaysAgo = new Date();
              this.sevenDaysAgo.setDate(this.sevenDaysAgo.getDate() - 7);
            }
            
            formatTimeAgo(dateStr) {
              if (!dateStr) return 'recently';
              const date = new Date(dateStr);
              const now = new Date();
              const diffMs = now - date;
              const diffMins = Math.floor(diffMs / 60000);
              const diffHours = Math.floor(diffMs / 3600000);
              const diffDays = Math.floor(diffMs / 86400000);
              
              if (diffMins < 1) return 'just now';
              if (diffMins < 60) return diffMins + ' minute' + (diffMins === 1 ? '' : 's') + ' ago';
              if (diffHours < 24) return diffHours + ' hour' + (diffHours === 1 ? '' : 's') + ' ago';
              if (diffDays === 1) return 'yesterday';
              return diffDays + ' days ago';
            }
            
            async getRecentBooks() {
              try {
                const { data, error } = await this.supabase
                  .from('books')
                  .select('title, author, created_at')
                  .gte('created_at', this.sevenDaysAgo.toISOString())
                  .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
              } catch(e) {
                console.error('Books error:', e);
                return [];
              }
            }
            
            async getRecentCategories() {
              try {
                const { data, error } = await this.supabase
                  .from('categories')
                  .select('name, created_at')
                  .gte('created_at', this.sevenDaysAgo.toISOString())
                  .order('created_at', { ascending: false });
                
                if (error) throw error;
                return data || [];
              } catch(e) {
                console.error('Categories error:', e);
                return [];
              }
            }
            
            async getRecentTopics() {
              try {
                const { data, error } = await this.supabase
                  .from('topics')
                  .select('id, name, book_id, created_at')
                  .gte('created_at', this.sevenDaysAgo.toISOString())
                  .order('created_at', { ascending: false });
                
                if (error) throw error;
                if (!data || data.length === 0) return [];
                
                const topicsWithBooks = await Promise.all(data.map(async (topic) => {
                  let bookTitle = 'Unknown Book';
                  if (topic.book_id) {
                    const { data: bookData } = await this.supabase
                      .from('books')
                      .select('title')
                      .eq('id', topic.book_id)
                      .single();
                    if (bookData) bookTitle = bookData.title;
                  }
                  return {
                    name: topic.name,
                    book_title: bookTitle,
                    created_at: topic.created_at
                  };
                }));
                
                return topicsWithBooks;
              } catch(e) {
                console.error('Topics error:', e);
                return [];
              }
            }
            
            async getRecentQuestions() {
              try {
                const { data, error } = await this.supabase
                  .from('questions')
                  .select('id, topic_id, created_at, topics!inner (id, name, book_id, books!inner (id, title))')
                  .gte('created_at', this.sevenDaysAgo.toISOString())
                  .order('created_at', { ascending: false });
                
                if (error) throw error;
                if (!data || data.length === 0) return [];
                
                const topicQuestionMap = new Map();
                
                for (const q of data) {
                  if (q.topics) {
                    const topicId = q.topic_id;
                    const topicName = q.topics.name;
                    const bookTitle = q.topics.books?.title || 'Unknown Book';
                    const key = '' + topicId;
                    
                    if (!topicQuestionMap.has(key)) {
                      topicQuestionMap.set(key, {
                        topic_name: topicName,
                        book_title: bookTitle,
                        mcq_count: 0,
                        created_at: q.created_at
                      });
                    }
                    topicQuestionMap.get(key).mcq_count++;
                  }
                }
                
                return Array.from(topicQuestionMap.values());
              } catch(e) {
                console.error('Questions error:', e);
                return [];
              }
            }
            
            async generateNewsItems() {
              console.log('Generating news items from database...');
              
              const books = await this.getRecentBooks();
              const categories = await this.getRecentCategories();
              const topics = await this.getRecentTopics();
              const questions = await this.getRecentQuestions();
              
              const items = [];
              
              books.forEach(book => {
                items.push({
                  icon: '📚',
                  text: 'New Book Added: "' + book.title + '"' + (book.author ? ' by ' + book.author : '') + ' (' + this.formatTimeAgo(book.created_at) + ')',
                  time: new Date(book.created_at)
                });
              });
              
              categories.forEach(cat => {
                items.push({
                  icon: '🏷️',
                  text: 'New Category Added: ' + cat.name + ' (' + this.formatTimeAgo(cat.created_at) + ')',
                  time: new Date(cat.created_at)
                });
              });
              
              const latestChapterPerBook = new Map();
              topics.forEach(topic => {
                const bookKey = topic.book_title;
                const updateTime = new Date(topic.created_at);
                
                if (!latestChapterPerBook.has(bookKey) || updateTime > latestChapterPerBook.get(bookKey).time) {
                  latestChapterPerBook.set(bookKey, {
                    chapterName: topic.name,
                    bookTitle: topic.book_title,
                    time: updateTime
                  });
                }
              });
              
              latestChapterPerBook.forEach((data) => {
                items.push({
                  icon: '📖',
                  text: 'New Chapter Added: "' + data.chapterName + '" in "' + data.bookTitle + '" (' + this.formatTimeAgo(data.time) + ')',
                  time: data.time
                });
              });
              
              const latestMcqPerBook = new Map();
              questions.forEach(q => {
                const bookKey = q.book_title;
                const updateTime = new Date(q.created_at);
                
                if (!latestMcqPerBook.has(bookKey) || updateTime > latestMcqPerBook.get(bookKey).time) {
                  latestMcqPerBook.set(bookKey, {
                    chapterName: q.topic_name,
                    bookTitle: q.book_title,
                    mcqCount: q.mcq_count,
                    time: updateTime
                  });
                }
              });
              
              latestMcqPerBook.forEach((data) => {
                const mcqText = data.mcqCount === 1 ?
                  'New MCQ Added to Chapter "' + data.chapterName + '" in "' + data.bookTitle + '"' :
                  data.mcqCount + ' New MCQs Added to Chapter "' + data.chapterName + '" in "' + data.bookTitle + '"';
                items.push({
                  icon: '❓',
                  text: mcqText + ' (' + this.formatTimeAgo(data.time) + ')',
                  time: data.time
                });
              });
              
              items.sort((a, b) => b.time - a.time);
              
              return items.slice(0, 20);
            }
            
            async startTicker() {
              try {
                const items = await this.generateNewsItems();
                const container = document.getElementById('newsTickerContainer');
                const track = document.getElementById('tickerTrack');
                
                if (!items.length) {
                  if (container) container.classList.add('hidden');
                  return;
                }
                
                container.classList.remove('hidden');
                let html = '';
                items.forEach(item => {
                  let iconClass = 'fa-book';
                  if (item.icon === '🏷️') iconClass = 'fa-tag';
                  else if (item.icon === '📖') iconClass = 'fa-book-open';
                  else if (item.icon === '❓') iconClass = 'fa-question-circle';
                  html += '<div class="ticker-item"><i class="fas ' + iconClass + '"></i> ' + item.text + '</div>';
                });
                html += html;
                track.innerHTML = html;
                
                const speed = Math.max(20, Math.min(50, 20000 / items.length));
                track.style.animation = 'scrollLeft ' + speed + 's linear infinite';
                
              } catch (error) {
                console.error('Ticker error:', error);
              }
            }
          }

          const security = new SecurityManager();
          const supabaseService = new SupabaseService();
          
          async function initNewsTicker() {
            try {
              console.log('initNewsTicker called');
              const ticker = new NewsTicker(supabaseService.supabase);
              await ticker.startTicker();
              
              const closeBtn = document.getElementById('closeNewsTicker');
              if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                  const container = document.getElementById('newsTickerContainer');
                  if (container) container.classList.add('hidden');
                });
              }
            } catch (error) {
              console.error('Error in initNewsTicker:', error);
            }
          }
          
          initNavbarScroll();
          initCategoryFilters(supabaseService);
          setupStatsCardHandlers();
          updateDynamicSEO(supabaseService);
          initMobileMenu();
          initNewsTicker();
          setupAIChat(supabaseService);
        `
      }} />
    </>
  )
}
