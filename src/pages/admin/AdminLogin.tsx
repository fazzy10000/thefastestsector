import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LogIn, Zap } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, demoSignIn, isDemo, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true })
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/admin')
    } catch {
      setError(isDemo ? 'Firebase not configured — use Demo Login below' : 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = () => {
    demoSignIn()
    setTimeout(() => navigate('/admin'), 50)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src="/thefastestsector/tfs-logo.png" alt="TFS" className="w-16 h-16 rounded-full mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white">
            <span className="text-primary">TFS</span> Admin
          </h1>
          <p className="text-white/60 mt-2 text-sm">Sign in to manage your content</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur rounded-xl p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-white/70 text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
              placeholder="Your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {isDemo && (
          <div className="mt-4">
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative px-3 text-xs text-white/40 bg-surface-dark">or</span>
            </div>
            <button
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors font-medium text-sm"
            >
              <Zap className="w-4 h-4 text-yellow-400" />
              Demo Login (no Firebase needed)
            </button>
            <p className="text-center text-white/30 text-xs mt-2">
              Data is stored in your browser's localStorage
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
