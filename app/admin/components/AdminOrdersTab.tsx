'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, Package, Search, ShoppingBag } from 'lucide-react'

interface Order {
  id: string
  total_amount: number
  status: string
  delivery_address: string
  phone: string
  user_id: string | null
  guest_name: string | null
  guest_email: string | null
  created_at: string
  order_items: Array<{
    quantity: number
    price: number
    products: {
      name: string
      store_id: string
      stores?: {
        name: string
      }
    }
  }>
}

export function AdminOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, statusFilter, searchTerm])

  async function loadOrders() {
    try {
      const supabase = createClient()
      
      // Загрузить все заказы для админа
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            products (
              name,
              store_id,
              stores (
                name
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading orders:', error)
        alert('Buyurtmalarni yuklashda xatolik: ' + error.message)
      } else if (allOrders) {
        setOrders(allOrders as Order[])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      alert('Buyurtmalarni yuklashda xatolik')
    } finally {
      setLoading(false)
    }
  }

  function filterOrders() {
    let filtered = orders

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(search) ||
        order.phone.toLowerCase().includes(search) ||
        order.delivery_address.toLowerCase().includes(search) ||
        (order.guest_name && order.guest_name.toLowerCase().includes(search)) ||
        (order.guest_email && order.guest_email.toLowerCase().includes(search))
      )
    }

    setFilteredOrders(filtered)
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) {
        alert('Buyurtma holatini yangilashda xatolik: ' + error.message)
        return
      }

      alert('Buyurtma holati muvaffaqiyatli yangilandi!')
      loadOrders()
    } catch (error) {
      alert('Buyurtma holatini yangilashda xatolik')
      console.error('Error updating order status:', error)
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success-500" />
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-accent-500" />
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'pending':
        return 'Yangi'
      case 'processing':
        return 'Tayyorlanmoqda'
      case 'delivering':
        return 'Yetkazilmoqda'
      case 'completed':
        return 'Yakunlangan'
      case 'cancelled':
        return 'Bekor qilingan'
      default:
        return status
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Buyurtmalar yuklanmoqda...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          Barcha buyurtmalar
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Barcha holatlar</option>
            <option value="pending">Yangi</option>
            <option value="processing">Tayyorlanmoqda</option>
            <option value="delivering">Yetkazilmoqda</option>
            <option value="completed">Yakunlangan</option>
            <option value="cancelled">Bekor qilingan</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg">Buyurtma #{order.id.substring(0, 8)}</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="font-semibold">{getStatusText(order.status)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 {formatDate(order.created_at)}</p>
                    <p>💰 Jami: {new Intl.NumberFormat('uz-UZ').format(Math.round(order.total_amount))} so'm</p>
                    <p>📞 Telefon: {order.phone}</p>
                    <p>📍 Manzil: {order.delivery_address}</p>
                    {order.guest_name && (
                      <p>👤 Mijoz: {order.guest_name} {order.guest_email && `(${order.guest_email})`}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Holatni o'zgartirish:</label>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="pending">Yangi</option>
                    <option value="processing">Tayyorlanmoqda</option>
                    <option value="delivering">Yetkazilmoqda</option>
                    <option value="completed">Yakunlangan</option>
                    <option value="cancelled">Bekor qilingan</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3">Mahsulotlar:</h3>
                <div className="space-y-2">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.products.name}</p>
                        {item.products.stores && (
                          <p className="text-sm text-gray-600">Do'kon: {item.products.stores.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.quantity} x {item.price} so'm</p>
                        <p className="text-sm text-gray-600">= {item.quantity * item.price} so'm</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-sm text-gray-600 text-center">
        Jami: {filteredOrders.length} ta buyurtma
      </div>
    </div>
  )
}

