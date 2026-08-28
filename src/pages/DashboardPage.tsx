import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { getInvoices, deleteInvoice, duplicateInvoice } from '@/services/invoiceService'
import { getClients } from '@/services/clientService'
import type { Invoice, InvoiceItem, Client } from '@/types'
import { formatCurrency, formatDate, isOverdue } from '@/utils/invoiceCalculations'
import { calculateAnalytics, type DateRange, type AnalyticsFilters } from '@/utils/analyticsCalculations'
import { Button } from '@/components/common/Button'
import { StatusBadge } from '@/components/common/StatusBadge'
import { EmptyState } from '@/components/common/EmptyState'
import { Avatar } from '@/components/common/Avatar'
import { CardIcon } from '@/components/common/Card'
import { DropdownMenu } from '@/components/common/DropdownMenu'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SkeletonStatCard, SkeletonTable } from '@/components/common/Skeleton'
import { AnalyticsMetricCard } from '@/components/analytics/AnalyticsMetricCard'
import { RevenueChart } from '@/components/analytics/RevenueChart'
import { InvoiceStatusChart } from '@/components/analytics/InvoiceStatusChart'
import { TopClientsCard } from '@/components/analytics/TopClientsCard'
import { CollectionRateCard } from '@/components/analytics/CollectionRateCard'
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter'
import { AnalyticsSkeleton } from '@/components/analytics/AnalyticsSkeleton'
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
  Wallet,
  DollarSign,
  BarChart3,
  Target,
} from 'lucide-react'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<(Invoice & { client: any; items?: InvoiceItem[] })[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [analyticsDateRange, setAnalyticsDateRange] = useState<DateRange>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  // Confirm delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (user) {
      loadData(user.id)
    }
  }, [user])

  const loadData = async (userId: string) => {
    try {
      const [invoicesData, clientsData] = await Promise.all([
        getInvoices(userId),
        getClients(userId),
      ])
      setInvoices(invoicesData)
      setClients(clientsData)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard data')
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
      loadData(user.id)
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
      loadData(user.id)
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate invoice')
    }
  }

  const handleDownloadPDF = async (inv: Invoice & { client: any; items?: InvoiceItem[] }) => {
    if (!user) return
    try {
      const business = await getBusinessProfile(user.id)
      await generateInvoicePDF(inv as any, business)
      toast.success('PDF generated successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate PDF')
    }
  }

  const analyticsFilters: AnalyticsFilters = useMemo(() => ({
    dateRange: analyticsDateRange,
    customStart: customStart || undefined,
    customEnd: customEnd || undefined,
  }), [analyticsDateRange, customStart, customEnd])

  const analytics = useMemo(() => calculateAnalytics(invoices, clients, analyticsFilters), [invoices, clients, analyticsFilters])

  const stats = {
    total: invoices.length,
    draft: invoices.filter((i) => i.status === 'draft').length,
    sent: invoices.filter((i) => i.status === 'sent').length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => isOverdue(i.due_date, i.status)).length,
  }

  const growthInfo = useMemo(() => {
    const { revenueGrowthPercentage } = analytics
    return {
      text: `${revenueGrowthPercentage >= 0 ? '+' : ''}${revenueGrowthPercentage.toFixed(1)}%`,
      isPositive: revenueGrowthPercentage >= 0,
    }
  }, [analytics])

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
        <AnalyticsSkeleton />
        <SkeletonTable rows={5} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in slide-up duration-200">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track revenue, manage client billing, and monitor invoice statuses.
          </p>
        </div>
        <Link to="/app/invoices/create">
          <Button icon={<Plus className="w-4 h-4" />} size="md" className="shadow-sm">
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: 'Total Invoices', value: stats.total, icon: FileText, color: 'primary' as const },
          { title: 'Draft', value: stats.draft, icon: FileClock, color: 'slate' as const },
          { title: 'Sent', value: stats.sent, icon: Send, color: 'indigo' as const },
          { title: 'Paid', value: stats.paid, icon: CheckCircle2, color: 'success' as const },
          { title: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'danger' as const },
        ].map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className={`bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-in slide-up stagger-${index + 1}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.title}</span>
                <CardIcon color={card.color} size="sm">
                  <Icon className="w-4 h-4" />
                </CardIcon>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">{card.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Financial Overview Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Financial Overview</h2>
            <p className="text-xs text-slate-500">Revenue, growth, and collection metrics</p>
          </div>
          <DateRangeFilter
            value={analyticsDateRange}
            onChange={(range) => {
              setAnalyticsDateRange(range)
              if (range !== 'custom') {
                setCustomStart('')
                setCustomEnd('')
              }
            }}
            onCustomChange={(start, end) => {
              if (start && end) {
                setAnalyticsDateRange('custom')
                setCustomStart(start)
                setCustomEnd(end)
              }
            }}
          />
        </div>

        {/* Revenue Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsMetricCard
            title="Revenue This Month"
            value={formatCurrency(analytics.currentMonthRevenue, analytics.currency)}
            subtitle="Current calendar month"
            growth={{
              value: analytics.revenueGrowthPercentage,
              label: 'from last month',
            }}
            icon={<Wallet className="w-4 h-4" />}
            iconColor="primary"
          />
          <AnalyticsMetricCard
            title="Average Invoice Value"
            value={formatCurrency(analytics.averageInvoiceValue, analytics.currency)}
            subtitle={`${analytics.invoiceCount} valid invoices`}
            icon={<DollarSign className="w-4 h-4" />}
            iconColor="indigo"
          />
          <AnalyticsMetricCard
            title="Collection Rate"
            value={`${analytics.collectionRate}%`}
            subtitle={`${formatCurrency(analytics.paidAmount, analytics.currency)} collected`}
            icon={<Target className="w-4 h-4" />}
            iconColor="success"
          />
          <AnalyticsMetricCard
            title="Outstanding Revenue"
            value={formatCurrency(analytics.outstandingAmount, analytics.currency)}
            subtitle="Pending, sent & overdue"
            icon={<BarChart3 className="w-4 h-4" />}
            iconColor="warning"
          />
        </div>
      </div>

      {/* Revenue Performance */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Revenue Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Revenue Overview</h3>
            <RevenueChart data={analytics.revenueHistory} currency={analytics.currency} timeRange={analyticsDateRange} />
          </div>
          <InvoiceStatusChart
            paid={analytics.paidAmount}
            pending={analytics.pendingAmount}
            sent={analytics.sentAmount}
            overdue={analytics.overdueAmount}
            currency={analytics.currency}
            paidCount={analytics.paidCount}
            pendingCount={analytics.pendingCount}
            sentCount={analytics.sentCount}
            overdueCount={analytics.overdueCount}
          />
        </div>
      </div>

      {/* Client Performance */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Client Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopClientsCard clients={analytics.topClients} currency={analytics.currency} />
          <CollectionRateCard
            rate={analytics.collectionRate}
            collected={analytics.paidAmount}
            total={analytics.totalRevenue}
            currency={analytics.currency}
          />
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Financial Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Revenue</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(analytics.totalRevenue, analytics.currency)}</p>
            <div className={`flex items-center mt-1 text-xs font-semibold ${growthInfo.isPositive ? 'text-success-600' : 'text-danger-600'}`}>
              {growthInfo.isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : null}
              <span>{growthInfo.text} from last month</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Collected</p>
            <p className="text-xl font-bold text-success-600">{formatCurrency(analytics.paidAmount, analytics.currency)}</p>
            <p className="text-xs text-slate-500 mt-1">{analytics.paidCount} paid invoices</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Outstanding</p>
            <p className="text-xl font-bold text-warning-600">{formatCurrency(analytics.outstandingAmount, analytics.currency)}</p>
            <p className="text-xs text-slate-500 mt-1">{analytics.pendingCount + analytics.sentCount + analytics.overdueCount} unpaid invoices</p>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Invoices</h2>
          <Link
            to="/app/invoices"
            className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center space-x-1 group transition-colors duration-150"
          >
            <span>View All Invoices</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
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
                  {invoices.slice(0, 5).map((invoice) => {
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