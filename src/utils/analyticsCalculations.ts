import type { Invoice, Client } from '@/types'

export type DateRange = 'week' | 'month' | '3months' | '6months' | 'year' | 'custom'

export interface AnalyticsFilters {
  dateRange: DateRange
  customStart?: string
  customEnd?: string
}

export interface RevenueDataPoint {
  label: string
  value: number
  date: Date
}

export interface ClientRevenue {
  client: Client
  totalRevenue: number
  invoiceCount: number
}

export interface AnalyticsSummary {
  totalRevenue: number
  currentMonthRevenue: number
  previousMonthRevenue: number
  revenueGrowthPercentage: number
  paidAmount: number
  pendingAmount: number
  sentAmount: number
  overdueAmount: number
  outstandingAmount: number
  averageInvoiceValue: number
  collectionRate: number
  invoiceCount: number
  paidCount: number
  pendingCount: number
  sentCount: number
  overdueCount: number
  cancelledCount: number
  topClients: ClientRevenue[]
  revenueHistory: RevenueDataPoint[]
  currency: string
}

function getDateRangeBounds(range: DateRange, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date()
  const end = customEnd ? new Date(customEnd) : now
  const start = customStart ? new Date(customStart) : new Date()

  switch (range) {
    case 'week':
      start.setDate(now.getDate() - 7)
      break
    case 'month':
      start.setMonth(now.getMonth() - 1)
      break
    case '3months':
      start.setMonth(now.getMonth() - 3)
      break
    case '6months':
      start.setMonth(now.getMonth() - 6)
      break
    case 'year':
      start.setFullYear(now.getFullYear() - 1)
      break
    case 'custom':
    default:
      break
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

export function filterInvoicesByDateRange(invoices: (Invoice & { client?: any })[], range: DateRange, customStart?: string, customEnd?: string) {
  const { start, end } = getDateRangeBounds(range, customStart, customEnd)
  return invoices.filter((inv) => {
    const issueDate = new Date(inv.issue_date)
    return issueDate >= start && issueDate <= end
  })
}

export function calculateAnalytics(invoices: (Invoice & { client?: any })[], clients: Client[] = [], filters: AnalyticsFilters = { dateRange: 'month' }): AnalyticsSummary {
  const filtered = filterInvoicesByDateRange(invoices, filters.dateRange, filters.customStart, filters.customEnd)
  const validInvoices = filtered.filter((i) => i.status !== 'cancelled')

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const currentMonthRevenue = invoices
    .filter((i) => {
      const d = new Date(i.issue_date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && i.status !== 'cancelled'
    })
    .reduce((sum, i) => sum + (i.total_amount || 0), 0)

  const previousMonthRevenue = invoices
    .filter((i) => {
      const d = new Date(i.issue_date)
      return d.getMonth() === previousMonth && d.getFullYear() === previousMonthYear && i.status !== 'cancelled'
    })
    .reduce((sum, i) => sum + (i.total_amount || 0), 0)

  const revenueGrowthPercentage = previousMonthRevenue === 0
    ? currentMonthRevenue > 0
      ? 100
      : 0
    : ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100

  const paidAmount = validInvoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0)

  const pendingAmount = validInvoices
    .filter((i) => i.status === 'draft')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0)

  const sentAmount = validInvoices
    .filter((i) => i.status === 'sent')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0)

  const overdueAmount = validInvoices
    .filter((i) => {
      const isOverdue = new Date(i.due_date) < now && i.status !== 'paid' && i.status !== 'cancelled'
      return isOverdue
    })
    .reduce((sum, i) => sum + (i.total_amount || 0), 0)

  const outstandingAmount = pendingAmount + sentAmount + overdueAmount
  const totalRevenue = validInvoices.reduce((sum, i) => sum + (i.total_amount || 0), 0)
  const collectionRate = totalRevenue > 0 ? Math.round((paidAmount / totalRevenue) * 100) : 0
  const averageInvoiceValue = validInvoices.length > 0 ? totalRevenue / validInvoices.length : 0

  const paidCount = validInvoices.filter((i) => i.status === 'paid').length
  const pendingCount = validInvoices.filter((i) => i.status === 'draft').length
  const sentCount = validInvoices.filter((i) => i.status === 'sent').length
  const overdueCount = validInvoices.filter((i) => {
    const isOverdue = new Date(i.due_date) < now && i.status !== 'paid' && i.status !== 'cancelled'
    return isOverdue
  }).length
  const cancelledCount = invoices.filter((i) => i.status === 'cancelled').length

  const clientMap = new Map<string, { client: Client; revenue: number; count: number }>()
  validInvoices.forEach((inv) => {
    const clientId = inv.client_id
    if (!clientMap.has(clientId)) {
      const client = clients.find((c) => c.id === clientId) || (inv.client as any)
      clientMap.set(clientId, {
        client: client || (inv.client as any),
        revenue: 0,
        count: 0,
      })
    }
    const entry = clientMap.get(clientId)!
    entry.revenue += inv.total_amount || 0
    entry.count += 1
  })

  const topClients: ClientRevenue[] = Array.from(clientMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((entry) => ({
      client: entry.client,
      totalRevenue: entry.revenue,
      invoiceCount: entry.count,
    }))

  const revenueHistory = generateRevenueHistory(invoices)

  const currency = invoices[0]?.currency || 'INR'

  return {
    totalRevenue,
    currentMonthRevenue,
    previousMonthRevenue,
    revenueGrowthPercentage: Math.round(revenueGrowthPercentage * 100) / 100,
    paidAmount,
    pendingAmount,
    sentAmount,
    overdueAmount,
    outstandingAmount,
    averageInvoiceValue: Math.round(averageInvoiceValue * 100) / 100,
    collectionRate,
    invoiceCount: validInvoices.length,
    paidCount,
    pendingCount,
    sentCount,
    overdueCount,
    cancelledCount,
    topClients,
    revenueHistory,
    currency,
  }
}

export function generateRevenueHistory(invoices: (Invoice & { client?: any })[]): RevenueDataPoint[] {
  const now = new Date()
  const points: RevenueDataPoint[] = []

  const months = 6
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthRevenue = invoices
      .filter((inv) => {
        const issueDate = new Date(inv.issue_date)
        return issueDate.getMonth() === d.getMonth() && issueDate.getFullYear() === d.getFullYear() && inv.status !== 'cancelled'
      })
      .reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

    points.push({
      label: d.toLocaleString('en-US', { month: 'short' }),
      value: monthRevenue,
      date: d,
    })
  }

  return points
}

export function formatGrowth(value: number): { text: string; isPositive: boolean } {
  const isPositive = value >= 0
  const text = `${isPositive ? '↑' : '↓'} ${Math.abs(value)}%`
  return { text, isPositive }
}