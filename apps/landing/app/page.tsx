import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-6">CloserOS</h1>
          <p className="text-2xl mb-4">AI-Powered OS for High-Ticket Closers & Setters</p>
          <p className="text-xl mb-12 text-blue-100">
            Close more deals with AI coaching, smart scheduling, and integrated payments
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="http://localhost:3000/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
            >
              Start Free Trial
            </a>
            <a
              href="http://localhost:3000/login"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">Everything You Need to Close</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h3 className="text-2xl font-semibold mb-4">AI Coaching</h3>
              <p className="text-gray-600">
                Real-time coaching during calls based on your sales scripts
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">📞</div>
              <h3 className="text-2xl font-semibold mb-4">Native Calling</h3>
              <p className="text-gray-600">
                Built-in calling with recording, transcription, and AI summaries
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-2xl font-semibold mb-4">Instant Payments</h3>
              <p className="text-gray-600">
                Send payment links and process cards in one place
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">&copy; 2025 CloserOS. Built with ❤️ for high-ticket closers.</p>
        </div>
      </div>
    </div>
  );
}
