import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { SkeletonTable } from '@/components/common/Skeleton'
import type { Client, InvoiceItem, Currency } from '@/types'
import {
  calculateLineTotal,
  calculateTax,
  calculateSubtotal,
  calculateTotalTax,
  calculateGrandTotal,
  formatCurrency,
} from '@/utils/invoiceCalculations'
import { getInvoice, updateInvoice } from '@/services/invoiceService'
import { getClients } from '@/services/clientService'
import {
  Plus,
  Trash2,
  ArrowLeft,
  DollarSign,
  User,
  Calendar,
  FileText,
  Save,
} from 'lucide-react'

const schema = z.object({
  client_id: z.string().min(1, 'Please select a client'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  notes: z.string().optional(),
  terms: z.string().optional(),
  payment_instructions: z.string().optional(),
  discount_amount: z.number().min(0),
})

type FormData = z.infer<typeof schema>

const emptyItem = {
  name: '',
  description: '',
  quantity: 1,
  unit_price: 0,
  tax_rate: 0,
  line_total: 0,
  tax_amount: 0,
}

export function EditInvoicePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()

  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<(InvoiceItem & { tempId?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) as any })

  useEffect(() => {
    if (!id || !user) return
    loadInvoice(user.id, id)
    loadClients(user.id)
  }, [id, user])

  const loadInvoice = async (userId: string, invoiceId: string) => {
    try {
      const data = await getInvoice(userId, invoiceId)
      setItems(data.items || [])
      reset({
        client_id: data.client_id,
        issue_date: data.issue_date,
        due_date: data.due_date,
        currency: (data.currency as 'INR' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD') || 'INR',
        status: data.status || 'draft',
        notes: data.notes || '',
        terms: data.terms || '',
        payment_instructions: data.payment_instructions || '',
        discount_amount: data.discount_amount || 0,
      })
    } catch (err: any) {
      toast.error(err.message || 'Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async (userId: string) => {
    try {
      setClients(await getClients(userId))
    } catch (err: any) {
      toast.error(err.message || 'Failed to load clients')
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        tempId: crypto.randomUUID(),
        invoice_id: id || '',
        user_id: user?.id || '',
        created_at: '',
        updated_at: '',
        ...emptyItem,
      },
    ])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items]
    const item = { ...updated[index], [field]: value }

    const qty = field === 'quantity' ? Number(value) || 0 : item.quantity
    const price = field === 'unit_price' ? Number(value) || 0 : item.unit_price
    const taxRate = field === 'tax_rate' ? Number(value) || 0 : item.tax_rate

    item.line_total = calculateLineTotal(qty, price)
    item.tax_amount = calculateTax(item.line_total, taxRate)

    updated[index] = item
    setItems(updated)
  }

  const discount = watch('discount_amount') || 0
  const currency = (watch('currency') as Currency) || 'INR'

  const subtotal = useMemo(() => calculateSubtotal(items), [items])
  const totalTax = useMemo(() => calculateTotalTax(items), [items])
  const total = useMemo(() => calculateGrandTotal(subtotal, totalTax, discount), [
    subtotal,
    totalTax,
    discount,
  ])

  const onSubmit = async (data: FormData) => {
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }
    if (!user || !id) return

    setSaving(true)
    try {
      await updateInvoice(
        user.id,
        id,
        {
          client_id: data.client_id,
          issue_date: data.issue_date,
          due_date: data.due_date,
          currency: data.currency as any,
          status: data.status,
          subtotal,
          tax_amount: totalTax,
          discount_amount: discount,
          total_amount: total,
          notes: data.notes || null,
          terms: data.terms || null,
          payment_instructions: data.payment_instructions || null,
        },
        items.map((i) => ({
          name: i.name,
          description: i.description || null,
          quantity: i.quantity,
          unit_price: i.unit_price,
          tax_rate: i.tax_rate,
          tax_amount: i.tax_amount,
          line_total: i.line_total,
        }))
      )
      toast.success('Invoice updated successfully')
      navigate(`/app/invoices/${id}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="h-8 w-40 bg-slate-200 rounded-lg animate-pulse" />
        <SkeletonTable rows={5} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link to={`/app/invoices/${id}`}>
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Invoice</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Update invoice details, client selection, items, or terms.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Client & Currency */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Client & Currency</h2>
              <p className="text-xs text-slate-500">Select customer and billing currency.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Select Client *
              </label>
              <select
                {...register('client_id')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company_name ? `(${c.company_name})` : ''}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="text-xs font-medium text-rose-600">{errors.client_id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Currency
              </label>
              <select
                {...register('currency')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              >
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="CAD">CAD - Canadian Dollar ($)</option>
                <option value="AUD">AUD - Australian Dollar ($)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Dates */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Dates & Due Terms</h2>
              <p className="text-xs text-slate-500">Specify issue date and payment due date.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Issue Date *"
              type="date"
              {...register('issue_date')}
              error={errors.issue_date?.message}
            />
            <Input
              label="Due Date *"
              type="date"
              {...register('due_date')}
              error={errors.due_date?.message}
            />
          </div>
        </div>

        {/* Section 3: Line Items */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Products & Services</h2>
                <p className="text-xs text-slate-500">Add invoice item rows with quantities and rates.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={addItem}
            >
              Add Item
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-500 mb-3">No items added yet.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={addItem}
              >
                Add First Item
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id || item.tempId || index}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-4">
                    <Input
                      label="Item Name *"
                      placeholder="e.g. Website Development"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <Input
                      label="Description"
                      placeholder="Optional details"
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Input
                      label="Qty"
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Price"
                      type="number"
                      min="0"
                      step="any"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <Input
                      label="Tax %"
                      type="number"
                      min="0"
                      max="100"
                      value={item.tax_rate}
                      onChange={(e) => updateItem(index, 'tax_rate', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-center justify-between sm:justify-end space-x-2 pt-2 sm:pt-0">
                    <span className="sm:hidden text-xs font-bold text-slate-500">Line Total:</span>
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {formatCurrency(item.line_total, currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Totals Summary */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Payment Summary</h2>
              <p className="text-xs text-slate-500">Auto-calculated totals and optional discount.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div>
              <Input
                label="Discount Amount"
                type="number"
                min="0"
                step="any"
                {...register('discount_amount', { valueAsNumber: true })}
                error={errors.discount_amount?.message}
                placeholder="0.00"
              />
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal</span>
                <span className="text-slate-900 font-bold">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Total Tax</span>
                <span className="text-slate-900 font-bold">{formatCurrency(totalTax, currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-3">
                <span>Grand Total</span>
                <span className="text-blue-600 font-mono">{formatCurrency(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Notes & Terms */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900">Notes & Terms & Conditions</h2>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Payment Instructions
              </label>
              <textarea
                {...register('payment_instructions')}
                placeholder="Bank Name, Account Number, UPI ID, etc."
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Notes
                </label>
                <textarea
                  {...register('notes')}
                  placeholder="Thank you for your business!"
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Terms & Conditions
                </label>
                <textarea
                  {...register('terms')}
                  placeholder="Payment due within 14 days of issue."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/app/invoices/${id}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={saving}
            icon={<Save className="w-4 h-4" />}
            className="shadow-md"
          >
            Update Invoice
          </Button>
        </div>
      </form>
    </div>
  )
}
