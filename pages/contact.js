import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState('General Inquiry')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!name || !email || !message) {
      window.showToast('Please fill all required fields', true)
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      window.showToast('Please enter a valid email address', true)
      return
    }
    
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          name,
          email,
          message_type: type,
          message,
          status: 'unread',
          created_at: new Date().toISOString()
        }])
      
      if (error) throw error
      
      const isBookRequest = type === 'Book Request'
      window.showToast(isBookRequest ? '✅ Book request submitted! We\'ll add it within 48 hours.' : '✅ Thank you for your message! We\'ll get back to you soon.')
      
      setName('')
      setEmail('')
      setType('General Inquiry')
      setMessage('')
    } catch (error) {
      console.error('Error:', error)
      window.showToast('❌ Failed to send message. Please try again later.', true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="text-center mb-8">
        <i className="fas fa-envelope text-5xl text-purple-600 mb-4"></i>
        <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
        <p className="text-gray-600">Have questions or want to request a book? We'd love to hear from you!</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Get in Touch</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <i className="fas fa-envelope text-purple-600 w-6"></i>
              <span className="text-gray-600">bookmcq@hotmail.com</span>
            </div>
            <div className="flex items-center gap-3">
              <i className="fab fa-twitter text-purple-600 w-6"></i>
              <span className="text-gray-600">@bookmcq</span>
            </div>
          </div>
          <div className="mt-6 p-4 bg-amber-50 rounded-xl">
            <h4 className="font-bold text-amber-800 mb-2"><i className="fas fa-book mr-2"></i> Book Request</h4>
            <p className="text-amber-700 text-sm">Don't see the book you're looking for? Submit a request below and we'll add it within 48 hours!</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-bold mb-4">Send a Message</h3>
          <form onSubmit={handleSubmit}>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name" 
              className="w-full p-3 border rounded-xl mb-3 text-sm" 
              required 
            />
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your Email" 
              className="w-full p-3 border rounded-xl mb-3 text-sm" 
              required 
            />
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 border rounded-xl mb-3 text-sm" 
              required
            >
              <option value="General Inquiry">General Inquiry</option>
              <option value="Book Request">Book Request</option>
              <option value="Report an Issue">Report an Issue</option>
              <option value="Feature Suggestion">Feature Suggestion</option>
            </select>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4" 
              placeholder="Your Message (include book title and author if requesting)" 
              className="w-full p-3 border rounded-xl mb-3 text-sm" 
              required
            ></textarea>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 w-full"
            >
              {loading ? (
                <><i className="fas fa-spinner fa-spin"></i> Sending...</>
              ) : (
                <><i className="fas fa-paper-plane"></i> Send Message</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
