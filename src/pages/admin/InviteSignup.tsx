import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../../lib/firebase'
import { useUsers } from '../../hooks/useUsers'
import type { Invite } from '../../lib/types'
import { UserPlus, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

export default function InviteSignup() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''
  const { getInviteByToken, markInviteUsed, ensureUser } = useUsers()

  const [invite, setInvite] = useState<Invite | null>(null)
  const [checking, setChecking] = useState(true)
  const [invalid, setInvalid] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setInvalid(true)
      setChecking(false)
      return
    }
    getInviteByToken(token).then((inv) => {
      if (inv) {
        setInvite(inv)
      } else {
        setInvalid(true)
      }
      setChecking(false)
    })
  }, [token, getInviteByToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!invite) return

    setCreating(true)
    try {
      if (isFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, invite.email, password)
        const { setDoc, doc } = await import('firebase/firestore')
        const { db } = await import('../../lib/firebase')
        if (db) {
          await setDoc(doc(db, 'users', cred.user.uid), {
            email: invite.email,
            displayName: displayName.trim() || invite.email.split('@')[0],
            role: invite.role,
            createdAt: Date.now(),
          })
        }
      } else {
        await ensureUser(crypto.randomUUID(), invite.email, displayName.trim())
      }

      await markInviteUsed(token)
      setSuccess(true)
      setTimeout(() => navigate('/admin', { replace: true }), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create account'
      if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (msg.includes('weak-password')) {
        setError('Password is too weak — use at least 6 characters')
      } else {
        setError(msg)
      }
    } finally {
      setCreating(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <div className="text-center max-w-md p-8">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Invalid or Expired Invite</h1>
          <p className="text-white/60 text-sm mb-6">
            This invite link is no longer valid. It may have already been used or been revoked by the admin.
          </p>
          <button
            onClick={() => navigate('/admin/login')}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <div className="text-center max-w-md p-8">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Account Created!</h1>
          <p className="text-white/60 text-sm">Redirecting you to the admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dark">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img src="/tfs-logo.png" alt="TFS" className="w-16 h-16 rounded-full mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white">
            <span className="text-primary">TFS</span> Admin
          </h1>
          <p className="text-white/60 mt-2 text-sm">You've been invited to join the team</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur rounded-xl p-6 space-y-5">
          <div className="bg-primary/10 border border-primary/30 px-4 py-3 rounded-lg">
            <p className="text-sm text-white/80">
              Signing up as <strong className="text-white">{invite?.email}</strong>
            </p>
            <p className="text-xs text-white/50 mt-0.5">
              Role: <span className="capitalize">{invite?.role}</span>
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-white/70 text-sm font-medium mb-1.5">Your Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm font-medium mb-1.5">Create Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
              placeholder="Min. 6 characters"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm font-medium mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-primary"
              placeholder="Repeat password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {creating ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-white/30 text-xs mt-4">
          Already have an account?{' '}
          <button onClick={() => navigate('/admin/login')} className="text-primary hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
