'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { useUser } from '@/app/providers'
import { createClient } from '@/lib/supabase/client'
import { Shield, Settings, Package, MessageSquare, Store, BarChart3, ShoppingBag } from 'lucide-react'
import { SiteSettingsTab } from './components/SiteSettingsTab'
import { ProductsManagementTab } from './components/ProductsManagementTab'
import { BotManagementTab } from './components/BotManagementTab'
import { StoreSettingsTab } from './components/StoreSettingsTab'
import { AdminStatisticsTab } from './components/AdminStatisticsTab'
import { AdminOrdersTab } from './components/AdminOrdersTab'

type TabType = 'statistics' | 'settings' | 'products' | 'bot' | 'store-settings' | 'orders'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('statistics')
  const { user, role, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    // Проверить роль пользователя и перенаправить, если не админ
    if (!loading) {
      if (!user) {
        // Пользователь не авторизован - перенаправить на логин
        router.push('/auth/login')
        return
      }

      // Проверить роль напрямую из базы данных
      const checkAdminRole = async () => {
        try {
          const supabase = createClient()
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          if (error || !profile) {
            router.push('/client')
            return
          }

          const userRole = profile.role

          if (userRole !== 'admin') {
            // Пользователь не админ - перенаправить на соответствующую страницу
            if (userRole === 'store') {
              router.push('/store')
            } else {
              router.push('/client')
            }
          }
        } catch (error) {
          console.error('Error checking admin role:', error)
          router.push('/client')
        }
      }

      checkAdminRole()
    }
  }, [user, role, loading, router])

  // Показать загрузку пока проверяем роль
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  // Если пользователь не авторизован или не админ, не показывать страницу
  if (!user || role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Navbar />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
          <span className="hidden sm:inline">Administrator paneli</span>
          <span className="sm:hidden">Admin</span>
        </h1>

        {/* Mobile: Scrollable tabs */}
        <div className="flex overflow-x-auto gap-2 sm:gap-4 mb-4 sm:mb-6 pb-2 sm:pb-0 scrollbar-hide -mx-2 sm:mx-0 px-2 sm:px-0">
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'statistics'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Statistika</span>
            <span className="sm:hidden">Stat</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden md:inline">Sayt sozlamalari</span>
            <span className="hidden sm:inline md:hidden">Sozlamalar</span>
            <span className="sm:hidden">Sozl</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden md:inline">Mahsulotlarni boshqarish</span>
            <span className="hidden sm:inline md:hidden">Mahsulotlar</span>
            <span className="sm:hidden">Mahs</span>
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'bot'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Botni boshqarish</span>
            <span className="sm:hidden">Bot</span>
          </button>
          <button
            onClick={() => setActiveTab('store-settings')}
            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'store-settings'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden md:inline">Do'kon sozlamalari</span>
            <span className="hidden sm:inline md:hidden">Do'konlar</span>
            <span className="sm:hidden">Do'kon</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Buyurtmalar</span>
            <span className="sm:hidden">Buy</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6">
          {activeTab === 'statistics' && <AdminStatisticsTab />}
          {activeTab === 'settings' && <SiteSettingsTab />}
          {activeTab === 'products' && <ProductsManagementTab />}
          {activeTab === 'bot' && <BotManagementTab />}
          {activeTab === 'store-settings' && <StoreSettingsTab />}
          {activeTab === 'orders' && <AdminOrdersTab />}
        </div>
      </div>
    </div>
  )
}
