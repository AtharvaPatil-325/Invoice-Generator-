import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { getInvoices, deleteInvoice, duplicateInvoice } from '@/services/invoiceService'
import type { Invoice, InvoiceItem } from '@/types'
import { formatCurrency, formatDate, isOverdue } from '@/utils/invoiceCalculations'
import { Button } from '@/components/common/Button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { Avatar } from '@/components/common/Avatar'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SkeletonStatCard, SkeletonTable } from '@/components/common/Skeleton'
import { generateInvoicePDF } from '@/services/pdfService'
import { getBusinessProfile } from '@/services/businessProfileService'
import {
  FileText,
  FileClock,
  Send,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Eye,
  Edit,
  Download,
  Copy,
  Trash2,
  DollarSign,
  Briefcase,
} from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<(Invoice & { client: any; items?: InvoiceItem[] })[]>([])
  const [loading, setLoading] = useState(true)

  // Confirm delete dialog state
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
      toast.success('Invoice deleted successfully')
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

  // Calculate Metrics
  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => isOverdue(i.due_date, i.status)).length,
    totalValue: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
    paidValue: invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0),
    pendingValue: invoices
      .filter((i) => i.status === 'sent' || i.status === 'draft')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0),
    overdueValue: invoices
      .filter((i) => isOverdue(i.due_date, i.status))
      .reduce((sum, i) => sum + (i.total_amount || 0), 0),
  }

  const paidPercentage =
    stats.totalValue > 0 ? Math.min(100, Math.round((stats.paidValue / stats.totalValue) * 100)) : 0

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <SkeletonTable rows={5} />
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Invoices',
      value: stats.total,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100',
    },
    {
      title: 'Draft',
      value: stats.draft,
      icon: FileClock,
      color: 'text-slate-600',
      bg: 'bg-slate-100 border-slate-200',
    },
    {
      title: 'Sent',
      value: stats.sent,
      icon: Send,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Paid',
      value: stats.paid,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-100',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track revenue, manage client billing, and monitor invoice statuses.
          </p>
        </div>
        <Link to="/app/invoices/create">
          <Button icon={<Plus className="w-4 h-4" />} size="md" className="shadow-md">
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">{card.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Financial Summary & Revenue Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-linear-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
            <TrendingUp className="w-64 h-64 text-white" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-white/10 backdrop-blur-xs text-blue-400">
                <DollarSign className="w-5 h-5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Total Invoice Value
              </span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                {formatCurrency(stats.totalValue, 'INR')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">Cumulative value of all generated invoices</p>
            </div>
          </div>

          {/* Progress Bar & Sub-metrics */}
          <div className="mt-8 pt-6 border-t border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span>Collection Progress ({paidPercentage}% Paid)</span>
              <span>{formatCurrency(stats.paidValue, 'INR')} / {formatCurrency(stats.totalValue, 'INR')}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${paidPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Paid</span>
                <span className="font-bold text-emerald-400 mt-0.5 block truncate">
                  {formatCurrency(stats.paidValue, 'INR')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Pending</span>
                <span className="font-bold text-amber-400 mt-0.5 block truncate">
                  {formatCurrency(stats.pendingValue, 'INR')}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="block text-slate-400 text-[10px] uppercase font-semibold">Overdue</span>
                <span className="font-bold text-rose-400 mt-0.5 block truncate">
                  {formatCurrency(stats.overdueValue, 'INR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action / Tips Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Manage Your Business</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ensure your business profile and tax details are completed so invoices automatically populate with correct info.
            </p>
          </div>

          <div className="space-y-2 pt-6">
            <Link
              to="/app/clients"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-xs font-semibold text-slate-700 transition-colors"
            >
              <span>Manage Clients</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              to="/app/business-profile"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-xs font-semibold text-slate-700 transition-colors"
            >
              <span>Edit Business Profile</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Invoices</h2>
          <Link
            to="/app/invoices"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 group"
          >
            <span>View All Invoices</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices created yet"
            description="Create your first professional invoice to send to clients and start tracking payments."
            action={
              <Link to="/app/invoices/create">
                <Button icon={<Plus className="w-4 h-4" />}>Create Your First Invoice</Button>
              </Link>
            }
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                  {invoices.slice(0, 5).map((invoice) => {
                    const overdueFlag = isOverdue(invoice.due_date, invoice.status)
                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                          <Link
                            to={`/app/invoices/${invoice.id}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-bold"
                          >
                            {invoice.invoice_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <Avatar name={invoice.client?.name} size="sm" />
                            <span className="font-semibold text-slate-900">
                              {invoice.client?.name || 'Unassigned'}
                            </span>
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
                          <StatusBadge status={invoice.status} isOverdue={overdueFlag} />
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
      </div>

      {/* Delete Confirmation Modal */}
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
