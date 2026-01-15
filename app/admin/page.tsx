'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { useUser } from '@/app/providers'
import { createClient } from '@/lib/supabase/client'
import { Shield, Settings, Package, MessageSquare, Store } from 'lucide-react'
import { SiteSettingsTab } from './components/SiteSettingsTab'
import { ProductsManagementTab } from './components/ProductsManagementTab'
import { BotManagementTab } from './components/BotManagementTab'
import { CreateStoreTab } from './components/CreateStoreTab'

type TabType = 'settings' | 'products' | 'bot' | 'create-store'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('settings')
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent flex items-center gap-3">
          <Shield className="w-10 h-10" />
          Administrator paneli
        </h1>

        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <Settings className="w-5 h-5" />
            Sayt sozlamalari
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <Package className="w-5 h-5" />
            Mahsulotlarni boshqarish
          </button>
          <button
            onClick={() => setActiveTab('bot')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'bot'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Botni boshqarish
          </button>
          <button
            onClick={() => setActiveTab('create-store')}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'create-store'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <Store className="w-5 h-5" />
            Do'kon yaratish
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {activeTab === 'settings' && <SiteSettingsTab />}
          {activeTab === 'products' && <ProductsManagementTab />}
          {activeTab === 'bot' && <BotManagementTab />}
          {activeTab === 'create-store' && <CreateStoreTab />}
        </div>
      </div>
    </div>
  )
}
