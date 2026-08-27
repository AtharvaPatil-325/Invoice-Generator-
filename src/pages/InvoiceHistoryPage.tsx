import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/common/Button'
import { Loading } from '@/components/common/Loading'
import { EmptyState } from '@/components/common/EmptyState'
import type { Invoice } from '@/types'
import { formatCurrency, formatDate, isOverdue } from '@/utils/invoiceCalculations'
import { getInvoices } from '@/services/invoiceService'

export function InvoiceHistoryPage() {
  const [invoices, setInvoices] = useState<(Invoice & { client: any })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const data = await getInvoices(user.id)
    setInvoices(data)
    setLoading(false)
  }

  if (loading) return <Loading text="Loading invoices..." />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link to="/app/invoices/create">
          <Button>+ Create Invoice</Button>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create your first professional invoice to get started."
            action={
              <Link to="/app/invoices/create">
                <Button>Create Invoice</Button>
              </Link>
            }
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link to={`/app/invoices/${invoice.id}`} className="hover:text-primary">
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.client?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(invoice.issue_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(invoice.due_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.total_amount, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      isOverdue(invoice.due_date, invoice.status) ? 'bg-red-100 text-red-800' :
                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      invoice.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isOverdue(invoice.due_date, invoice.status) && invoice.status !== 'paid' ? 'Overdue' : invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                    <Link to={`/app/invoices/${invoice.id}`} className="text-primary hover:underline">View</Link>
                    <Link to={`/app/invoices/${invoice.id}/edit`} className="text-primary hover:underline">Edit</Link>
                    <Link to={`/app/invoices/${invoice.id}`} className="text-primary hover:underline">PDF</Link>
                    <button onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser()
                        if (!user) return
                        const { duplicateInvoice } = await import('@/services/invoiceService')
                        await duplicateInvoice(user.id, invoice.id)
                        toast.success('Invoice duplicated')
                        loadInvoices()
                      } catch (err: any) { toast.error(err.message) }
                    }} className="text-primary hover:underline">Duplicate</button>
                    <button onClick={async () => {
                      if (!confirm('Are you sure you want to delete this invoice?')) return
                      try {
                        const { data: { user } } = await supabase.auth.getUser()
                        if (!user) return
                        const { deleteInvoice } = await import('@/services/invoiceService')
                        await deleteInvoice(user.id, invoice.id)
                        toast.success('Invoice deleted')
                        loadInvoices()
                      } catch (err: any) { toast.error(err.message) }
                    }} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
