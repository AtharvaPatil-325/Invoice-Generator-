import { toast } from 'react-hot-toast'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function SettingsPage() {
  const { user, signOut } = useAuth()

  const handleDeleteAccount = async () => {
    if (!confirm('This will permanently delete your account. Are you sure?')) return
    try {
      const { error } = await supabase.auth.admin.deleteUser(user!.id)
      if (error) throw new Error(error.message)
      toast.success('Account deleted')
      signOut()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Account</h2>
          <p className="text-gray-600 mb-4">Email: {user?.email}</p>
          <Button variant="danger" onClick={handleDeleteAccount}>Delete Account</Button>
        </div>
      </div>
    </div>
  )
}
