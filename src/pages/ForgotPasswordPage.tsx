import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Receipt, Mail, ArrowLeft, Send } from 'lucide-react'

const schema = z.object({ email: z.string().email('Please enter a valid email address') })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Failed to send reset link')
    } else {
      toast.success('Password reset link sent to your email')
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-1">
            <Receipt className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Forgot Password</h1>
          <p className="text-xs text-slate-500">
            Enter your account email to receive a password reset link.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Account Email"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              {...register('email')}
              error={errors.email?.message}
              placeholder="you@company.com"
            />
            <Button
              type="submit"
              loading={loading}
              icon={<Send className="w-4 h-4" />}
              className="w-full shadow-md py-2.5"
            >
              Send Reset Link
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs">
            <Link
              to="/signin"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-bold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
