import { supabase } from '../lib/supabase'

export async function getServerSideProps({ res }) {
  const { data: books } = await supabase.from('books').select('id')
  const { data: topics } = await supabase.from('topics').select('id, book_id')

  const baseUrl = 'https://bookmcq.vercel.app'
  const now = new Date().toISOString().split('T')[0]

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

  const pages = ['/', '/quiz', '/practice', '/contact', '/privacy']
  pages.forEach(page => {
    sitemap += `
    <url>
      <loc>${baseUrl}${page}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>${page === '/' ? 'daily' : 'weekly'}</changefreq>
      <priority>${page === '/' ? '1.0' : '0.8'}</priority>
    </url>`
  })

  ;(books || []).forEach(book => {
    sitemap += `
    <url>
      <loc>${baseUrl}/quiz/${book.id}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`
  })

  ;(topics || []).forEach(topic => {
    sitemap += `
    <url>
      <loc>${baseUrl}/quiz/${topic.book_id}/${topic.id}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`
  })

  sitemap += `
</urlset>`

  res.setHeader('Content-Type', 'text/xml')
  res.write(sitemap)
  res.end()

  return { props: {} }
}

export default function Sitemap() { return null }
