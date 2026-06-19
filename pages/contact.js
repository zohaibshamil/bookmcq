import Layout from '../components/Layout'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', type: 'General Inquiry', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('contact_messages').insert([{
        name: formData.name,
        email: formData.email,
        message_type: formData.type,
        message: formData.message,
        status: 'unread'
      }])
      if (error) throw error
      setSuccess(true)
      setFormData({ name: '', email: '', type: 'General Inquiry', message: '' })
    } catch (err) {
      alert('Failed to send message. Please try again.')
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
            <h4 className="font-bold text-amber-800 mb-2">
              <i className="fas fa-book mr-2"></i> Book Request
            </h4>
            <p className="text-amber-700 text-sm">
              Don't see the book you're looking for? Submit a request below and we'll add it within 48 hours!
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Send a Message</h3>
          {success ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl">
              <i className="fas fa-check-circle mr-2"></i> 
              {formData.type === 'Book Request' 
                ? '✅ Book request submitted! We\'ll add it within 48 hours.'
                : '✅ Thank you for your message! We\'ll get back to you soon.'
              }
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Your Name"
                className="w-full p-3 border rounded-xl mb-3 text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                className="w-full p-3 border rounded-xl mb-3 text-sm"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <select
                className="w-full p-3 border rounded-xl mb-3 text-sm"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option>General Inquiry</option>
                <option>Book Request</option>
                <option>Report an Issue</option>
                <option>Feature Suggestion</option>
              </select>
              <textarea
                rows="4"
                placeholder="Your Message (include book title and author if requesting)"
                className="w-full p-3 border rounded-xl mb-3 text-sm"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 w-full"
              >
                <i className="fas fa-paper-plane"></i> 
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
