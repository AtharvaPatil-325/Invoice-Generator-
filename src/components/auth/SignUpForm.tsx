import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Receipt, Mail, Lock, User, ArrowRight } from 'lucide-react'

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export function SignUpForm() {
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    const { error } = await signUp(data.email, data.password, data.fullName)
    setLoading(false)
    if (error) {
      toast.error(error.message || 'Failed to create account')
    } else {
      toast.success('Account created! Please check your email or sign in.')
      navigate('/signin')
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-1">
            <Receipt className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Get started with InvoiceGen
          </h1>
          <p className="text-xs text-slate-500">
            Create your free account and send professional invoices in minutes.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              icon={<User className="w-4 h-4" />}
              {...register('fullName')}
              error={errors.fullName?.message}
              placeholder="Alex Morgan"
            />

            <Input
              label="Email Address"
              type="email"
              icon={<Mail className="w-4 h-4" />}
              {...register('email')}
              error={errors.email?.message}
              placeholder="alex@company.com"
            />

            <Input
              label="Password"
              type="password"
              icon={<Lock className="w-4 h-4" />}
              {...register('password')}
              error={errors.password?.message}
              placeholder="Minimum 6 characters"
            />

            <Button
              type="submit"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
              className="w-full shadow-md py-2.5 mt-2"
            >
              Create Account
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/signin" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
