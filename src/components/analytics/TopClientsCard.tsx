import { Link } from 'react-router-dom'
import { Avatar } from '@/components/common/Avatar'
import type { ClientRevenue } from '@/utils/analyticsCalculations'
import { formatCurrency } from '@/utils/invoiceCalculations'

interface TopClientsCardProps {
  clients: ClientRevenue[]
  currency: string
}

export function TopClientsCard({ clients, currency }: TopClientsCardProps) {

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">Top Clients by Revenue</h3>
        <Link to="/app/clients" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
          View All Clients →
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-slate-500">No client data available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map((item, index) => {
            const clientName = item.client?.name || 'Unknown'

            return (
              <div key={item.client.id || index} className="flex items-center space-x-3">
                <div className="flex items-center flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{index + 1}</span>
                  <Avatar name={clientName} size="sm" />
                  <div className="ml-2.5 min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{clientName}</p>
                    <p className="text-[10px] text-slate-500">{item.invoiceCount} invoice{item.invoiceCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-bold text-slate-900">{formatCurrency(item.totalRevenue, currency)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}