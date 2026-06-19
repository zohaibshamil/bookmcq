import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <nav className={`bg-white/10 backdrop-blur-lg rounded-full px-4 md:px-6 py-3 mb-8 sticky top-4 z-50 shadow-lg ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <i className="fas fa-graduation-cap text-white text-xl md:text-2xl"></i>
            <span className="text-white font-bold text-lg md:text-xl">BookMCQ</span>
            <span className="text-white/60 text-xs hidden sm:inline">| Master Every Chapter</span>
          </Link>

          {/* Desktop Menu */}
          <div className="desktop-menu flex gap-3 md:gap-6">
            <Link href="/" className={`nav-link ${router.pathname === '/' ? 'active text-white' : 'text-white/80 hover:text-white'} transition`}>
              🏠 Home
            </Link>
            <Link href="/quiz" className={`nav-link ${router.pathname === '/quiz' ? 'active text-white' : 'text-white/80 hover:text-white'} transition flex items-center gap-1`}>
              📝 Quiz <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">FREE</span>
            </Link>
            <Link href="/practice" className={`nav-link ${router.pathname === '/practice' ? 'active text-white' : 'text-white/80 hover:text-white'} transition flex items-center gap-1`}>
              📚 Practice <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">FREE</span>
            </Link>
            <Link href="/contact" className={`nav-link ${router.pathname === '/contact' ? 'active text-white' : 'text-white/80 hover:text-white'} transition`}>
              📧 Contact
            </Link>
            <Link href="/privacy" className={`nav-link ${router.pathname === '/privacy' ? 'active text-white' : 'text-white/80 hover:text-white'} transition`}>
              🔒 Privacy
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn text-white text-2xl">
            ☰
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      <div className={`${mobileOpen ? 'block' : 'hidden'} bg-white rounded-xl shadow-xl w-full mb-4 py-2 z-50`}>
        <Link href="/" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition" onClick={() => setMobileOpen(false)}>
          🏠 Home
        </Link>
        <Link href="/quiz" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition flex justify-between items-center" onClick={() => setMobileOpen(false)}>
          📝 Quiz <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">FREE</span>
        </Link>
        <Link href="/practice" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition flex justify-between items-center" onClick={() => setMobileOpen(false)}>
          📚 Practice <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">FREE</span>
        </Link>
        <Link href="/contact" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition" onClick={() => setMobileOpen(false)}>
          📧 Contact
        </Link>
        <Link href="/privacy" className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition" onClick={() => setMobileOpen(false)}>
          🔒 Privacy
        </Link>
      </div>
    </>
  )
}
