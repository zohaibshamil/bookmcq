export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>📚 BookMCQ</h1>
      <p style={{ fontSize: '20px', marginBottom: '30px' }}>Your site is LIVE! 🚀</p>
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="/quiz" style={{ 
          padding: '12px 24px', 
          background: 'white', 
          color: '#667eea',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}>
          Go to Quizzes
        </a>
        <a href="/practice" style={{ 
          padding: '12px 24px', 
          background: 'rgba(255,255,255,0.2)', 
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          border: '2px solid white'
        }}>
          Practice
        </a>
        <a href="/contact" style={{ 
          padding: '12px 24px', 
          background: 'rgba(255,255,255,0.2)', 
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          border: '2px solid white'
        }}>
          Contact
        </a>
      </div>
    </div>
  )
}
