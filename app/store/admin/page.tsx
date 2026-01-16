'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { BarChart3, ShoppingBag, MessageSquare } from 'lucide-react'
import { StatisticsTab } from '../components/StatisticsTab'
import { OrdersManagementTab } from '../components/OrdersManagementTab'
import { StoreBotManagementTab } from '../components/StoreBotManagementTab'

type TabType = 'statistics' | 'orders' | 'bot'

export default function StoreAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('statistics')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Navbar />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
          <span className="hidden sm:inline">Do'kon boshqaruv paneli</span>
          <span className="sm:hidden">Do'kon paneli</span>
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
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden md:inline">Buyurtmalarni boshqarish</span>
            <span className="hidden sm:inline md:hidden">Buyurtmalar</span>
            <span className="sm:hidden">Buy</span>
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
        </div>

        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6">
          {activeTab === 'statistics' && <StatisticsTab />}
          {activeTab === 'orders' && <OrdersManagementTab />}
          {activeTab === 'bot' && <StoreBotManagementTab />}
        </div>
      </div>
    </div>
  )
}

