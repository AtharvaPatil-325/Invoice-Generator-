import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/common/Card'
import { Avatar } from '@/components/common/Avatar'
import { User, Shield, KeyRound, Trash2 } from 'lucide-react'

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      toast.error('Account deletion requires admin level privileges')
      signOut()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6 animate-in slide-up duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account credentials, security settings, and app preferences.
        </p>
      </div>

      {/* Profile Card */}
      <Card variant="default" padding="lg" hover={false}>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-primary-50 text-primary-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>Your current account details</CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <Avatar email={user?.email} size="lg" />
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Signed in email
            </span>
            <span className="text-base font-bold text-slate-900">{user?.email || 'N/A'}</span>
          </div>
        </div>
      </Card>

      {/* Security Section */}
      <Card variant="default" padding="lg" hover={false}>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Security & Password</CardTitle>
              <CardDescription>Password management and session security</CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/80 bg-white">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <KeyRound className="w-4 h-4 mr-2 text-slate-400" />
              Password Reset
            </h3>
            <p className="text-xs text-slate-500">
              Need to change your password? Request a password reset email link.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={signOut}>
            Sign Out & Reset
          </Button>
        </div>
      </Card>

      {/* Danger Zone Section */}
      <Card variant="filled" padding="lg" hover={false}>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-danger-50 text-danger-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible actions on your account</CardDescription>
            </div>
          </div>
        </CardHeader>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-danger-100 bg-danger-50/50">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-danger-900">Delete Account</h3>
            <p className="text-xs text-slate-500">
              Permanently delete your account and remove all stored invoice data.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? All invoices and client records will be removed."
        loading={deleting}
      />
    </div>
  )
}