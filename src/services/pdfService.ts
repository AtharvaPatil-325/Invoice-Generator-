import jsPDF from 'jspdf'
import type { Invoice, BusinessProfile, InvoiceItem } from '@/types'
import { formatCurrency, formatDate } from '@/utils/invoiceCalculations'

export function generateInvoicePDF(
  invoice: Invoice & { client: any; items: InvoiceItem[] },
  business: BusinessProfile | null
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  doc.setFontSize(10)
  doc.setTextColor(100)

  if (business?.logo_path) {
    doc.text(business.business_name, pageWidth - 80, yPos, { align: 'right' })
  }

  yPos = business?.logo_path ? 30 : 20
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' })

  yPos += 10
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Invoice #: ${invoice.invoice_number}`, 20, yPos)
  doc.text(`Issue Date: ${formatDate(invoice.issue_date)}`, pageWidth - 80, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, pageWidth - 80, yPos, { align: 'right' })
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, yPos)
  yPos += 10

  doc.setDrawColor(200)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text('Bill To:', 20, yPos)
  yPos += 6
  doc.text(invoice.client.name, 20, yPos)
  if (invoice.client.company_name) {
    yPos += 5
    doc.text(invoice.client.company_name, 20, yPos)
  }
  if (invoice.client.email) {
    yPos += 5
    doc.text(invoice.client.email, 20, yPos)
  }
  if (invoice.client.address) {
    yPos += 5
    const addr = [invoice.client.address, invoice.client.city, invoice.client.state, invoice.client.country, invoice.client.postal_code].filter(Boolean).join(', ')
    doc.text(addr, 20, yPos)
  }

  yPos += 10
  doc.setDrawColor(200)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 8

  doc.setFontSize(9)
  doc.setTextColor(80)
  doc.text('Description', 20, yPos)
  doc.text('Qty', 90, yPos, { align: 'right' })
  doc.text('Rate', 110, yPos, { align: 'right' })
  doc.text('Tax', 130, yPos, { align: 'right' })
  doc.text('Amount', pageWidth - 20, yPos, { align: 'right' })
  yPos += 3
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 5

  doc.setTextColor(0, 0, 0)
  for (const item of invoice.items) {
    const lines = doc.splitTextToSize(item.name, 60)
    doc.text(lines, 20, yPos)
    const itemHeight = lines.length * 4
    doc.text(String(item.quantity), 90, yPos, { align: 'right' })
    doc.text(formatCurrency(item.unit_price, invoice.currency), 110, yPos, { align: 'right' })
    doc.text(`${item.tax_rate}%`, 130, yPos, { align: 'right' })
    doc.text(formatCurrency(item.line_total, invoice.currency), pageWidth - 20, yPos, { align: 'right' })
    yPos += itemHeight + 4
  }

  yPos += 5
  doc.setDrawColor(200)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Subtotal:`, pageWidth - 60, yPos, { align: 'right' })
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - 20, yPos, { align: 'right' })
  yPos += 6
  doc.text(`Tax:`, pageWidth - 60, yPos, { align: 'right' })
  doc.text(formatCurrency(invoice.tax_amount, invoice.currency), pageWidth - 20, yPos, { align: 'right' })
  yPos += 6
  if (invoice.discount_amount > 0) {
    doc.text(`Discount:`, pageWidth - 60, yPos, { align: 'right' })
    doc.text(`-${formatCurrency(invoice.discount_amount, invoice.currency)}`, pageWidth - 20, yPos, { align: 'right' })
    yPos += 6
  }
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Total:`, pageWidth - 60, yPos, { align: 'right' })
  doc.text(formatCurrency(invoice.total_amount, invoice.currency), pageWidth - 20, yPos, { align: 'right' })
  yPos += 10

  if (invoice.notes) {
    doc.setFontSize(9)
    doc.setTextColor(80)
    doc.text('Notes:', 20, yPos)
    yPos += 5
    doc.text(invoice.notes, 20, yPos, { maxWidth: pageWidth - 40 })
  }

  if (business) {
    yPos += 20
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(business.business_name, 20, yPos)
    if (business.email) {
      yPos += 4
      doc.text(business.email, 20, yPos)
    }
    if (business.phone) {
      yPos += 4
      doc.text(business.phone, 20, yPos)
    }
  }

  doc.save(`Invoice_${invoice.invoice_number}.pdf`)
}
