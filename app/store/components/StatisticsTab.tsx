'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, DollarSign, Package, ShoppingCart } from 'lucide-react'

interface Statistics {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  activeProducts: number
  pendingOrders: number
  completedOrders: number
  todayRevenue: number
  todayOrders: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

export function StatisticsTab() {
  const [stats, setStats] = useState<Statistics>({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    todayOrders: 0,
  })
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatistics()
  }, [])

  async function loadStatistics() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get store
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!store) {
        setLoading(false)
        return
      }

      // Get products count
      const { data: products } = await supabase
        .from('products')
        .select('id, is_active')
        .eq('store_id', store.id)

      const totalProducts = products?.length || 0
      const activeProducts = products?.filter((p: { is_active: boolean }) => p.is_active).length || 0

      // Get orders with store products
      const { data: allOrders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            products (
              store_id
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (allOrders) {
        // Filter orders with store products
        const storeOrders = allOrders.filter((order: any) =>
          order.order_items.some((item: any) => item.products?.store_id === store.id)
        )

        // Calculate statistics
        let totalRevenue = 0
        let todayRevenue = 0
        let pendingOrders = 0
        let completedOrders = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {}

        storeOrders.forEach((order: any) => {
          const storeItems = order.order_items.filter(
            (item: any) => item.products?.store_id === store.id
          )

          const orderTotal = storeItems.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
          )

          totalRevenue += orderTotal

          const orderDate = new Date(order.created_at)
          if (orderDate >= today) {
            todayRevenue += orderTotal
          }

          if (order.status === 'pending' || order.status === 'processing' || order.status === 'delivering') {
            pendingOrders++
          } else if (order.status === 'completed') {
            completedOrders++
          }

          // Track product sales
          storeItems.forEach((item: any) => {
            const productId = item.products?.id || 'unknown'
            if (!productStats[productId]) {
              productStats[productId] = {
                name: item.products?.name || 'Noma\'lum',
                quantity: 0,
                revenue: 0,
              }
            }
            productStats[productId].quantity += item.quantity
            productStats[productId].revenue += item.price * item.quantity
          })
        })

        const topProductsList = Object.values(productStats)
          .sort((a: TopProduct, b: TopProduct) => b.revenue - a.revenue)
          .slice(0, 5)

        setStats({
          totalRevenue,
          totalOrders: storeOrders.length,
          totalProducts,
          activeProducts,
          pendingOrders,
          completedOrders,
          todayRevenue,
          todayOrders: storeOrders.filter((o: any) => {
            const orderDate = new Date(o.created_at)
            return orderDate >= today
          }).length,
        })

        setTopProducts(topProductsList)
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
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
    <div className="space-y-6">
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Jami daromad</p>
          <p className="text-3xl font-bold">{stats.totalRevenue.toLocaleString()} so'm</p>
        </div>

        <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-sm opacity-90 mb-1">Jami buyurtmalar</p>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </div>

        <div className="bg-gradient-to-br from-accent-500 to-accent-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Mahsulotlar</p>
          <p className="text-3xl font-bold">{stats.activeProducts} / {stats.totalProducts}</p>
          <p className="text-xs opacity-75 mt-1">Faol / Jami</p>
        </div>

        <div className="bg-gradient-to-br from-success-500 to-success-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-sm opacity-90 mb-1">Bugungi daromad</p>
          <p className="text-3xl font-bold">{stats.todayRevenue.toLocaleString()} so'm</p>
          <p className="text-xs opacity-75 mt-1">{stats.todayOrders} ta buyurtma</p>
        </div>
      </div>

      {/* Order Status Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-accent-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Kutilayotgan buyurtmalar</p>
              <p className="text-3xl font-bold text-accent-600">{stats.pendingOrders}</p>
            </div>
            <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-accent-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-success-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Yakunlangan buyurtmalar</p>
              <p className="text-3xl font-bold text-success-600">{stats.completedOrders}</p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-primary-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Jami buyurtmalar</p>
              <p className="text-3xl font-bold text-primary-600">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Eng ko'p sotilgan mahsulotlar</h3>
        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} dona sotilgan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600">{product.revenue.toLocaleString()} so'm</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">Hozircha ma'lumotlar yo'q</p>
        )}
      </div>
    </div>
  )
}

