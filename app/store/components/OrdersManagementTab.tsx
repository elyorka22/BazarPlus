'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Clock, Package, Search } from 'lucide-react'

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
    }
  }>
}

export function OrdersManagementTab() {
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!store) {
        setLoading(false)
        return
      }

      const { data: allOrders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            products (
              name,
              store_id
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (allOrders) {
        const storeOrders = allOrders.filter((order: any) =>
          order.order_items.some((item: any) => item.products?.store_id === store.id)
        )
        setOrders(storeOrders as Order[])
      }
    } catch (error) {
      console.error('Error loading orders:', error)
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
      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
      loadOrders()
    } catch (error) {
      alert('Buyurtma holatini yangilashda xatolik')
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Buyurtmalarni boshqarish</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border rounded-lg w-full sm:w-64 text-sm sm:text-base"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg text-sm sm:text-base"
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
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Buyurtmalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const storeItems = order.order_items.filter(
              (item: any) => item.products?.store_id
            )
            const storeTotal = storeItems.reduce(
              (sum: number, item: any) => sum + item.price * item.quantity,
              0
            )

            return (
              <div key={order.id} className="bg-white border rounded-xl shadow-lg p-3 sm:p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 sm:mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(order.status)}
                      <span className="font-bold text-base sm:text-lg">Buyurtma #{order.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString('uz-UZ')}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className="inline-block px-2 sm:px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium">
                      {getStatusText(order.status)}
                    </span>
                    <p className="text-xl sm:text-2xl font-bold text-primary-600 mt-2">
                      {storeTotal.toLocaleString()} so'm
                    </p>
                  </div>
                </div>

                <div className="border-t pt-3 sm:pt-4 mb-3 sm:mb-4">
                  {order.guest_name && order.guest_email ? (
                    <>
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">
                        <strong>Mijoz (mehmon):</strong> {order.guest_name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">
                        <strong>Email:</strong> {order.guest_email}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      <strong>Mijoz:</strong> Ro'yxatdan o'tgan foydalanuvchi
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    <strong>Manzil:</strong> {order.delivery_address}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3">
                    <strong>Telefon:</strong> {order.phone}
                  </p>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold mb-2">Mahsulotlar:</p>
                    <ul className="space-y-1">
                      {storeItems.map((item: any, idx: number) => (
                        <li key={idx} className="text-xs sm:text-sm text-gray-600">
                          {item.products.name} × {item.quantity} = {(item.quantity * item.price).toLocaleString()} so'm
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                      className="flex-1 bg-accent-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:opacity-90 transition text-sm sm:text-base"
                    >
                      Ishga olish
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="flex-1 bg-red-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:opacity-90 transition text-sm sm:text-base"
                    >
                      Bekor qilish
                    </button>
                  </div>
                )}

                {order.status === 'processing' && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivering')}
                      className="flex-1 bg-secondary-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                    >
                      Yetkazib berishga yuborish
                    </button>
                  </div>
                )}

                {order.status === 'delivering' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="flex-1 bg-success-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition"
                    >
                      Buyurtmani yakunlash
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

