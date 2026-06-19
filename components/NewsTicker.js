import { useState, useEffect } from 'react'
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

      const { data: categories } = await supabase
        .from('categories')
        .select('name, created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: topics } = await supabase
        .from('topics')
        .select('name, book_id, created_at, books(title)')
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
          text: `New Book Added: "${book.title}"${book.author ? ` by ${book.author}` : ''}`
        })
      })

      categories?.forEach(cat => {
        newsItems.push({
          icon: '🏷️',
          text: `New Category Added: ${cat.name}`
        })
      })

      topics?.forEach(topic => {
        const bookTitle = topic.books?.title || 'Unknown Book'
        newsItems.push({
          icon: '📖',
          text: `New Chapter Added: "${topic.name}" in "${bookTitle}"`
        })
      })

      questions?.forEach(q => {
        const bookTitle = q.topics?.books?.title || 'Unknown Book'
        const topicName = q.topics?.name || 'Unknown Chapter'
        newsItems.push({
          icon: '❓',
          text: `New MCQ Added to "${topicName}" in "${bookTitle}"`
        })
      })

      // Sort by most recent first (books have created_at)
      const sorted = newsItems.slice(0, 20)
      setItems(sorted)

    } catch (error) {
      console.error('News ticker error:', error)
    }
  }

  if (!visible || items.length === 0) return null

  return (
    <div className="news-ticker-container">
      <div className="news-ticker">
        <div className="news-ticker-label">
          <i className="fas fa-bullhorn"></i>
          <span>NEWS</span>
        </div>
        <div className="ticker-wrapper">
          <div className="ticker-track">
            {items.map((item, idx) => (
              <div key={idx} className="ticker-item">
                <span>{item.icon}</span> {item.text}
              </div>
            ))}
            {items.map((item, idx) => (
              <div key={`dup-${idx}`} className="ticker-item">
                <span>{item.icon}</span> {item.text}
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
