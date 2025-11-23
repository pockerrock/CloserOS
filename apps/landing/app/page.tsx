export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">CloserOS</div>
          <nav className="flex gap-6">
            <a href="#features" className="text-gray-700 hover:text-blue-600">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-blue-600">Pricing</a>
            <a href="http://localhost:3000/login" className="text-blue-600 font-semibold hover:text-blue-700">Login</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Close More Deals with <span className="text-blue-600">AI-Powered</span> Coaching
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Combine scheduling, native calling, AI whisper coaching, payments, and analytics
          in one platform to reduce no-shows and increase close rates.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="http://localhost:3000/register"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Start Free Trial
          </a>
          <a
            href="#demo"
            className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition"
          >
            Watch Demo
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Everything You Need to Close</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              📅
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
            <p className="text-gray-600">
              Google Calendar sync, automated reminders, and no-show recovery
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              🎙️
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Coaching</h3>
            <p className="text-gray-600">
              Real-time whisper coaching trained on your best sales scripts
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              💰
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Payments</h3>
            <p className="text-gray-600">
              Stripe integration for one-click checkout and contract signing
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to 10x Your Close Rate?</h2>
          <p className="text-xl mb-8">Join the beta and get 50% off for life.</p>
          <a
            href="http://localhost:3000/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition inline-block"
          >
            Get Started Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 CloserOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
