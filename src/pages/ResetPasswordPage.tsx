import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'

const schema = z.object({ password: z.string().min(6, 'Password must be at least 6 characters') })
type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

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
      toast.error(error.message)
    } else {
      toast.success('Password updated successfully')
      navigate('/app/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="New Password" type="password" {...register('password')} error={errors.password?.message} />
            <Button type="submit" loading={loading} className="w-full">Update Password</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
