import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Package, Loader2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'

const STATUS_CONFIG = {
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Delivered', color: 'bg-[#E8F5EE] text-[#5C8B6E]' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
}

const QUALITY_LABELS = { standard: 'Standard', premium: 'Premium', luxury: 'Luxury' }

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, books(title, size_type), order_status_history(*)')
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 size={24} className="animate-spin text-[#B66A4A]" /></div>

  return (
    <div className="min-h-screen bg-[#FFFFF0]">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-4xl font-semibold text-[#2C1810] mb-1">My Orders</h1>
        <p className="text-[#6B4C3B] text-sm mb-10">Every memory book on its way to your doorstep.</p>

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-[#FFE8D6] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-[#B66A4A]" />
            </div>
            <h3 className="font-display text-xl font-semibold text-[#2C1810] mb-2">No orders yet</h3>
            <p className="text-[#6B4C3B] text-sm">Your ordered books will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment
              const expanded = expandedId === order.id
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-[#FFCBA4]/40 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    className="w-full flex items-center gap-4 p-5 hover:bg-[#FFE8D6]/20 transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#FFE8D6] rounded-xl flex items-center justify-center shrink-0">
                      <Package size={18} className="text-[#B66A4A]" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-[#2C1810] text-sm">{order.books?.title || 'Memory Book'}</p>
                      <p className="text-xs text-[#6B4C3B] mt-0.5">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}{QUALITY_LABELS[order.print_quality]}
                        {' · '}{order.city}, {order.state}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-[#B66A4A]">₹{Number(order.price_inr).toLocaleString('en-IN')}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color}`}>{status.label}</span>
                      {expanded ? <ChevronUp size={16} className="text-[#6B4C3B]" /> : <ChevronDown size={16} className="text-[#6B4C3B]" />}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-[#FFCBA4]/40 p-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-[#6B4C3B]/60 font-medium mb-3">Order details</p>
                          <dl className="space-y-2">
                            {[
                              ['Order ID', order.id.slice(0, 8) + '...'],
                              ['Quality', QUALITY_LABELS[order.print_quality]],
                              ['Quantity', order.quantity],
                              ['Total', `₹${Number(order.price_inr).toLocaleString('en-IN')}`],
                              order.razorpay_payment_id && ['Payment ID', order.razorpay_payment_id.slice(0, 12) + '...'],
                            ].filter(Boolean).map(([k, v]) => (
                              <div key={k} className="flex items-start justify-between">
                                <dt className="text-xs text-[#6B4C3B]">{k}</dt>
                                <dd className="text-xs font-medium text-[#2C1810] text-right max-w-[180px] truncate">{v}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-widest text-[#6B4C3B]/60 font-medium mb-3">Delivery to</p>
                          <p className="text-sm text-[#2C1810] font-semibold">{order.full_name}</p>
                          <p className="text-xs text-[#6B4C3B] mt-1">{order.phone}</p>
                          <p className="text-xs text-[#6B4C3B] mt-1">{order.address_line1}{order.address_line2 ? ', ' + order.address_line2 : ''}</p>
                          <p className="text-xs text-[#6B4C3B]">{order.city}, {order.state} — {order.pincode}</p>
                        </div>
                      </div>

                      {/* Status timeline */}
                      {order.order_status_history?.length > 0 && (
                        <div className="mt-5 pt-5 border-t border-[#FFCBA4]/30">
                          <p className="text-xs uppercase tracking-widest text-[#6B4C3B]/60 font-medium mb-3">Status history</p>
                          <div className="space-y-2">
                            {[...order.order_status_history].reverse().map(h => {
                              const s = STATUS_CONFIG[h.status] || STATUS_CONFIG.pending_payment
                              return (
                                <div key={h.id} className="flex items-center gap-3">
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                                  <span className="text-xs text-[#6B4C3B]">{new Date(h.changed_at).toLocaleString('en-IN')}</span>
                                  {h.note && <span className="text-xs text-[#6B4C3B]/60">· {h.note}</span>}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
