import { supabase } from '@/lib/supabase'
import type { Invoice, InvoiceItem } from '@/types'
import { generateInvoiceNumber } from '@/utils/invoiceCalculations'

export async function getInvoices(userId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(*), items:invoice_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as (Invoice & { client: any; items: InvoiceItem[] })[]
}

export async function getInvoice(userId: string, invoiceId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(*), items:invoice_items(*)')
    .eq('user_id', userId)
    .eq('id', invoiceId)
    .single()
  if (error) throw new Error(error.message)
  return data as Invoice & { client: any; items: InvoiceItem[] }
}

export async function createInvoice(
  userId: string,
  invoice: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'invoice_number'>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'user_id' | 'created_at' | 'updated_at'>[]
) {
  const invoiceNumber = generateInvoiceNumber()
  const { data: invData, error: invError } = await supabase
    .from('invoices')
    .insert({ ...invoice, user_id: userId, invoice_number: invoiceNumber })
    .select()
    .single()
  if (invError) throw new Error(invError.message)

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(
      items.map((item) => ({
        ...item,
        invoice_id: invData.id,
        user_id: userId,
      }))
    )
  if (itemsError) throw new Error(itemsError.message)

  return { ...invData, items }
}

export async function updateInvoice(
  userId: string,
  invoiceId: string,
  invoice: Partial<Invoice>,
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'user_id' | 'created_at' | 'updated_at'>[]
) {
  const { error: invError } = await supabase
    .from('invoices')
    .update(invoice)
    .eq('user_id', userId)
    .eq('id', invoiceId)
  if (invError) throw new Error(invError.message)

  const { error: deleteError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId)
  if (deleteError) throw new Error(deleteError.message)

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(
      items.map((item) => ({
        ...item,
        invoice_id: invoiceId,
        user_id: userId,
      }))
    )
  if (itemsError) throw new Error(itemsError.message)
}

export async function deleteInvoice(userId: string, invoiceId: string) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('user_id', userId)
    .eq('id', invoiceId)
  if (error) throw new Error(error.message)
}

export async function updateInvoiceStatus(
  userId: string,
  invoiceId: string,
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
) {
  const { data, error } = await supabase
    .from('invoices')
    .update({ status })
    .eq('user_id', userId)
    .eq('id', invoiceId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function duplicateInvoice(userId: string, invoiceId: string) {
  const source = await getInvoice(userId, invoiceId)
  const { items, ...invoice } = source
  return createInvoice(userId, { ...invoice, status: 'draft' }, items)
}
