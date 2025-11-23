export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">CloserOS</h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered OS for high-ticket closers & setters
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </a>
          <a
            href="/register"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            Sign Up
          </a>
        </div>
        <div className="mt-12 p-6 bg-gray-100 rounded-lg max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">Development Mode</h2>
          <p className="text-sm text-gray-600 mb-2">
            API: <code className="bg-white px-2 py-1 rounded">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}</code>
          </p>
          <p className="text-sm text-gray-600">
            API Docs: <a href="http://localhost:3001/api/docs" className="text-blue-600 hover:underline">http://localhost:3001/api/docs</a>
          </p>
        </div>
      </div>
    </main>
  )
}
