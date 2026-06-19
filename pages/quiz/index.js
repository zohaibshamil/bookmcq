import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export async function getStaticProps() {
  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, category')
    .order('title')

  return {
    props: { books: books || [] },
    revalidate: 3600
  }
}

export default function QuizBooks({ books }) {
  return (
    <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <i className="fas fa-filter text-purple-600"></i> Filter Questions
      </h2>
      
      <p className="text-gray-600 mb-6">Select a book to start practicing MCQs</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {books.map(book => (
          <Link key={book.id} href={`/quiz/${book.id}`} legacyBehavior>
            <a className="p-4 bg-white rounded-xl shadow hover:shadow-lg transition border border-purple-100">
              <h3 className="font-bold text-lg">{book.title}</h3>
              {book.author && <p className="text-gray-600 text-sm">by {book.author}</p>}
              {book.category && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full inline-block mt-2">{book.category}</span>}
            </a>
          </Link>
        ))}
      </div>
    </div>
  )
}
