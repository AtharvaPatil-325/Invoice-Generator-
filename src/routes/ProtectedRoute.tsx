import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loading } from '@/components/common/Loading'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loading text="Checking authentication..." />
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  return <>{children}</>
}
