import { supabase } from '../../lib/supabase'
import Link from 'next/link'

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

  return {
    props: { 
      book: book || null, 
      topics: topics || [] 
    },
    revalidate: 3600
  }
}

export default function BookPage({ book, topics }) {
  if (!book) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="quiz-card text-center">
          <h2 className="text-2xl font-bold text-red-600">Book not found</h2>
          <Link href="/quiz" className="text-purple-600 hover:underline">← Back to books</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="quiz-card">
        <Link href="/quiz" className="text-purple-600 hover:underline mb-4 inline-block">← Back to books</Link>
        
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{book.title}</h1>
        {book.author && <p className="text-gray-600">by {book.author}</p>}
        {book.category && <span className="text-sm bg-purple-100 text-purple-600 px-3 py-1 rounded-full inline-block mt-2">{book.category}</span>}
        
        <h2 className="text-xl font-bold mt-6 mb-4">📚 Chapters</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topics.map(topic => (
            <div key={topic.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition">
              <div>
                {topic.chapter_number && <span className="text-sm text-purple-600">Ch {topic.chapter_number}</span>}
                <span className="font-medium ml-2">{topic.name}</span>
              </div>
            </div>
          ))}
        </div>
        
        {topics.length === 0 && (
          <p className="text-gray-500 text-center py-8">No chapters available for this book yet.</p>
        )}
      </div>
    </div>
  )
}
