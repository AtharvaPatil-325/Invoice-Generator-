import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Modal } from '@/components/common/Modal'
import { EmptyState } from '@/components/common/EmptyState'
import { Avatar } from '@/components/common/Avatar'
import { Card } from '@/components/common/Card'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SkeletonTable } from '@/components/common/Skeleton'
import type { Client } from '@/types'
import { getClients, createClient, updateClient, deleteClient, searchClients } from '@/services/clientService'
import {
  UserPlus,
  Search,
  Building,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
} from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Client name is required'),
  company_name: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
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
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (user) {
      loadClients(user.id)
    }
  }, [user])

  const loadClients = async (userId: string) => {
    try {
      const data = await getClients(userId)
      setClients(data)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingClient(null)
    reset({
      name: '',
      company_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      tax_number: '',
    })
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
    if (!user) return
    try {
      if (editingClient) {
        await updateClient(user.id, editingClient.id, data as any)
        toast.success('Client updated successfully')
      } else {
        await createClient(user.id, data as any)
        toast.success('Client added successfully')
      }
      setIsModalOpen(false)
      loadClients(user.id)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save client')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !user) return
    setDeleting(true)
    try {
      await deleteClient(user.id, deleteTarget.id)
      toast.success('Client deleted')
      setDeleteTarget(null)
      loadClients(user.id)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete client')
    } finally {
      setDeleting(false)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!user) return
    if (!query.trim()) {
      loadClients(user.id)
      return
    }
    try {
      const results = await searchClients(user.id, query)
      setClients(results)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-slate-200 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <SkeletonTable rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-up duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your customer database, contact details, and billing information.
          </p>
        </div>
        <Button icon={<UserPlus className="w-4 h-4" />} onClick={openCreateModal} className="shadow-sm">
          Add Client
        </Button>
      </div>

      {/* Search Toolbar */}
      <Card variant="default" padding="md" hover={false}>
        <div className="max-w-md">
          <Input
            placeholder="Search clients by name, company or email..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* Clients Table / List */}
      {clients.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No clients found' : 'No clients added yet'}
          description={
            searchQuery
              ? 'No client matched your search term.'
              : 'Add your first client to pre-fill invoices faster and track payments.'
          }
          action={
            searchQuery ? (
              <Button variant="secondary" onClick={() => handleSearch('')}>
                Clear Search
              </Button>
            ) : (
              <Button icon={<UserPlus className="w-4 h-4" />} onClick={openCreateModal}>
                Add Your First Client
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5">Client Name</th>
                  <th className="px-6 py-3.5">Company</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Tax / GST Number</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <Avatar name={client.name} size="md" />
                        <div>
                          <span className="font-bold text-slate-900 block text-sm">
                            {client.name}
                          </span>
                          {client.city && (
                            <span className="text-[11px] text-slate-400 flex items-center mt-0.5">
                              <MapPin className="w-3 h-3 mr-1" />
                              {[client.city, client.country].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                      {client.company_name ? (
                        <div className="flex items-center space-x-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.company_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {client.email ? (
                        <div className="flex items-center space-x-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {client.phone ? (
                        <div className="flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono">
                      {client.tax_number || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu
                        items={[
                          {
                            label: 'Edit Client',
                            icon: <Edit className="w-4 h-4" />,
                            onClick: () => openEditModal(client),
                          },
                          {
                            label: 'Delete Client',
                            icon: <Trash2 className="w-4 h-4" />,
                            danger: true,
                            onClick: () => setDeleteTarget(client),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Client Details' : 'Add New Client'}
        description={editingClient ? 'Update client information' : 'Enter client details for invoice billing'}
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting} className="shadow-sm">
              {editingClient ? 'Update Client' : 'Save Client'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Client Name *" {...register('name')} error={errors.name?.message} placeholder="e.g. John Doe" />
            <Input label="Company Name" {...register('company_name')} placeholder="e.g. Acme Corp" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} placeholder="client@example.com" />
            <Input label="Phone Number" {...register('phone')} placeholder="+1 (555) 000-0000" />
          </div>

          <Input label="Street Address" {...register('address')} placeholder="123 Business St, Suite 400" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input label="City" {...register('city')} placeholder="New York" />
            <Input label="State" {...register('state')} placeholder="NY" />
            <Input label="Postal Code" {...register('postal_code')} placeholder="10001" />
            <Input label="Country" {...register('country')} placeholder="United States" />
          </div>

          <Input label="GST / Tax Number" {...register('tax_number')} placeholder="e.g. GSTIN123456789" />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  )
}