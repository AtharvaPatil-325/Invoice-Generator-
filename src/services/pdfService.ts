import jsPDF from 'jspdf'
import type { Invoice, BusinessProfile, InvoiceItem } from '@/types'
import { formatCurrency, formatDate } from '@/utils/invoiceCalculations'

export function generateInvoicePDF(
  invoice: Invoice & { client: any; items: InvoiceItem[] },
  business: BusinessProfile | null
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 18
  let yPos = margin

  // Premium color palette
  const brandBlueR = 37, brandBlueG = 99, brandBlueB = 235
  const darkGrayR = 15, darkGrayG = 23, darkGrayB = 42
  const mediumGrayR = 100, mediumGrayG = 116, mediumGrayB = 139
  const lightGrayR = 241, lightGrayG = 245, lightGrayB = 249
  const borderGrayR = 226, borderGrayG = 232, borderGrayB = 240
  const slateBgR = 248, slateBgG = 250, slateBgB = 252

  const headerBusiness = business?.business_name || 'Your Business'

  // Premium Header Bar
  if (yPos + 32 > pageHeight) {
    doc.addPage()
    yPos = margin
  }

  doc.setFillColor(brandBlueR, brandBlueG, brandBlueB)
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 32, 3, 3, 'F')
  yPos += 6

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(headerBusiness, margin + 8, yPos)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const businessLines = [
    business?.address || '',
    [business?.city, business?.state, business?.country, business?.postal_code].filter(Boolean).join(', '),
    business?.email || '',
    business?.phone || '',
  ].filter(Boolean)

  businessLines.forEach((line, idx) => {
    doc.text(line, margin + 8, yPos + 6 + idx * 4.2)
  })

  const rightX = pageWidth - margin - 8
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', rightX, yPos + 12, { align: 'right' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const metaLines = [
    `Invoice #: ${invoice.invoice_number}`,
    `Issue Date: ${formatDate(invoice.issue_date)}`,
    `Due Date: ${formatDate(invoice.due_date)}`,
  ]
  metaLines.forEach((line, idx) => {
    doc.text(line, rightX, yPos + 22 + idx * 5.2, { align: 'right' })
  })

  yPos += 38

  // Bill To and Invoice Details boxes
  if (yPos + 48 > pageHeight) {
    doc.addPage()
    yPos = margin
  }

  const boxWidth = (pageWidth - margin * 2 - 10) / 2
  const boxHeight = 42
  const leftBoxX = margin
  const rightBoxX = margin + boxWidth + 10

  // Bill To Box
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(leftBoxX, yPos, boxWidth, boxHeight, 4, 4, 'F')
  doc.setDrawColor(borderGrayR, borderGrayG, borderGrayB)
  doc.roundedRect(leftBoxX, yPos, boxWidth, boxHeight, 4, 4, 'S')

  doc.setTextColor(mediumGrayR, mediumGrayG, mediumGrayB)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO', leftBoxX + 8, yPos + 8)

  const clientDetails = [
    invoice.client?.name || '',
    invoice.client?.company_name || '',
    invoice.client?.email || '',
    invoice.client?.phone || '',
    [invoice.client?.address, invoice.client?.city, invoice.client?.state, invoice.client?.country, invoice.client?.postal_code].filter(Boolean).join(', '),
  ].filter(Boolean)

  doc.setTextColor(darkGrayR, darkGrayG, darkGrayB)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  clientDetails.slice(0, 4).forEach((line, idx) => {
    doc.text(line, leftBoxX + 8, yPos + 16 + idx * 5.2)
  })

  // Invoice Details Box
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(rightBoxX, yPos, boxWidth, boxHeight, 4, 4, 'F')
  doc.setDrawColor(borderGrayR, borderGrayG, borderGrayB)
  doc.roundedRect(rightBoxX, yPos, boxWidth, boxHeight, 4, 4, 'S')

  doc.setTextColor(mediumGrayR, mediumGrayG, mediumGrayB)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE DETAILS', rightBoxX + 8, yPos + 8)

  const overdueFlag = invoice.status !== 'paid' && invoice.status !== 'cancelled' && new Date(invoice.due_date) < new Date()
  const displayStatus = overdueFlag ? 'overdue' : invoice.status
  const statusLabel = displayStatus.toUpperCase()

  const summaryDetails = [
    `Invoice #: ${invoice.invoice_number}`,
    `Issue Date: ${formatDate(invoice.issue_date)}`,
    `Due Date: ${formatDate(invoice.due_date)}`,
    `Status: ${statusLabel}`,
  ]

  doc.setTextColor(darkGrayR, darkGrayG, darkGrayB)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  summaryDetails.forEach((line, idx) => {
    doc.text(line, rightBoxX + 8, yPos + 16 + idx * 5.2)
  })

  yPos += boxHeight + 10

  // Items Table Header
  const tableHeaderY = yPos
  const colX = [margin, margin + 8, margin + 92, margin + 122, margin + 148]

  if (tableHeaderY + 18 > pageHeight) {
    doc.addPage()
    yPos = margin
  }

  doc.setFillColor(slateBgR, slateBgG, slateBgB)
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F')
  doc.setTextColor(mediumGrayR, mediumGrayG, mediumGrayB)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Description', colX[0], yPos + 6)
  doc.text('Qty', colX[2], yPos + 6, { align: 'right' })
  doc.text('Rate', colX[3], yPos + 6, { align: 'right' })
  doc.text('Amount', colX[4], yPos + 6, { align: 'right' })
  yPos += 12

  doc.setDrawColor(borderGrayR, borderGrayG, borderGrayB)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 2

  doc.setTextColor(darkGrayR, darkGrayG, darkGrayB)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  // Items
  const items = invoice.items || []
  items.forEach((item, idx) => {
    if (yPos + 22 > pageHeight) {
      doc.addPage()
      yPos = margin
      doc.setFillColor(slateBgR, slateBgG, slateBgB)
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 10, 2, 2, 'F')
      doc.setTextColor(mediumGrayR, mediumGrayG, mediumGrayB)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Description', colX[0], yPos + 6)
      doc.text('Qty', colX[2], yPos + 6, { align: 'right' })
      doc.text('Rate', colX[3], yPos + 6, { align: 'right' })
      doc.text('Amount', colX[4], yPos + 6, { align: 'right' })
      yPos += 12
      doc.setDrawColor(borderGrayR, borderGrayG, borderGrayB)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 2
      doc.setTextColor(darkGrayR, darkGrayG, darkGrayB)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
    }

    if (idx % 2 === 0) {
      doc.setFillColor(slateBgR, slateBgG, slateBgB)
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 2, 2, 'F')
    }

    const itemLabel = item.name
    const itemDescription = item.description ? ` - ${item.description}` : ''
    const fullItemText = `${itemLabel}${itemDescription}`
    const maxWidth = pageWidth - margin * 2 - 8
    const itemLines = doc.splitTextToSize(fullItemText, maxWidth)
    const itemHeight = Math.max(itemLines.length * 5.2, 8)

    doc.text(itemLines, colX[0], yPos + 5)
    doc.text(String(item.quantity), colX[2], yPos + 5, { align: 'right' })
    doc.text(formatCurrency(item.unit_price, invoice.currency), colX[3], yPos + 5, { align: 'right' })
    doc.text(formatCurrency(item.line_total, invoice.currency), colX[4], yPos + 5, { align: 'right' })
    yPos += itemHeight + 4
  })

  yPos += 4
  doc.setDrawColor(borderGrayR, borderGrayG, borderGrayB)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 8

  // Totals
  const subtotal = invoice.subtotal || 0
  const taxAmount = invoice.tax_amount || 0
  const discountAmount = invoice.discount_amount || 0
  const totalAmount = invoice.total_amount || 0

  const totalsLeftX = pageWidth - margin - 85
  const totalsRightX = pageWidth - margin

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(mediumGrayR, mediumGrayG, mediumGrayB)

  const totals: Array<{ label: string; value: number }> = [
    { label: 'Subtotal', value: subtotal },
    { label: 'Tax', value: taxAmount },
  ]

  if (discountAmount > 0) {
    totals.push({ label: 'Discount', value: discountAmount })
  }

  totals.forEach((row) => {
    if (yPos + 8 > pageHeight) {
      doc.addPage()
      yPos = margin
    }
    doc.text(row.label, totalsLeftX, yPos, { align: 'right' })
    doc.setTextColor(darkGrayR, darkGrayG, darkGrayB)
    doc.text(formatCurrency(row.value, invoice.currency), totalsRightX, yPos, { align: 'right' })
    doc.setTextColor(mediumGrayR, mediumGrayG, mediumGrayB)
    yPos += 6
  })

  yPos += 2
  doc.setFillColor(brandBlueR, brandBlueG, brandBlueB)
  doc.roundedRect(totalsLeftX - 6, yPos, 91, 14, 3, 3, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', totalsLeftX, yPos + 9, { align: 'right' })
  doc.text(formatCurrency(totalAmount, invoice.currency), totalsRightX, yPos + 9, { align: 'right' })
  yPos += 22

  // Payment Instructions
  if (invoice.payment_instructions && yPos + 28 < pageHeight - margin) {
    doc.setFillColor(lightGrayR, lightGrayG, lightGrayB)
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 24, 3, 3, 'F')
    doc.setTextColor(brandBlueR, brandBlueG, brandBlueB)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Instructions', margin + 8, yPos + 7)
    doc.setTextColor(darkGrayR, darkGrayG, darkGrayB)
    doc.setFont('helvetica', 'normal')
    const paymentLines = doc.splitTextToSize(invoice.payment_instructions, pageWidth - margin * 2 - 16)
    doc.text(paymentLines.slice(0, 2), margin + 8, yPos + 14)
    yPos += 30
  }

  // Notes
  if (invoice.notes && yPos + 28 < pageHeight - margin) {
    doc.setFillColor(lightGrayR, lightGrayG, lightGrayB)
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, 24, 3, 3, 'F')
    doc.setTextColor(mediumGrayR, mediumGrayG, mediumGrayB)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes', margin + 8, yPos + 7)
    doc.setTextColor(darkGrayR, darkGrayG, darkGrayB)
    doc.setFont('helvetica', 'normal')
    const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2 - 16)
    doc.text(noteLines.slice(0, 2), margin + 8, yPos + 14)
    yPos += 30
  }

  // Footer
  if (yPos + 32 > pageHeight) {
    doc.addPage()
    yPos = margin
  }

  doc.setFillColor(lightGrayR, lightGrayG, lightGrayB)
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 28, 3, 3, 'F')
  doc.setTextColor(mediumGrayR, mediumGrayG, mediumGrayB)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Thank you for your business.', margin + 8, yPos + 8)
  doc.setTextColor(darkGrayR, darkGrayG, darkGrayB)
  doc.setFont('helvetica', 'normal')
  const footerLines = [
    headerBusiness,
    business?.email || '',
    business?.phone || '',
  ].filter(Boolean)
  footerLines.forEach((line, idx) => {
    doc.text(line, margin + 8, yPos + 16 + idx * 4.2)
  })

  const filename = `Invoice_${invoice.invoice_number}.pdf`
  doc.save(filename)
}