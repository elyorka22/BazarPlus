'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/Navbar'
import { useRouter } from 'next/navigation'

interface CartItem {
  product: any
  quantity: number
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadCart()
  }, [])

  async function loadCart() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Load from database for authenticated users
        const { data } = await supabase
          .from('cart_items')
          .select(`
            *,
            products (*)
          `)
          .eq('user_id', user.id)

        if (data) {
          const items = data.map((item: any) => ({
            product: item.products,
            quantity: item.quantity,
          }))
          setCart(items)
        }
        setIsGuest(false)
      } else {
        // Load from localStorage for guest users
        const savedCart = localStorage.getItem('guest_cart')
        if (savedCart) {
          try {
            const cartData = JSON.parse(savedCart)
            const items = cartData.map((item: any) => ({
              product: item.product,
              quantity: item.quantity,
            }))
            setCart(items)
            setIsGuest(true)
          } catch (e) {
            console.error('Error loading cart from localStorage', e)
          }
        } else {
          // No cart found, redirect to catalog
          router.push('/client')
          return
        }
      }
    } catch (error) {
      // If Supabase is not configured, use localStorage
      const savedCart = localStorage.getItem('guest_cart')
      if (savedCart) {
        try {
          const cartData = JSON.parse(savedCart)
          const items = cartData.map((item: any) => ({
            product: item.product,
            quantity: item.quantity,
          }))
          setCart(items)
          setIsGuest(true)
        } catch (e) {
          console.error('Error loading cart', e)
        }
      } else {
        router.push('/client')
        return
      }
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

      const orderData: any = {
        total_amount: total,
        status: 'pending',
        delivery_address: address,
        phone: phone,
      }

      if (user) {
        // Authenticated user
        orderData.user_id = user.id
      } else {
        // Guest user
        if (!name || !email) {
          alert('Iltimos, barcha maydonlarni to\'ldiring')
          setSubmitting(false)
          return
        }
        orderData.guest_name = name
        orderData.guest_email = email
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError || !order) {
        alert('Buyurtma yaratishda xatolik: ' + (orderError?.message || 'Noma\'lum xatolik'))
        setSubmitting(false)
        return
      }

      for (const item of cart) {
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })

        await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id)
      }

      // Отправить уведомление магазинам через API (не блокируем создание заказа)
      fetch('/api/notify-stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: order.id }),
      }).catch((error) => {
        console.error('Error sending notification:', error)
        // Не блокируем создание заказа, если уведомление не отправилось
      })

      if (user) {
        // Clear database cart for authenticated users
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
        router.push('/client/orders')
      } else {
        // Clear localStorage cart for guest users
        localStorage.removeItem('guest_cart')
        router.push('/client/order-success')
      }
    } catch (error) {
      alert('Buyurtma yaratishda xatolik. Qayta urinib ko\'ring.')
      setSubmitting(false)
    }
  }

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-xl text-gray-600 mb-4">Savat bo'sh</p>
          <a href="/client" className="text-primary-600 hover:text-primary-700">
            Katalogga qaytish
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
            Buyurtma berish
          </h1>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Buyurtmadagi mahsulotlar</h2>
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center border-b pb-3">
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × {item.product.price} so'm
                    </p>
                  </div>
                  <p className="font-bold">{item.product.price * item.quantity} so'm</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="text-xl font-bold">Итого:</span>
              <span className="text-2xl font-bold text-primary-600">{total} so'm</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Yetkazib berish ma'lumotlari</h2>
            
            <div className="space-y-4">
              {isGuest && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ism <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ismingiz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yetkazib berish manzili <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Shahar, ko'cha, uy, kvartira"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+998 (90) 123-45-67"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Jarayonda...' : 'Buyurtmani tasdiqlash'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

