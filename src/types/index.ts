export interface Profile {
  id: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface BusinessProfile {
  id: string
  user_id: string
  business_name: string
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  email: string | null
  phone: string | null
  website: string | null
  tax_number: string | null
  logo_path: string | null
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  company_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  tax_number: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  user_id: string
  name: string
  description: string | null
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  line_total: number
  created_at: string
  updated_at: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  invoice_number: string
  issue_date: string
  due_date: string
  currency: string
  status: InvoiceStatus
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  notes: string | null
  terms: string | null
  payment_instructions: string | null
  created_at: string
  updated_at: string
}

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD'
