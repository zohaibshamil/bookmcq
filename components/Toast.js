import { useState, useEffect } from 'react'

export default function Toast() {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    window.showToast = (msg, error = false) => {
      setMessage(msg)
      setIsError(error)
      setVisible(true)
      setTimeout(() => setVisible(false), 3000)
    }
  }, [])

  if (!visible) return null

  return (
    <div className={`toast ${isError ? 'bg-red-500' : 'bg-gray-800'} text-white px-6 py-3 rounded-lg shadow-lg fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 transition-all`}>
      {message}
    </div>
  )
}
