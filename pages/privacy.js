export default function Privacy() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="quiz-card rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="text-center mb-8">
          <i className="fas fa-shield-alt text-5xl text-purple-600 mb-4"></i>
          <h2 className="text-3xl font-bold mb-4">Privacy Policy</h2>
        </div>
        <div className="max-w-none">
          <p className="text-gray-600 mb-4">At BookMCQ, we respect your privacy and are committed to protecting your personal data.</p>
          <h3 className="text-xl font-bold mt-6 mb-3">Information We Collect</h3>
          <p className="text-gray-600">We only collect essential information like email address for authentication and quiz progress tracking.</p>
          <h3 className="text-xl font-bold mt-6 mb-3">How We Use Your Information</h3>
          <p className="text-gray-600">We use your information solely to provide and improve our services, track your quiz performance, and communicate with you about updates.</p>
          <h3 className="text-xl font-bold mt-6 mb-3">Data Security</h3>
          <p className="text-gray-600">We implement industry-standard security measures to protect your data from unauthorized access.</p>
          <p className="text-gray-500 text-sm mt-8">Last updated: January 2025</p>
        </div>
      </div>
    </div>
  )
}
