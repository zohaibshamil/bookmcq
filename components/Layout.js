import Navbar from './Navbar'
import Footer from './Footer'
import { useEffect } from 'react'

export default function Layout({ children }) {
  useEffect(() => {
    // Security: Disable right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault())
    
    // Disable keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const forbidden = ['PrintScreen', 'F12', 
        (e.ctrlKey && e.shiftKey && e.key === 'I'),
        (e.ctrlKey && e.key === 'u'),
        (e.ctrlKey && e.key === 's')]
      if (forbidden.includes(e.key) || forbidden.some(cond => cond === true)) {
        e.preventDefault()
      }
    })
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
