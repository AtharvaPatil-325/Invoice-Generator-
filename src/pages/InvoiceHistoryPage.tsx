import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { getInvoices, deleteInvoice, duplicateInvoice, updateInvoiceStatus } from '@/services/invoiceService'
import { getBusinessProfile } from '@/services/businessProfileService'
import { generateInvoicePDF } from '@/services/pdfService'
import type { Invoice, InvoiceItem } from '@/types'
import { formatCurrency, formatDate, isOverdue } from '@/utils/invoiceCalculations'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { EmptyState } from '@/components/common/EmptyState'
import { Avatar } from '@/components/common/Avatar'
import { Card } from '@/components/common/Card'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SkeletonTable } from '@/components/common/Skeleton'
import {
  Search,
  Plus,
  Eye,
  Edit,
  Download,
  Copy,
  Trash2,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'

export function InvoiceHistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<(Invoice & { client: any; items?: InvoiceItem[] })[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'due_date'>('newest')

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      loadInvoices(user.id)
    }
  }, [user])

  const loadInvoices = async (userId: string) => {
    try {
      const data = await getInvoices(userId)
      setInvoices(data)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId || !user) return
    setDeleting(true)
    try {
      await deleteInvoice(user.id, deleteId)
      toast.success('Invoice deleted')
      setDeleteId(null)
      loadInvoices(user.id)
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete invoice')
    } finally {
      setDeleting(false)
    }
  }

  const handleDuplicate = async (invoiceId: string) => {
    if (!user) return
    try {
      await duplicateInvoice(user.id, invoiceId)
      toast.success('Invoice duplicated as draft')
      loadInvoices(user.id)
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate invoice')
    }
  }

  const handleDownloadPDF = async (inv: Invoice & { client: any; items?: InvoiceItem[] }) => {
    if (!user) return
    try {
      const business = await getBusinessProfile(user.id)
      generateInvoicePDF(inv as any, business)
      toast.success('PDF generated successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate PDF')
    }
  }

  const handleQuickStatusChange = async (invoiceId: string, newStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => {
    if (!user) return
    try {
      await updateInvoiceStatus(user.id, invoiceId, newStatus)
      setInvoices((prev) => prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv)))
      toast.success(`Invoice marked as ${newStatus}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    }
  }

  // Filter and sort invoices list
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch =
          inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())

        const overdueFlag = isOverdue(inv.due_date, inv.status)
        const currentStatus = overdueFlag && inv.status !== 'paid' && inv.status !== 'cancelled' ? 'overdue' : inv.status

        const matchesStatus =
          statusFilter === 'all' || currentStatus === statusFilter

        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (sortBy === 'amount_desc') return (b.total_amount || 0) - (a.total_amount || 0)
        if (sortBy === 'due_date') return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        return 0
      })
  }, [invoices, searchQuery, statusFilter, sortBy])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-32 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-56 bg-slate-200 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <SkeletonTable rows={7} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-up duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage, filter, track and organize all your client invoices in one place.
          </p>
        </div>
        <Link to="/app/invoices/create">
          <Button icon={<Plus className="w-4 h-4" />} size="md" className="shadow-sm">
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Toolbar / Filters */}
      <Card variant="default" padding="md" hover={false}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="w-full lg:w-80">
            <Input
              placeholder="Search by invoice # or client..."
              icon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters and Sort Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            {/* Status Filter Tabs / Dropdown */}
            <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold overflow-x-auto">
              {['all', 'draft', 'sent', 'paid', 'overdue'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all duration-150 ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none pl-9 pr-8 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600 cursor-pointer transition-all duration-150"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="due_date">Due Date</option>
              </select>
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </Card>

      {/* Invoices List Table */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          title={searchQuery || statusFilter !== 'all' ? 'No matching invoices found' : 'No invoices created yet'}
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or status filter.'
              : 'Create your first professional invoice to start tracking payments.'
          }
          action={
            searchQuery || statusFilter !== 'all' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Link to="/app/invoices/create">
                <Button icon={<Plus className="w-4 h-4" />}>Create Your First Invoice</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5">Invoice</th>
                  <th className="px-6 py-3.5">Client</th>
                  <th className="px-6 py-3.5">Issue Date</th>
                  <th className="px-6 py-3.5">Due Date</th>
                  <th className="px-6 py-3.5">Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredInvoices.map((invoice) => {
                  const overdueFlag = isOverdue(invoice.due_date, invoice.status)
                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-slate-50/80 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                        <Link
                          to={`/app/invoices/${invoice.id}`}
                          className="text-primary-600 hover:text-primary-800 hover:underline font-bold transition-colors duration-150"
                        >
                          {invoice.invoice_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <Avatar name={invoice.client?.name} size="sm" />
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {invoice.client?.name || 'Unassigned'}
                            </span>
                            {invoice.client?.company_name && (
                              <span className="text-[11px] text-slate-400 block">
                                {invoice.client.company_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {formatDate(invoice.issue_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                        {formatCurrency(invoice.total_amount, invoice.currency || 'INR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={overdueFlag && invoice.status !== 'paid' && invoice.status !== 'cancelled' ? 'overdue' : invoice.status}
                          onChange={(e) => handleQuickStatusChange(invoice.id, e.target.value as any)}
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-600 transition-all duration-150"
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <DropdownMenu
                          items={[
                            {
                              label: 'View Details',
                              icon: <Eye className="w-4 h-4" />,
                              onClick: () => navigate(`/app/invoices/${invoice.id}`),
                            },
                            {
                              label: 'Edit Invoice',
                              icon: <Edit className="w-4 h-4" />,
                              onClick: () => navigate(`/app/invoices/${invoice.id}/edit`),
                            },
                            {
                              label: 'Download PDF',
                              icon: <Download className="w-4 h-4" />,
                              onClick: () => handleDownloadPDF(invoice),
                            },
                            {
                              label: 'Duplicate',
                              icon: <Copy className="w-4 h-4" />,
                              onClick: () => handleDuplicate(invoice.id),
                            },
                            {
                              label: 'Delete',
                              icon: <Trash2 className="w-4 h-4" />,
                              danger: true,
                              onClick: () => setDeleteId(invoice.id),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        loading={deleting}
      />
    </div>
  )
}