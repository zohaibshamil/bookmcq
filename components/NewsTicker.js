import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function NewsTicker() {
  const [items, setItems] = useState([])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    loadNews()
  }, [])

  async function loadNews() {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: books } = await supabase
        .from('books')
        .select('title, author, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: topics } = await supabase
        .from('topics')
        .select('name, book_id, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: questions } = await supabase
        .from('questions')
        .select('topic_id, created_at, topics(name, books(title))')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10)

      const newsItems = []

      books?.forEach(book => {
        newsItems.push({
          icon: '📚',
          text: `New Book Added: "${book.title}"${book.author ? ` by ${book.author}` : ''} (${formatTimeAgo(book.created_at)})`
        })
      })

      topics?.forEach(topic => {
        newsItems.push({
          icon: '📖',
          text: `New Chapter Added: "${topic.name}" (${formatTimeAgo(topic.created_at)})`
        })
      })

      questions?.forEach(q => {
        const bookTitle = q.topics?.books?.title || 'Unknown Book'
        newsItems.push({
          icon: '❓',
          text: `New MCQ Added to "${q.topics?.name || 'Unknown Chapter'}" in "${bookTitle}" (${formatTimeAgo(q.created_at)})`
        })
      })

      const sorted = newsItems.slice(0, 20)
      setItems(sorted)

    } catch (error) {
      console.error('News ticker error:', error)
    }
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return 'recently'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMins = Math.floor((now - date) / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'yesterday'
    return `${diffDays}d ago`
  }

  if (!visible || items.length === 0) return null

  return (
    <div className="news-ticker-container mb-4">
      <div className="news-ticker">
        <div className="news-ticker-label">
          <i className="fas fa-bullhorn"></i>
          <span>NEWS</span>
        </div>
        <div className="ticker-wrapper">
          <div className="ticker-track">
            {items.map((item, idx) => (
              <div key={idx} className="ticker-item">
                <span>{item.icon}</span>
                {item.text}
              </div>
            ))}
            {items.map((item, idx) => (
              <div key={`dup-${idx}`} className="ticker-item">
                <span>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setVisible(false)} className="close-news-btn">
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  )
}
