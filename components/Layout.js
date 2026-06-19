import Navbar from './Navbar'
import Footer from './Footer'
import Toast from './Toast'

export default function Layout({ children }) {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <Toast />
    </div>
  )
}
