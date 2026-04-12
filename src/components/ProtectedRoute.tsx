import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import RacingLoader from './RacingLoader'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <RacingLoader message="Warming up the engine..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
