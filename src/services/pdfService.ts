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

      const [regularBuffer, boldBuffer] = await Promise.all([
        regularRes.arrayBuffer(),
        boldRes.arrayBuffer(),
      ])

      const toBase64 = (buf: ArrayBuffer) => {
        const bytes = new Uint8Array(buf)
        let binary = ''
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
        return btoa(binary)
      }

      doc.addFileToVFS('NotoSans-Regular.ttf', toBase64(regularBuffer))
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal')
      doc.addFileToVFS('NotoSans-Bold.ttf', toBase64(boldBuffer))
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

interface LayoutState {
  doc: jsPDF
  pageWidth: number
  pageHeight: number
  margin: number
  contentWidth: number
  y: number
}

function createLayout(doc: jsPDF, margin = 18): LayoutState {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  return {
    doc,
    pageWidth,
    pageHeight,
    margin,
    contentWidth: pageWidth - margin * 2,
    y: margin,
  }
}

function ensureSpace(ctx: LayoutState, height: number): void {
  if (ctx.y + height > ctx.pageHeight - ctx.margin) {
    ctx.doc.addPage()
    ctx.y = ctx.margin
  }
}

function drawText(
  ctx: LayoutState,
  text: string,
  x: number,
  y: number,
  opts: {
    size?: number
    style?: 'normal' | 'bold'
    color?: [number, number, number]
    align?: 'left' | 'center' | 'right'
    maxWidth?: number
    charSpace?: number
  } = {}
): number {
  const {
    size = 10,
    style = 'normal',
    color = [15, 23, 42],
    align = 'left',
    maxWidth,
    charSpace,
  } = opts

  ctx.doc.setFontSize(size)
  ctx.doc.setFont('NotoSans', style)
  ctx.doc.setTextColor(...color)

  if (typeof charSpace !== 'undefined') {
    if (align === 'center' && maxWidth) {
      const centerX = x + maxWidth / 2
      ctx.doc.text(text, centerX, y, { align: 'center', charSpace })
    } else {
      ctx.doc.text(text, x, y, { align, charSpace })
    }
    return size * 0.55
  }

  if (maxWidth) {
    const lines = ctx.doc.splitTextToSize(text, maxWidth)
    if (Array.isArray(lines)) {
      let lineY = y
      lines.forEach((line) => {
        ctx.doc.text(line, x, lineY, { align })
        lineY += size * 0.55
      })
      return lineY - y
    }
    ctx.doc.text(text, x, y, { align })
    return size * 0.55
  }

  ctx.doc.text(text, x, y, { align })
  return size * 0.55
}

function drawRect(
  ctx: LayoutState,
  x: number,
  y: number,
  width: number,
  height: number,
  fill?: [number, number, number],
  stroke?: [number, number, number],
  strokeWidth = 0.5,
  radius = 0
): void {
  if (fill) {
    ctx.doc.setFillColor(...fill)
    if (radius > 0) {
      ctx.doc.roundedRect(x, y, width, height, radius, radius, 'F')
    } else {
      ctx.doc.rect(x, y, width, height, 'F')
    }
  }
  if (stroke) {
    ctx.doc.setDrawColor(...stroke)
    ctx.doc.setLineWidth(strokeWidth)
    if (radius > 0) {
      ctx.doc.roundedRect(x, y, width, height, radius, radius, 'S')
    } else {
      ctx.doc.rect(x, y, width, height, 'S')
    }
  }
}

function drawHorizontalLine(
  ctx: LayoutState,
  y: number,
  x1?: number,
  x2?: number,
  color: [number, number, number] = [226, 232, 240],
  width = 0.5
): void {
  const left = x1 ?? ctx.margin
  const right = x2 ?? ctx.pageWidth - ctx.margin
  ctx.doc.setDrawColor(...color)
  ctx.doc.setLineWidth(width)
  ctx.doc.line(left, y, right, y)
}

const COLORS = {
  dark: [15, 23, 42] as [number, number, number],
  medium: [100, 116, 139] as [number, number, number],
  border: [226, 232, 240] as [number, number, number],
  panel: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
}

export async function generateInvoicePDF(
  invoice: Invoice & { client: any; items: InvoiceItem[] },
  business: BusinessProfile | null
): Promise<void> {
  const doc = new jsPDF()
  await loadFonts(doc)

  const ctx = createLayout(doc, 18)
  const currency = invoice.currency || 'INR'
  const headerBusiness = business?.business_name || 'Your Business'

  const headerTop = ctx.y
  const logoMaxWidth = 24
  const logoMaxHeight = 24
  const logoX = ctx.margin
  const logoY = headerTop

  if (business?.logo_path) {
    try {
      const logoUrl = await getLogoUrl(business.logo_path)
      if (logoUrl) {
        const imgProps = await loadImageProps(logoUrl)
        const scale = Math.min(logoMaxWidth / imgProps.width, logoMaxHeight / imgProps.height)
        const finalWidth = imgProps.width * scale
        const finalHeight = imgProps.height * scale
        doc.addImage(logoUrl, 'PNG', logoX, logoY, finalWidth, finalHeight)
      }
    } catch {
      // skip logo on failure
    }
  }

  const companyNameX = logoX + logoMaxWidth + 6
  const companyNameY = headerTop + 5
  drawText(ctx, headerBusiness.toUpperCase(), companyNameX, companyNameY, {
    size: 10,
    style: 'bold',
    color: COLORS.dark,
    charSpace: 2,
  })

  const invoiceTitleX = ctx.pageWidth - ctx.margin
  const invoiceTitleY = headerTop + 3
  drawText(ctx, 'INVOICE', invoiceTitleX, invoiceTitleY, {
    size: 20,
    style: 'bold',
    color: COLORS.dark,
    align: 'right',
  })

  ctx.y = headerTop + Math.max(logoMaxHeight, 16) + 12

  const panelPaddingX = 20
  const panelPaddingY = 18

  const leftColumnX = ctx.margin + panelPaddingX
  const rightColumnX = ctx.margin + ctx.contentWidth / 2 + 8
  const columnWidth = ctx.contentWidth / 2 - panelPaddingX - 8

  const clientAddressParts = [
    invoice.client?.address,
    invoice.client?.city,
    invoice.client?.state,
    invoice.client?.country,
    invoice.client?.postal_code,
  ].filter(Boolean)
  const clientAddressStr = clientAddressParts.join(', ')

  const leftLines: string[] = [
    'ISSUED TO:',
    invoice.client?.name || 'Unknown Client',
    invoice.client?.company_name || '',
    clientAddressStr,
    invoice.client?.email || '',
    invoice.client?.phone || '',
  ]

  const paymentInfoLines: string[] = []
  if (invoice.payment_instructions) {
    paymentInfoLines.push('PAYMENT INFO:')
    paymentInfoLines.push(invoice.payment_instructions)
  }

  const allLeftLines = [...leftLines, ...paymentInfoLines].filter((line) => line.trim() !== '')

  const rightLines = [
    'INVOICE NO:',
    invoice.invoice_number || '',
    '',
    'DATE:',
    formatDate(invoice.issue_date),
    '',
    'DUE DATE:',
    formatDate(invoice.due_date),
    '',
    'STATUS:',
    (invoice.status || '').toUpperCase(),
  ]

  const lineHeight = 5
  const leftHeight = allLeftLines.reduce((acc, line) => {
    const wrapped = doc.splitTextToSize(line, columnWidth)
    const lines = Array.isArray(wrapped) ? wrapped : [wrapped]
    return acc + lines.length * lineHeight
  }, 0)

  const rightHeight = rightLines.reduce((acc, line) => {
    const wrapped = doc.splitTextToSize(line, columnWidth)
    const lines = Array.isArray(wrapped) ? wrapped : [wrapped]
    return acc + lines.length * lineHeight
  }, 0)

  const panelContentHeight = Math.max(leftHeight, rightHeight)
  const panelHeight = panelContentHeight + panelPaddingY * 2

  ensureSpace(ctx, panelHeight + 8)

  drawRect(
    ctx,
    ctx.margin,
    ctx.y,
    ctx.contentWidth,
    panelHeight,
    COLORS.panel,
    COLORS.border,
    0.3,
    0
  )

  let ly = ctx.y + panelPaddingY
  allLeftLines.forEach((line) => {
    const isLabel = line.endsWith(':')
    const wrapped = doc.splitTextToSize(line, columnWidth)
    const lines = Array.isArray(wrapped) ? wrapped : [wrapped]
    lines.forEach((l) => {
      drawText(ctx, l, leftColumnX, ly, {
        size: isLabel ? 7.5 : 8.5,
        style: isLabel ? 'bold' : 'normal',
        color: isLabel ? COLORS.medium : COLORS.dark,
        charSpace: isLabel ? 1.2 : 0,
        maxWidth: columnWidth,
      })
      ly += lineHeight
    })
  })

  let ry = ctx.y + panelPaddingY
  rightLines.forEach((line) => {
    const isLabel = line.endsWith(':') && line.length < 20
    const wrapped = doc.splitTextToSize(line, columnWidth)
    const lines = Array.isArray(wrapped) ? wrapped : [wrapped]
    lines.forEach((l) => {
      drawText(ctx, l, rightColumnX, ry, {
        size: isLabel ? 7.5 : 8.5,
        style: isLabel ? 'bold' : 'normal',
        color: isLabel ? COLORS.medium : COLORS.dark,
        charSpace: isLabel ? 1.2 : 0,
        maxWidth: columnWidth,
      })
      ry += lineHeight
    })
  })

  ctx.y += panelHeight + 30

  const tableLeft = ctx.margin
  const tableWidth = ctx.contentWidth

  const colDescWidth = tableWidth * 0.48
  const colRateWidth = tableWidth * 0.16
  const colQtyWidth = tableWidth * 0.12
  const colTotalWidth = tableWidth * 0.24

  const colDescX = tableLeft + 4
  const colRateX = tableLeft + colDescWidth + colRateWidth - 4
  const colQtyX = colRateX + colQtyWidth - 4
  const colTotalX = colQtyX + colQtyWidth + colTotalWidth - 4
  const tableRight = tableLeft + tableWidth - 4

  const headerHeight = 12
  const rowHeight = 13
  const items = invoice.items || []

  const tableNeededHeight = headerHeight + items.length * rowHeight + 8
  ensureSpace(ctx, tableNeededHeight + 50)

  drawHorizontalLine(ctx, ctx.y + 5, tableLeft, tableRight, COLORS.border, 0.7)
  let thY = ctx.y + 9
  drawText(ctx, 'DESCRIPTION', colDescX, thY, { size: 8.5, style: 'bold', color: COLORS.medium, charSpace: 1.2 })
  drawText(ctx, 'RATE', colRateX, thY, { size: 8.5, style: 'bold', color: COLORS.medium, align: 'right', charSpace: 1.2 })
  drawText(ctx, 'QTY', colQtyX, thY, { size: 8.5, style: 'bold', color: COLORS.medium, align: 'right', charSpace: 1.2 })
  drawText(ctx, 'TOTAL', colTotalX, thY, { size: 8.5, style: 'bold', color: COLORS.medium, align: 'right', charSpace: 1.2 })

  ctx.y += headerHeight

  items.forEach((item, index) => {
    const descMaxWidth = colDescWidth - 4
    const descText = `${item.name}${item.description ? ` — ${item.description}` : ''}`
    const descLines = doc.splitTextToSize(descText, descMaxWidth)
    const wrappedLineCount = Array.isArray(descLines) ? descLines.length : 1
    const neededRowHeight = Math.max(rowHeight, wrappedLineCount * 8 + 5)

    if (ctx.y + neededRowHeight > ctx.pageHeight - ctx.margin) {
      doc.addPage()
      ctx.y = ctx.margin

      drawHorizontalLine(ctx, ctx.y + 5, tableLeft, tableRight, COLORS.border, 0.7)
      thY = ctx.y + 9
      drawText(ctx, 'DESCRIPTION', colDescX, thY, { size: 8.5, style: 'bold', color: COLORS.medium, charSpace: 1.2 })
      drawText(ctx, 'RATE', colRateX, thY, { size: 8.5, style: 'bold', color: COLORS.medium, align: 'right', charSpace: 1.2 })
      drawText(ctx, 'QTY', colQtyX, thY, { size: 8.5, style: 'bold', color: COLORS.medium, align: 'right', charSpace: 1.2 })
      drawText(ctx, 'TOTAL', colTotalX, thY, { size: 8.5, style: 'bold', color: COLORS.medium, align: 'right', charSpace: 1.2 })

      ctx.y += headerHeight
    }

    const rowY = ctx.y

    if (index % 2 === 0) {
      drawRect(ctx, tableLeft, rowY, tableWidth, neededRowHeight, COLORS.panel, undefined, 0, 0)
    }

    if (Array.isArray(descLines) && descLines.length > 0) {
      descLines.forEach((dl, dlIndex) => {
        drawText(ctx, dl, colDescX, rowY + 9 + dlIndex * 8, {
          size: 8.5,
          style: 'normal',
          color: COLORS.dark,
          maxWidth: descMaxWidth,
        })
      })
    }

    drawText(ctx, formatCurrency(item.unit_price, currency), colRateX, rowY + 9, {
      size: 8.5,
      style: 'normal',
      color: COLORS.dark,
      align: 'right',
    })

    drawText(ctx, String(item.quantity), colQtyX, rowY + 9, {
      size: 8.5,
      style: 'normal',
      color: COLORS.dark,
      align: 'right',
    })

    drawText(ctx, formatCurrency(item.line_total, currency), colTotalX, rowY + 9, {
      size: 8.5,
      style: 'bold',
      color: COLORS.dark,
      align: 'right',
    })

    if (index < items.length - 1) {
      drawHorizontalLine(ctx, rowY + neededRowHeight, tableLeft, tableRight, COLORS.border, 0.3)
    }

    ctx.y += neededRowHeight
  })

  drawHorizontalLine(ctx, ctx.y, tableLeft, tableRight, COLORS.border, 0.7)

  ctx.y += 22

  const subtotal = invoice.subtotal || 0
  const taxAmount = invoice.tax_amount || 0
  const discountAmount = invoice.discount_amount || 0
  const totalAmount = invoice.total_amount || 0

  const totalsLeft = ctx.pageWidth - ctx.margin - ctx.contentWidth * 0.42
  const totalsRight = ctx.pageWidth - ctx.margin

  ensureSpace(ctx, 70)

  const rowLabel = (label: string, value: string, labelSize = 9.5, valueSize = 9.5, valueBold = false) => {
    drawText(ctx, label, totalsLeft, ctx.y + 7, { size: labelSize, style: 'normal', color: COLORS.medium })
    drawText(ctx, value, totalsRight, ctx.y + 7, { size: valueSize, style: valueBold ? 'bold' : 'normal', color: COLORS.dark, align: 'right' })
    ctx.y += 11
  }

  rowLabel('Subtotal', formatCurrency(subtotal, currency))
  if (taxAmount > 0) rowLabel('Tax', formatCurrency(taxAmount, currency))
  if (discountAmount > 0) rowLabel('Discount', `-${formatCurrency(discountAmount, currency)}`)

  drawHorizontalLine(ctx, ctx.y - 3, totalsLeft, totalsRight, COLORS.border, 0.7)

  drawText(ctx, 'TOTAL', totalsLeft, ctx.y + 11, { size: 10.5, style: 'bold', color: COLORS.dark, charSpace: 1.2 })
  drawText(ctx, formatCurrency(totalAmount, currency), totalsRight, ctx.y + 11, { size: 13, style: 'bold', color: COLORS.dark, align: 'right' })

  ctx.y += 40

  ensureSpace(ctx, 40)

  const thankYouY = ctx.y

  drawHorizontalLine(ctx, thankYouY - 8, ctx.margin, ctx.pageWidth - ctx.margin, COLORS.border, 0.4)

  drawText(ctx, 'THANK YOU', ctx.pageWidth / 2, thankYouY + 7, {
    size: 10,
    style: 'bold',
    color: COLORS.dark,
    align: 'center',
    charSpace: 1.8,
  })

  const footerLines = [
    headerBusiness,
    business?.email || '',
    business?.phone || '',
  ].filter(Boolean)

  let footerY = thankYouY + 14
  footerLines.forEach((line) => {
    drawText(ctx, line, ctx.pageWidth / 2, footerY, {
      size: 7.5,
      style: 'normal',
      color: COLORS.medium,
      align: 'center',
    })
    footerY += 4.5
  })

  const filename = `Invoice_${invoice.invoice_number}.pdf`
  doc.save(filename)
}

async function getLogoUrl(path: string): Promise<string | null> {
  try {
    const { getLogoUrl } = await import('@/services/businessProfileService')
    return await getLogoUrl(path)
  } catch {
    return null
  }
}

function loadImageProps(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = src
  })
}