import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'
import { SkeletonTable } from '@/components/common/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { Invoice, BusinessProfile, InvoiceItem } from '@/types'
import { getInvoice } from '@/services/invoiceService'
import { getBusinessProfile, getLogoUrl } from '@/services/businessProfileService'
import { updateInvoiceStatus } from '@/services/invoiceService'
import { generateInvoicePDF } from '@/services/pdfService'
import { formatCurrency, formatDate, isOverdue } from '@/utils/invoiceCalculations'
import { Edit, Download, ArrowLeft, Building2, Printer } from 'lucide-react'

export function InvoicePreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [invoice, setInvoice] = useState<(Invoice & { client: any; items: InvoiceItem[] }) | null>(null)
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (id && user) {
      loadData(user.id, id)
    }
  }, [id, user])

  const loadData = async (userId: string, invoiceId: string) => {
    try {
      const [inv, biz] = await Promise.all([
        getInvoice(userId, invoiceId),
        getBusinessProfile(userId),
      ])
      setInvoice(inv)
      setBusiness(biz)
      if (biz?.logo_path) {
        const url = await getLogoUrl(biz.logo_path)
        setLogoUrl(url)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invoice preview')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!invoice) return
    generateInvoicePDF(invoice, business)
    toast.success('PDF downloaded successfully')
  }

  const handleStatusChange = async (newStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => {
    if (!invoice || !user) return
    setUpdatingStatus(true)
    try {
      await updateInvoiceStatus(user.id, invoice.id, newStatus)
      setInvoice({ ...invoice, status: newStatus })
      toast.success(`Invoice marked as ${newStatus}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse" />
        <SkeletonTable rows={6} />
      </div>
    )
  }

  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        description="The requested invoice does not exist or you do not have permission to view it."
        action={
          <Link to="/app/invoices">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Invoices
            </Button>
          </Link>
        }
      />
    )
  }

  const overdueFlag = isOverdue(invoice.due_date, invoice.status)

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/app/invoices')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoice Preview</h1>
            <p className="text-sm text-slate-500 mt-0.5">{invoice.invoice_number}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</span>
            <select
              value={overdueFlag && invoice.status !== 'paid' && invoice.status !== 'cancelled' ? 'overdue' : invoice.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              disabled={updatingStatus}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 disabled:opacity-50"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <Button
            variant="secondary"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => navigate(`/app/invoices/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="secondary"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownload}
            className="shadow-md"
          >
            Download PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 sm:p-12 space-y-8" id="invoice-preview">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200/80 pb-8">
          <div className="space-y-3 max-w-sm">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-14 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{business?.business_name || 'Your Business Name'}</h2>
              {business?.address && <p className="text-xs text-slate-500 mt-1">{business.address}</p>}
              {(business?.city || business?.state || business?.country) && (
                <p className="text-xs text-slate-500">{[business.city, business.state, business.country, business.postal_code].filter(Boolean).join(', ')}</p>
              )}
              {business?.email && <p className="text-xs text-slate-500 mt-1">{business.email}</p>}
              {business?.phone && <p className="text-xs text-slate-500">{business.phone}</p>}
              {business?.tax_number && <p className="text-xs font-mono text-slate-400 mt-1">Tax/GST: {business.tax_number}</p>}
            </div>
          </div>

          <div className="sm:text-right space-y-2">
            <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">INVOICE</h1>
            <p className="text-base font-bold text-slate-900 font-mono">#{invoice.invoice_number}</p>
            <div className="text-xs text-slate-500 space-y-1 pt-1">
              <p><span className="font-semibold text-slate-700">Issue Date:</span> {formatDate(invoice.issue_date)}</p>
              <p><span className="font-semibold text-slate-700">Due Date:</span> {formatDate(invoice.due_date)}</p>
            </div>
            <div className="pt-2">
              <StatusBadge status={invoice.status} isOverdue={overdueFlag} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 rounded-xl p-5 border border-slate-100">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Billed To</span>
            <h3 className="text-base font-bold text-slate-900">{invoice.client?.name}</h3>
            {invoice.client?.company_name && <p className="text-xs font-semibold text-slate-700">{invoice.client.company_name}</p>}
            {invoice.client?.email && <p className="text-xs text-slate-500">{invoice.client.email}</p>}
            {invoice.client?.phone && <p className="text-xs text-slate-500">{invoice.client.phone}</p>}
          </div>
          <div className="space-y-1 sm:text-right">
            {invoice.client?.address && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Address</span>
                <p className="text-xs text-slate-600 max-w-xs sm:ml-auto">{invoice.client.address}</p>
                <p className="text-xs text-slate-600">{[invoice.client.city, invoice.client.state, invoice.client.country, invoice.client.postal_code].filter(Boolean).join(', ')}</p>
              </>
            )}
            {invoice.client?.tax_number && <p className="text-xs font-mono text-slate-500 pt-1">Client Tax ID: {invoice.client.tax_number}</p>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3">Item / Service Description</th>
                <th className="py-3 text-right">Qty</th>
                <th className="py-3 text-right">Rate</th>
                <th className="py-3 text-right">Tax</th>
                <th className="py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="py-4 pr-4">
                    <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                    {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                  </td>
                  <td className="py-4 text-right font-semibold text-slate-700">{item.quantity}</td>
                  <td className="py-4 text-right font-semibold text-slate-700">{formatCurrency(item.unit_price, invoice.currency)}</td>
                  <td className="py-4 text-right text-slate-500">{item.tax_rate > 0 ? `${item.tax_rate}%` : '0%'}</td>
                  <td className="py-4 text-right font-bold text-slate-900">{formatCurrency(item.line_total, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200/80">
          <div className="w-full sm:w-72 space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span className="text-slate-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Tax</span>
              <span className="text-slate-900">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between font-semibold text-emerald-600">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-base font-extrabold text-slate-900 border-t-2 border-slate-900 pt-3">
              <span>Total Amount</span>
              <span className="text-blue-600 font-mono">{formatCurrency(invoice.total_amount, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {(invoice.notes || invoice.terms || invoice.payment_instructions) && (
          <div className="border-t border-slate-200/80 pt-6 space-y-4 text-xs">
            {invoice.payment_instructions && (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <h4 className="font-bold text-blue-900 uppercase text-[10px] tracking-wider mb-1">Payment Instructions</h4>
                <p className="text-blue-800 whitespace-pre-line">{invoice.payment_instructions}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">Notes</h4>
                <p className="text-slate-600 whitespace-pre-line">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">Terms & Conditions</h4>
                <p className="text-slate-500 whitespace-pre-line">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
