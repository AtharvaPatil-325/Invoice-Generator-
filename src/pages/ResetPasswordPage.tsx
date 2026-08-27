import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Receipt, Lock, CheckCircle2 } from 'lucide-react'

const schema = z.object({ password: z.string().min(6, 'Password must be at least 6 characters') })
type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/signin')
    })
  }, [navigate])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Failed to update password')
    } else {
      toast.success('Password updated successfully!')
      navigate('/app/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-1">
            <Receipt className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-500">Please enter your new account password below.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              icon={<Lock className="w-4 h-4" />}
              {...register('password')}
              error={errors.password?.message}
              placeholder="Minimum 6 characters"
            />
            <Button
              type="submit"
              loading={loading}
              icon={<CheckCircle2 className="w-4 h-4" />}
              className="w-full shadow-md py-2.5"
            >
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
