import Navbar from './Navbar'
import Footer from './Footer'
import NewsTicker from './NewsTicker'
import { useEffect } from 'react'

export default function Layout({ children }) {
  useEffect(() => {
    // Security: Disable right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault())
    
    // Disable keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const forbidden = [
        'PrintScreen', 'F12',
        (e.ctrlKey && e.shiftKey && e.key === 'I'),
        (e.ctrlKey && e.key === 'u'),
        (e.ctrlKey && e.key === 's')
      ]
      if (forbidden.includes(e.key) || forbidden.some(cond => cond === true)) {
        e.preventDefault()
      }
    })

    // Disable text selection
    document.addEventListener('selectstart', (e) => {
      if (!e.target.closest('input') && !e.target.closest('textarea')) {
        e.preventDefault()
      }
    })

    document.addEventListener('dragstart', (e) => {
      e.preventDefault()
    })
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 disable-select">
      <Navbar />
      <NewsTicker />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
