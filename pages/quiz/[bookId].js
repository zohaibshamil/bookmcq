import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export async function getStaticPaths() {
  const { data: books } = await supabase
    .from('books')
    .select('id')

  return {
    paths: (books || []).map(book => ({
      params: { bookId: book.id.toString() }
    })),
    fallback: 'blocking'
  }
}

export async function getStaticProps({ params }) {
  const bookId = params.bookId

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
  const totalMcqs = topics.reduce((sum, t) => sum + t.mcqCount, 0)

  if (!book) {
    return (
      <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl text-center">
        <h2 className="text-2xl font-bold text-red-600">Book not found</h2>
        <Link href="/quiz" className="text-purple-600 hover:underline">← Back to books</Link>
      </div>
    )
  }

  return (
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
  )
}
