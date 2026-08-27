import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import type { Client } from '@/types'
import { getClients, createClient, updateClient, deleteClient, searchClients } from '@/services/clientService'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  company_name: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  tax_number: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ClientManagementPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const data = await getClients(user.id)
    setClients(data)
    setLoading(false)
  }

  const openCreateModal = () => {
    setEditingClient(null)
    reset({})
    setIsModalOpen(true)
  }

  const openEditModal = (client: Client) => {
    setEditingClient(client)
    reset({
      name: client.name,
      company_name: client.company_name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      country: client.country || '',
      postal_code: client.postal_code || '',
      tax_number: client.tax_number || '',
    })
    setIsModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (editingClient) {
        await updateClient(user.id, editingClient.id, data as any)
        toast.success('Client updated')
      } else {
        await createClient(user.id, data as any)
        toast.success('Client created')
      }
      setIsModalOpen(false)
      loadClients()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (client: Client) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await deleteClient(user.id, client.id)
      toast.success('Client deleted')
      loadClients()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      loadClients()
      return
    }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const results = await searchClients(user.id, query)
      setClients(results)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <Loading text="Loading clients..." />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Button onClick={openCreateModal}>+ Add Client</Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add your first client to start creating invoices."
          action={<Button onClick={openCreateModal}>Add Client</Button>}
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.company_name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{client.phone || '-'}</td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    <button onClick={() => openEditModal(client)} className="text-primary hover:underline">Edit</button>
                    <button onClick={() => handleDelete(client)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? 'Edit Client' : 'Add Client'} footer={
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>{editingClient ? 'Update' : 'Create'}</Button>
        </div>
      }>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" {...register('name')} error={errors.name?.message} />
          <Input label="Company Name" {...register('company_name')} error={errors.company_name?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
          <Input label="Address" {...register('address')} error={errors.address?.message} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City" {...register('city')} error={errors.city?.message} />
            <Input label="State" {...register('state')} error={errors.state?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Country" {...register('country')} error={errors.country?.message} />
            <Input label="Postal Code" {...register('postal_code')} error={errors.postal_code?.message} />
          </div>
          <Input label="Tax Number" {...register('tax_number')} error={errors.tax_number?.message} />
        </form>
      </Modal>
    </div>
  )
}
