import jsPDF from 'jspdf'
import type { Invoice, BusinessProfile, InvoiceItem } from '@/types'
import { formatCurrency, formatDate } from '@/utils/invoiceCalculations'

let fontLoaded = false
let fontLoadPromise: Promise<void> | null = null

async function loadFonts(doc: jsPDF): Promise<void> {
  if (fontLoaded) return
  if (fontLoadPromise) return fontLoadPromise

  fontLoadPromise = (async () => {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const [regularRes, boldRes] = await Promise.all([
        fetch(`${baseUrl}/fonts/NotoSans-Regular.ttf`),
        fetch(`${baseUrl}/fonts/NotoSans-Bold.ttf`),
      ])

      if (!regularRes.ok || !boldRes.ok) {
        throw new Error('Failed to fetch font files')
      }

      const [regularArrayBuffer, boldArrayBuffer] = await Promise.all([
        regularRes.arrayBuffer(),
        boldRes.arrayBuffer(),
      ])

      const regularBase64 = arrayBufferToBase64(regularArrayBuffer)
      const boldBase64 = arrayBufferToBase64(boldArrayBuffer)

      doc.addFileToVFS('NotoSans-Regular.ttf', regularBase64)
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')

      doc.addFileToVFS('NotoSans-Bold.ttf', boldBase64)
      doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold')

      doc.setFont('NotoSans')
      fontLoaded = true
    } catch (err) {
      console.warn('Failed to load Noto Sans fonts, falling back to Helvetica:', err)
      doc.setFont('helvetica')
      fontLoaded = true
    }
  })()

  return fontLoadPromise
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

interface LayoutContext {
  doc: jsPDF
  pageWidth: number
  pageHeight: number
  margin: number
  contentWidth: number
  yPos: number
}

function newLayoutContext(doc: jsPDF, margin = 18): LayoutContext {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  return {
    doc,
    pageWidth,
    pageHeight,
    margin,
    contentWidth: pageWidth - margin * 2,
    yPos: margin,
  }
}

function checkPageBreak(ctx: LayoutContext, neededHeight: number): void {
  if (ctx.yPos + neededHeight > ctx.pageHeight - ctx.margin) {
    ctx.doc.addPage()
    ctx.yPos = ctx.margin
  }
}

function drawText(
  ctx: LayoutContext,
  text: string,
  x: number,
  y: number,
  options: {
    fontSize?: number
    fontStyle?: 'normal' | 'bold'
    color?: [number, number, number]
    align?: 'left' | 'center' | 'right'
    maxWidth?: number
  } = {}
): number {
  const { fontSize = 9, fontStyle = 'normal', color, align = 'left', maxWidth } = options
  ctx.doc.setFontSize(fontSize)
  ctx.doc.setFont('NotoSans', fontStyle)
  if (color) ctx.doc.setTextColor(...color)

  if (maxWidth) {
    const lines = ctx.doc.splitTextToSize(text, maxWidth)
    if (Array.isArray(lines)) {
      let lineY = y
      lines.forEach((line: string) => {
        ctx.doc.text(line, x, lineY, { align })
        lineY += fontSize * 0.55
      })
      return lineY - y
    }
  }

  ctx.doc.text(text, x, y, { align })
  return fontSize * 0.55
}

function drawRect(
  ctx: LayoutContext,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor?: [number, number, number],
  borderColor?: [number, number, number],
  borderWidth = 0.5,
  radius = 0
): void {
  if (fillColor) {
    ctx.doc.setFillColor(...fillColor)
    if (radius > 0) {
      ctx.doc.roundedRect(x, y, width, height, radius, radius, 'F')
    } else {
      ctx.doc.rect(x, y, width, height, 'F')
    }
  }
  if (borderColor) {
    ctx.doc.setDrawColor(...borderColor)
    ctx.doc.setLineWidth(borderWidth)
    if (radius > 0) {
      ctx.doc.roundedRect(x, y, width, height, radius, radius, 'S')
    } else {
      ctx.doc.rect(x, y, width, height, 'S')
    }
  }
}

function drawLine(
  ctx: LayoutContext,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: [number, number, number],
  width = 0.5
): void {
  ctx.doc.setDrawColor(...color)
  ctx.doc.setLineWidth(width)
  ctx.doc.line(x1, y1, x2, y2)
}

const BRAND_BLUE: [number, number, number] = [37, 99, 235]
const DARK_GRAY: [number, number, number] = [15, 23, 42]
const MEDIUM_GRAY: [number, number, number] = [100, 116, 139]
const BORDER_GRAY: [number, number, number] = [226, 232, 240]
const SLATE_BG: [number, number, number] = [248, 250, 252]
const WHITE: [number, number, number] = [255, 255, 255]

export async function generateInvoicePDF(
  invoice: Invoice & { client: any; items: InvoiceItem[] },
  business: BusinessProfile | null
): Promise<void> {
  const doc = new jsPDF()
  await loadFonts(doc)

  const ctx = newLayoutContext(doc)

  const headerBusiness = business?.business_name || 'Your Business'
  const currency = invoice.currency || 'INR'

  // ========================================================================
  // HEADER SECTION
  // ========================================================================
  const headerPadding = 16
  const headerLeftX = ctx.margin + headerPadding
  const headerRightX = ctx.pageWidth - ctx.margin - headerPadding

  // Calculate header content height
  const businessLines = [
    business?.address || '',
    [business?.city, business?.state, business?.country, business?.postal_code].filter(Boolean).join(', '),
    business?.email || '',
    business?.phone || '',
  ].filter(Boolean)

  const businessNameHeight = 14
  const businessDetailsHeight = businessLines.length * 5
  const invoiceTitleHeight = 10
  const invoiceMetaHeight = 3 * 5
  const headerContentHeight = Math.max(
    businessNameHeight + businessDetailsHeight,
    invoiceTitleHeight + invoiceMetaHeight
  ) + 10

  checkPageBreak(ctx, headerContentHeight + 10)

  // Header background
  drawRect(ctx, ctx.margin, ctx.yPos, ctx.contentWidth, headerContentHeight + 10, BRAND_BLUE, undefined, 0, 4)

  let innerY = ctx.yPos + 10

  // Company name
  drawText(ctx, headerBusiness, headerLeftX, innerY, {
    fontSize: 14,
    fontStyle: 'bold',
    color: WHITE,
  })
  innerY += 14

  // Company details
  businessLines.forEach((line) => {
    drawText(ctx, line, headerLeftX, innerY, {
      fontSize: 8,
      fontStyle: 'normal',
      color: [230, 240, 255],
    })
    innerY += 5
  })

  // Right side: INVOICE title and metadata
  let rightY = ctx.yPos + 10
  drawText(ctx, 'INVOICE', headerRightX, rightY, {
    fontSize: 18,
    fontStyle: 'bold',
    color: WHITE,
    align: 'right',
  })
  rightY += 16

  const metaLines = [
    `Invoice #: ${invoice.invoice_number}`,
    `Issue Date: ${formatDate(invoice.issue_date)}`,
    `Due Date: ${formatDate(invoice.due_date)}`,
  ]
  metaLines.forEach((line) => {
    drawText(ctx, line, headerRightX, rightY, {
      fontSize: 8,
      fontStyle: 'normal',
      color: [230, 240, 255],
      align: 'right',
    })
    rightY += 5
  })

  ctx.yPos += headerContentHeight + 20

  // ========================================================================
  // BILL TO / INVOICE DETAILS SECTION
  // ========================================================================
  const boxPadding = 14
  const boxWidth = (ctx.contentWidth - 12) / 2
  const leftBoxX = ctx.margin
  const rightBoxX = ctx.margin + boxWidth + 12

  const billToLines = [
    invoice.client?.name || 'Unknown Client',
    invoice.client?.company_name || '',
    invoice.client?.email || '',
    invoice.client?.phone || '',
    [invoice.client?.address, invoice.client?.city, invoice.client?.state, invoice.client?.country, invoice.client?.postal_code]
      .filter(Boolean)
      .join(', '),
  ].filter(Boolean)

  const invoiceDetailsLines = [
    `Invoice #: ${invoice.invoice_number}`,
    `Issue Date: ${formatDate(invoice.issue_date)}`,
    `Due Date: ${formatDate(invoice.due_date)}`,
    `Status: ${invoice.status?.toUpperCase() || 'DRAFT'}`,
  ]

  const billToHeight = Math.max(20, 12 + billToLines.length * 5)
  const invoiceDetailsHeight = Math.max(20, 12 + invoiceDetailsLines.length * 5)
  const boxHeight = Math.max(billToHeight, invoiceDetailsHeight) + 10

  checkPageBreak(ctx, boxHeight + 10)

  // Left box: BILL TO
  drawRect(ctx, leftBoxX, ctx.yPos, boxWidth, boxHeight, WHITE, BORDER_GRAY, 0.5, 2)
  let ly = ctx.yPos + boxPadding
  drawText(ctx, 'BILL TO', leftBoxX + boxPadding, ly, {
    fontSize: 8,
    fontStyle: 'bold',
    color: MEDIUM_GRAY,
  })
  ly += 10
  billToLines.forEach((line) => {
    drawText(ctx, line, leftBoxX + boxPadding, ly, {
      fontSize: 9,
      fontStyle: 'normal',
      color: DARK_GRAY,
    })
    ly += 5
  })

  // Right box: INVOICE DETAILS
  drawRect(ctx, rightBoxX, ctx.yPos, boxWidth, boxHeight, WHITE, BORDER_GRAY, 0.5, 2)
  let ry = ctx.yPos + boxPadding
  drawText(ctx, 'INVOICE DETAILS', rightBoxX + boxPadding, ry, {
    fontSize: 8,
    fontStyle: 'bold',
    color: MEDIUM_GRAY,
  })
  ry += 10
  invoiceDetailsLines.forEach((line) => {
    drawText(ctx, line, rightBoxX + boxPadding, ry, {
      fontSize: 9,
      fontStyle: 'normal',
      color: DARK_GRAY,
    })
    ry += 5
  })

  ctx.yPos += boxHeight + 16

  // ========================================================================
  // ITEMS TABLE
  // ========================================================================
  const colPadding = 10
  const tableLeft = ctx.margin
  const tableWidth = ctx.contentWidth

  // Column widths (proportional)
  const colDescWidth = tableWidth * 0.48
  const colQtyWidth = tableWidth * 0.12
  const colRateWidth = tableWidth * 0.2

  const colDescX = tableLeft + colPadding
  const colQtyX = colDescX + colDescWidth
  const colRateX = colQtyX + colQtyWidth
  const tableRight = tableLeft + tableWidth - colPadding

  const rowHeight = 14
  const headerHeight = 12
  const items = invoice.items || []

  const tableTotalHeight = headerHeight + items.length * rowHeight + 4

  checkPageBreak(ctx, tableTotalHeight + 30)

  // Table header background
  drawRect(ctx, tableLeft, ctx.yPos, tableWidth, headerHeight, SLATE_BG, BORDER_GRAY, 0.5, 1)

  // Table header text
  let thY = ctx.yPos + 8
  drawText(ctx, 'Description', colDescX, thY, { fontSize: 8, fontStyle: 'bold', color: MEDIUM_GRAY })
  drawText(ctx, 'Qty', colQtyX + colQtyWidth - 4, thY, { fontSize: 8, fontStyle: 'bold', color: MEDIUM_GRAY, align: 'right' })
  drawText(ctx, 'Rate', colRateX + colRateWidth - 4, thY, { fontSize: 8, fontStyle: 'bold', color: MEDIUM_GRAY, align: 'right' })
  drawText(ctx, 'Amount', tableRight, thY, { fontSize: 8, fontStyle: 'bold', color: MEDIUM_GRAY, align: 'right' })

  ctx.yPos += headerHeight

  // Table rows
  items.forEach((item, index) => {
    const rowY = ctx.yPos
    const isEven = index % 2 === 0

    if (isEven) {
      drawRect(ctx, tableLeft, rowY, tableWidth, rowHeight, SLATE_BG, undefined, 0, 0)
    }

    // Description (with wrapping)
    const descMaxWidth = colDescWidth - colPadding
    const descText = `${item.name}${item.description ? ` — ${item.description}` : ''}`
    const descLines = doc.splitTextToSize(descText, descMaxWidth)
    if (Array.isArray(descLines) && descLines.length > 0) {
      drawText(ctx, descLines[0], colDescX, rowY + 9, { fontSize: 9, fontStyle: 'normal', color: DARK_GRAY })
    }

    // Qty
    drawText(ctx, String(item.quantity), colQtyX + colQtyWidth - 4, rowY + 9, {
      fontSize: 9,
      fontStyle: 'normal',
      color: DARK_GRAY,
      align: 'right',
    })

    // Rate
    const rateText = formatCurrency(item.unit_price, currency)
    drawText(ctx, rateText, colRateX + colRateWidth - 4, rowY + 9, {
      fontSize: 9,
      fontStyle: 'normal',
      color: DARK_GRAY,
      align: 'right',
    })

    // Amount
    const amountText = formatCurrency(item.line_total, currency)
    drawText(ctx, amountText, tableRight, rowY + 9, {
      fontSize: 9,
      fontStyle: 'bold',
      color: DARK_GRAY,
      align: 'right',
    })

    // Row separator
    if (index < items.length - 1) {
      drawLine(ctx, tableLeft, rowY + rowHeight, tableRight + colPadding, rowY + rowHeight, BORDER_GRAY, 0.3)
    }

    ctx.yPos += rowHeight
  })

  // Table bottom border
  drawLine(ctx, tableLeft, ctx.yPos, tableRight + colPadding, ctx.yPos, BORDER_GRAY, 0.5)

  ctx.yPos += 12

  // ========================================================================
  // FINANCIAL SUMMARY (right-aligned)
  // ========================================================================
  const summaryWidth = tableWidth * 0.42
  const summaryLeft = tableRight + colPadding - summaryWidth
  const lineHeight = 10
  const totalRowHeight = 16

  const subtotal = invoice.subtotal || 0
  const taxAmount = invoice.tax_amount || 0
  const discountAmount = invoice.discount_amount || 0
  const totalAmount = invoice.total_amount || 0

  checkPageBreak(ctx, 5 * lineHeight + totalRowHeight + 20)

  const summaryLines = [
    { label: 'Subtotal', value: subtotal },
    { label: 'Tax', value: taxAmount },
    ...(discountAmount > 0 ? [{ label: 'Discount', value: discountAmount }] : []),
  ]

  summaryLines.forEach(({ label, value }) => {
    drawText(ctx, label, summaryLeft, ctx.yPos + 7, {
      fontSize: 9,
      fontStyle: 'normal',
      color: MEDIUM_GRAY,
      align: 'left',
    })
    drawText(ctx, formatCurrency(value, currency), summaryLeft + summaryWidth, ctx.yPos + 7, {
      fontSize: 9,
      fontStyle: 'bold',
      color: DARK_GRAY,
      align: 'right',
    })
    ctx.yPos += lineHeight
  })

  // Total row with background
  drawRect(ctx, summaryLeft - 4, ctx.yPos - 2, summaryWidth + 8, totalRowHeight, BRAND_BLUE, undefined, 0, 2)
  drawText(ctx, 'TOTAL', summaryLeft, ctx.yPos + 7, {
    fontSize: 10,
    fontStyle: 'bold',
    color: WHITE,
    align: 'left',
  })
  drawText(ctx, formatCurrency(totalAmount, currency), summaryLeft + summaryWidth, ctx.yPos + 7, {
    fontSize: 11,
    fontStyle: 'bold',
    color: WHITE,
    align: 'right',
  })

  ctx.yPos += totalRowHeight + 16

  // ========================================================================
  // PAYMENT INSTRUCTIONS / NOTES / TERMS
  // ========================================================================
  const noteSections: { title: string; content: string }[] = []
  if (invoice.payment_instructions) noteSections.push({ title: 'Payment Instructions', content: invoice.payment_instructions })
  if (invoice.notes) noteSections.push({ title: 'Notes', content: invoice.notes })
  if (invoice.terms) noteSections.push({ title: 'Terms & Conditions', content: invoice.terms })

  if (noteSections.length > 0) {
    noteSections.forEach((section) => {
      const lines = doc.splitTextToSize(section.content, ctx.contentWidth - 20)
      const sectionHeight = 8 + (Array.isArray(lines) ? lines.length : 1) * 5 + 4

      checkPageBreak(ctx, sectionHeight + 4)

      drawRect(ctx, ctx.margin, ctx.yPos, ctx.contentWidth, sectionHeight, SLATE_BG, BORDER_GRAY, 0.3, 2)
      let noteY = ctx.yPos + 6
      drawText(ctx, section.title, ctx.margin + 8, noteY, {
        fontSize: 8,
        fontStyle: 'bold',
        color: BRAND_BLUE,
      })
      noteY += 8

      if (Array.isArray(lines)) {
        lines.slice(0, 4).forEach((line: string) => {
          drawText(ctx, line, ctx.margin + 8, noteY, {
            fontSize: 8,
            fontStyle: 'normal',
            color: DARK_GRAY,
          })
          noteY += 5
        })
      } else {
        drawText(ctx, lines, ctx.margin + 8, noteY, {
          fontSize: 8,
          fontStyle: 'normal',
          color: DARK_GRAY,
        })
      }

      ctx.yPos += sectionHeight + 6
    })
  }

  // ========================================================================
  // FOOTER
  // ========================================================================
  checkPageBreak(ctx, 30)
  const footerY = Math.max(ctx.yPos, ctx.pageHeight - ctx.margin - 30)

  drawLine(ctx, ctx.margin, footerY, ctx.pageWidth - ctx.margin, footerY, BORDER_GRAY, 0.5)
  let fy = footerY + 8

  drawText(ctx, 'Thank you for your business.', ctx.pageWidth / 2, fy, {
    fontSize: 9,
    fontStyle: 'normal',
    color: MEDIUM_GRAY,
    align: 'center',
  })
  fy += 6

  const footerLines = [
    headerBusiness,
    business?.email || '',
    business?.phone || '',
  ].filter(Boolean)

  footerLines.forEach((line) => {
    drawText(ctx, line, ctx.pageWidth / 2, fy, {
      fontSize: 7,
      fontStyle: 'normal',
      color: MEDIUM_GRAY,
      align: 'center',
    })
    fy += 4.5
  })

  // Generated note
  fy += 4
  drawText(ctx, 'Generated with InvoiceGen', ctx.pageWidth / 2, fy, {
    fontSize: 7,
    fontStyle: 'normal',
    color: MEDIUM_GRAY,
    align: 'center',
  })

  // Save
  const filename = `Invoice_${invoice.invoice_number}.pdf`
  doc.save(filename)
}