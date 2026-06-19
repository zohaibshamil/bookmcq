import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/', label: '🏠 Home' },
    { href: '/quiz', label: '📝 Quiz', badge: 'FREE' },
    { href: '/practice', label: '📚 Practice', badge: 'FREE' },
    { href: '/contact', label: '📧 Contact' },
    { href: '/privacy', label: '🔒 Privacy' },
  ]

  return (
    <>
      <nav className={`bg-white/10 backdrop-blur-lg rounded-full px-4 md:px-6 py-3 mb-8 sticky top-4 z-50 shadow-lg ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <i className="fas fa-graduation-cap text-white text-xl md:text-2xl"></i>
            <span className="text-white font-bold text-lg md:text-xl">BookMCQ</span>
            <span className="text-white/60 text-xs hidden sm:inline">| Master Every Chapter</span>
          </div>
          
          <div className="desktop-menu flex gap-3 md:gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} legacyBehavior>
                <a className={`nav-link ${router.pathname === link.href ? 'active text-white' : 'text-white/80 hover:text-white'} transition flex items-center gap-1`}>
                  {link.label}
                  {link.badge && (
                    <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{link.badge}</span>
                  )}
                </a>
              </Link>
            ))}
          </div>
          
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="mobile-menu-btn text-white text-2xl"
          >
            ☰
          </button>
        </div>
      </nav>
      
      {/* Mobile Dropdown */}
      <div id="mobileDropdown" className={`${mobileOpen ? 'block' : 'hidden'} bg-white rounded-xl shadow-xl w-full mb-4 py-2 z-50`}>
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} legacyBehavior>
            <a 
              className="block px-4 py-3 text-gray-700 hover:bg-purple-50 transition flex justify-between items-center"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
              {link.badge && (
                <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{link.badge}</span>
              )}
            </a>
          </Link>
        ))}
      </div>
    </>
  )
}
