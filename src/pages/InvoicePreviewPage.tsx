import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/common/Button'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import type { Invoice, BusinessProfile, InvoiceItem } from '@/types'
import { getInvoice } from '@/services/invoiceService'
import { getBusinessProfile } from '@/services/businessProfileService'
import { generateInvoicePDF } from '@/services/pdfService'
import { formatCurrency, formatDate, isOverdue } from '@/utils/invoiceCalculations'

export function InvoicePreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState<(Invoice & { client: any; items: InvoiceItem[] }) | null>(null)
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !id) return
    const [inv, biz] = await Promise.all([
      getInvoice(user.id, id),
      getBusinessProfile(user.id),
    ])
    setInvoice(inv)
    setBusiness(biz)
    setLoading(false)
  }

  const handleDownload = () => {
    if (!invoice) return
    generateInvoicePDF(invoice, business)
    toast.success('PDF downloaded')
  }

  if (loading) return <Loading text="Loading invoice..." />
  if (!invoice) return <EmptyState title="Invoice not found" description="The invoice you're looking for doesn't exist or you don't have access to it." />

  const isOverdueStatus = isOverdue(invoice.due_date, invoice.status)

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Preview</h1>
        <div className="space-x-3">
          <Button variant="secondary" onClick={() => navigate(`/app/invoices/${id}/edit`)}>Edit</Button>
          <Button onClick={handleDownload}>Download PDF</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8" id="invoice-preview">
        <div className="flex justify-between items-start mb-8">
          <div>
            {business?.logo_path && (
              <img src={business.logo_path} alt="Logo" className="h-16 mb-4" />
            )}
            <h2 className="text-xl font-bold">{business?.business_name || 'Your Business'}</h2>
            {business?.address && <p className="text-gray-600">{business.address}</p>}
            {(business?.city || business?.state) && <p className="text-gray-600">{[business.city, business.state, business.country, business.postal_code].filter(Boolean).join(', ')}</p>}
            {business?.email && <p className="text-gray-600">{business.email}</p>}
            {business?.phone && <p className="text-gray-600">{business.phone}</p>}
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-primary mb-2">INVOICE</h1>
            <p className="text-gray-600">#{invoice.invoice_number}</p>
            <p className="text-gray-600">Issue: {formatDate(invoice.issue_date)}</p>
            <p className="text-gray-600">Due: {formatDate(invoice.due_date)}</p>
            <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
              isOverdueStatus ? 'bg-red-100 text-red-800' :
              invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              invoice.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {isOverdueStatus && invoice.status !== 'paid' ? 'Overdue' : invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
          <p className="font-semibold">{invoice.client?.name}</p>
          {invoice.client?.company_name && <p className="text-gray-600">{invoice.client.company_name}</p>}
          {invoice.client?.email && <p className="text-gray-600">{invoice.client.email}</p>}
          {invoice.client?.address && <p className="text-gray-600">{[invoice.client.address, invoice.client.city, invoice.client.state, invoice.client.country, invoice.client.postal_code].filter(Boolean).join(', ')}</p>}
        </div>

        <div className="border-t border-gray-200 pt-6 mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-semibold text-gray-500">Description</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-500">Qty</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-500">Rate</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-500">Tax</th>
                <th className="text-right py-2 text-sm font-semibold text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3">
                    <p className="font-medium">{item.name}</p>
                    {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                  </td>
                  <td className="text-right py-3">{item.quantity}</td>
                  <td className="text-right py-3">{formatCurrency(item.unit_price, invoice.currency)}</td>
                  <td className="text-right py-3">{item.tax_rate}%</td>
                  <td className="text-right py-3 font-medium">{formatCurrency(item.line_total, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax</span><span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span></div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-sm"><span>Discount</span><span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span></div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(invoice.total_amount, invoice.currency)}</span></div>
          </div>
        </div>

        {(invoice.notes || invoice.terms || invoice.payment_instructions) && (
          <div className="border-t border-gray-200 pt-6 mt-8 space-y-4">
            {invoice.notes && <div><h4 className="font-semibold mb-1">Notes</h4><p className="text-gray-600 text-sm">{invoice.notes}</p></div>}
            {invoice.terms && <div><h4 className="font-semibold mb-1">Terms & Conditions</h4><p className="text-gray-600 text-sm">{invoice.terms}</p></div>}
            {invoice.payment_instructions && <div><h4 className="font-semibold mb-1">Payment Instructions</h4><p className="text-gray-600 text-sm">{invoice.payment_instructions}</p></div>}
          </div>
        )}
      </div>
    </div>
  )
}
