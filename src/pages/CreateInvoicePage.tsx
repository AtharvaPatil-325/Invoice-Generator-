import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import type { Client, InvoiceItem, Currency } from '@/types'
import {
  calculateLineTotal,
  calculateTax,
  calculateSubtotal,
  calculateTotalTax,
  calculateGrandTotal,
  formatCurrency,
} from '@/utils/invoiceCalculations'
import { getClients } from '@/services/clientService'
import { createInvoice } from '@/services/invoiceService'

const schema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  issue_date: z.string().min(1, 'Issue date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  notes: z.string().optional(),
  terms: z.string().optional(),
  payment_instructions: z.string().optional(),
  discount_amount: z.number().min(0),
})

type FormData = z.infer<typeof schema>

const emptyItem = { name: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, line_total: 0, tax_amount: 0 }

export function CreateInvoicePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { currency: 'INR', discount_amount: 0, issue_date: new Date().toISOString().split('T')[0] }
  })

  useEffect(() => {
    if (user) loadClients(user.id)
  }, [user])

  const loadClients = async (userId: string) => {
    try {
      const data = await getClients(userId)
      setClients(data)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const addItem = () => {
    setItems([...items, { ...emptyItem, id: crypto.randomUUID() } as any])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].line_total = calculateLineTotal(updated[index].quantity, updated[index].unit_price)
      updated[index].tax_amount = calculateTax(updated[index].line_total, updated[index].tax_rate)
    }
    if (field === 'tax_rate') {
      updated[index].tax_amount = calculateTax(updated[index].line_total, updated[index].tax_rate)
    }
    setItems(updated)
  }

  const discount = watch('discount_amount') || 0
  const currency = watch('currency') as Currency
  const subtotal = useMemo(() => calculateSubtotal(items), [items])
  const totalTax = useMemo(() => calculateTotalTax(items), [items])
  const total = useMemo(() => calculateGrandTotal(subtotal, totalTax, discount), [subtotal, totalTax, discount])

  const onSubmit = async (data: FormData) => {
    if (items.length === 0) {
      toast.error('Please add at least one item')
      return
    }
    if (!user) {
      toast.error('You must be signed in to create an invoice')
      return
    }
    setSaving(true)
    try {
      await createInvoice(user.id, {
        client_id: data.client_id,
        issue_date: data.issue_date,
        due_date: data.due_date,
        currency: data.currency,
        status: 'draft',
        subtotal,
        tax_amount: totalTax,
        discount_amount: discount,
        total_amount: total,
        notes: data.notes || null,
        terms: data.terms || null,
        payment_instructions: data.payment_instructions || null,
      }, items.map(i => ({
        name: i.name,
        description: i.description || null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        tax_rate: i.tax_rate,
        tax_amount: i.tax_amount,
        line_total: i.line_total,
      })))
      toast.success('Invoice created')
      navigate('/app/invoices')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Create Invoice</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select {...register('client_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="">Select a client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name} {c.company_name ? `(${c.company_name})` : ''}</option>)}
              </select>
              {errors.client_id && <p className="text-sm text-red-600 mt-1">{errors.client_id.message}</p>}
            </div>
            <Input label="Issue Date" type="date" {...register('issue_date')} error={errors.issue_date?.message} />
            <Input label="Due Date" type="date" {...register('due_date')} error={errors.due_date?.message} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select {...register('currency')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Items</h2>
            <Button type="button" variant="secondary" onClick={addItem}>+ Add Item</Button>
          </div>
          {items.length === 0 && <p className="text-gray-500 text-sm">No items added yet.</p>}
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-50 rounded-lg">
              <div className="col-span-12 md:col-span-3">
                <Input placeholder="Item name" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} />
              </div>
              <div className="col-span-12 md:col-span-3">
                <Input placeholder="Description" value={item.description || ''} onChange={(e) => updateItem(index, 'description', e.target.value)} />
              </div>
              <div className="col-span-4 md:col-span-1">
                <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-4 md:col-span-2">
                <Input type="number" placeholder="Price" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-4 md:col-span-1">
                <Input type="number" placeholder="Tax %" value={item.tax_rate} onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="col-span-12 md:col-span-1 text-right">
                <p className="text-sm font-medium">{formatCurrency(item.line_total, currency)}</p>
              </div>
              <div className="col-span-12 md:col-span-1 text-right">
                <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Totals</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal, currency)}</span></div>
            <div className="flex justify-between text-sm"><span>Tax</span><span>{formatCurrency(totalTax, currency)}</span></div>
            <div className="flex justify-between text-sm"><span>Discount</span><span>-{formatCurrency(discount, currency)}</span></div>
            <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(total, currency)}</span></div>
          </div>
          <div>
            <Input label="Discount Amount" type="number" {...register('discount_amount', { valueAsNumber: true })} error={errors.discount_amount?.message} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Notes & Terms</h2>
          <textarea {...register('notes')} placeholder="Notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
          <textarea {...register('terms')} placeholder="Terms & Conditions" className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
          <textarea {...register('payment_instructions')} placeholder="Payment Instructions" className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
        </div>

        <div className="flex space-x-4">
          <Button type="submit" loading={saving} className="flex-1">Save Invoice</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/app/invoices')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
