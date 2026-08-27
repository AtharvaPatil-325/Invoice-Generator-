export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return roundToTwo(quantity * unitPrice)
}

export function calculateTax(lineTotal: number, taxRate: number): number {
  return roundToTwo((lineTotal * taxRate) / 100)
}

export function calculateSubtotal(items: { line_total: number }[]): number {
  return roundToTwo(items.reduce((sum, item) => sum + item.line_total, 0))
}

export function calculateTotalTax(items: { tax_amount: number }[]): number {
  return roundToTwo(items.reduce((sum, item) => sum + item.tax_amount, 0))
}

export function calculateGrandTotal(
  subtotal: number,
  totalTax: number,
  discount: number
): number {
  return roundToTwo(subtotal + totalTax - discount)
}

export function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

export function formatCurrency(amount: number, currency: string): string {
  const locale = currency === 'INR' ? 'en-IN' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${timestamp}-${random}`
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function isOverdue(dueDate: string, status: string): boolean {
  if (status === 'paid' || status === 'cancelled') return false
  return new Date(dueDate) < new Date()
}
