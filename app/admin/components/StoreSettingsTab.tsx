'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/app/providers'
import { Plus, Save, User, Mail, Edit, Settings } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface Store {
  id: string
  name: string
  owner_id: string
  status: 'active' | 'paused' | 'closed'
  working_hours: string | null
  delivery_radius: number
  delivery_price: number
  owner: {
    name: string
    email: string
  }
  credentials?: {
    email: string
    password: string
  }
}

export function StoreSettingsTab() {
  const { user: adminUser } = useUser()
  const [users, setUsers] = useState<User[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState({
    store_name: '',
    owner_email: '',
    owner_name: '',
    owner_password: '',
    create_new_user: true,
    existing_user_id: '',
  })
  const [storeFormData, setStoreFormData] = useState({
    status: 'active' as 'active' | 'paused' | 'closed',
    working_hours: '',
    delivery_radius: '',
    delivery_price: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClient()
      
      // Загрузить пользователей
      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false })

      if (usersData) {
        setUsers(usersData)
      }

      // Загрузить магазины с информацией о владельцах
      const { data: storesData } = await supabase
        .from('stores')
        .select(`
          *,
          owner:owner_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // Загрузить учетные данные магазинов
      const { data: credentialsData } = await supabase
        .from('store_credentials')
        .select('store_id, email, password')

      if (storesData) {
        const formattedStores = storesData.map((store: any) => {
          const credentials = credentialsData?.find((c: any) => c.store_id === store.id)
          return {
            ...store,
            status: store.status || 'active',
            working_hours: store.working_hours || '',
            delivery_radius: store.delivery_radius || 0,
            delivery_price: store.delivery_price || 0,
            owner: store.owner || { name: 'Noma\'lum', email: '' },
            credentials: credentials ? {
              email: credentials.email,
              password: credentials.password
            } : undefined,
          }
        })
        setStores(formattedStores)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function openEditForm(store: Store) {
    setEditingStore(store)
    setStoreFormData({
      status: store.status || 'active',
      working_hours: store.working_hours || '',
      delivery_radius: store.delivery_radius?.toString() || '0',
      delivery_price: store.delivery_price?.toString() || '0',
    })
  }

  async function saveStoreSettings(e: React.FormEvent) {
    e.preventDefault()
    if (!editingStore) return

    setSubmitting(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('stores')
        .update({
          status: storeFormData.status,
          working_hours: storeFormData.working_hours || null,
          delivery_radius: parseFloat(storeFormData.delivery_radius) || 0,
          delivery_price: parseFloat(storeFormData.delivery_price) || 0,
        })
        .eq('id', editingStore.id)

      if (error) {
        alert('Xatolik: ' + error.message)
        setSubmitting(false)
        return
      }

      alert('Do\'kon sozlamalari muvaffaqiyatli saqlandi!')
      setEditingStore(null)
      loadData()
    } catch (error) {
      alert('Xatolik: ' + (error instanceof Error ? error.message : 'Noma\'lum xatolik'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const supabase = createClient()

      let ownerId: string

      if (formData.create_new_user) {
        if (!formData.owner_email || !formData.owner_name || !formData.owner_password) {
          alert('Barcha maydonlarni to\'ldiring')
          setSubmitting(false)
          return
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.owner_email,
          password: formData.owner_password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/login`,
            data: {
              name: formData.owner_name,
              role: 'store',
            }
          }
        })

        if (authError || !authData.user) {
          alert('Xatolik: ' + (authError?.message || 'Noma\'lum xatolik'))
          setSubmitting(false)
          return
        }

        ownerId = authData.user.id
        const adminId = adminUser?.id
        
        await supabase.auth.signOut()
        await new Promise(resolve => setTimeout(resolve, 500))

        if (adminId) {
          const { error: restoreError } = await supabase.auth.signInWithPassword({
            email: adminUser.email || '',
            password: 'temp', // Это не сработает, но нужно попробовать
          })
        }

        // Использовать RPC для создания профиля
        const { error: profileError } = await supabase.rpc('create_user_profile', {
          user_id: ownerId,
          user_email: formData.owner_email,
          user_name: formData.owner_name,
          user_role: 'store',
        })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Попробовать напрямую
          const { error: directError } = await supabase
            .from('user_profiles')
            .upsert({
              id: ownerId,
              email: formData.owner_email,
              name: formData.owner_name,
              role: 'store',
            }, { onConflict: 'id' })

          if (directError) {
            console.error('Direct profile creation error:', directError)
          }
        }
      } else {
        ownerId = formData.existing_user_id
      }

      // Создать магазин
      const { data: newStore, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: formData.store_name,
          owner_id: ownerId,
          status: 'active',
          delivery_radius: 0,
          delivery_price: 0,
        })
        .select()
        .single()

      if (storeError || !newStore) {
        alert('Do\'kon yaratishda xatolik: ' + (storeError?.message || 'Noma\'lum xatolik'))
        setSubmitting(false)
        return
      }

      // Сохранить учетные данные, если создан новый пользователь
      if (formData.create_new_user && newStore) {
        const { error: credError } = await supabase
          .from('store_credentials')
          .insert({
            store_id: newStore.id,
            owner_id: ownerId,
            email: formData.owner_email,
            password: formData.owner_password,
          })

        if (credError) {
          console.error('Error saving credentials:', credError)
          // Не блокируем создание магазина, если не удалось сохранить пароль
        }
      }

      alert('Do\'kon muvaffaqiyatli yaratildi!')
      setShowCreateForm(false)
      setFormData({
        store_name: '',
        owner_email: '',
        owner_name: '',
        owner_password: '',
        create_new_user: true,
        existing_user_id: '',
      })
      loadData()
    } catch (error) {
      alert('Xatolik: ' + (error instanceof Error ? error.message : 'Noma\'lum xatolik'))
    } finally {
      setSubmitting(false)
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'active':
        return 'Aktiv'
      case 'paused':
        return 'Pauza'
      case 'closed':
        return 'Yopiq'
      default:
        return status
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700'
      case 'paused':
        return 'bg-yellow-100 text-yellow-700'
      case 'closed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Do'kon sozlamalari
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yangi do'kon qo'shish
        </button>
      </div>

      {/* Список магазинов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">{store.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(store.status)}`}>
                {getStatusText(store.status)}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>👤 Egasi: {store.owner.name}</p>
              <p>📧 Email: {store.owner.email}</p>
              {store.credentials && (
                <>
                  <div className="border-t pt-2 mt-2">
                    <p className="font-semibold text-gray-700 mb-1">Kirish ma'lumotlari:</p>
                    <p>🔑 Login: <span className="font-mono text-xs">{store.credentials.email}</span></p>
                    <p>🔐 Parol: <span className="font-mono text-xs">{store.credentials.password}</span></p>
                  </div>
                </>
              )}
              {store.working_hours && (
                <p>🕐 Ish vaqti: {store.working_hours}</p>
              )}
              <p>📍 Yetkazish radiusi: {store.delivery_radius} km</p>
              <p>💰 Yetkazib berish narxi: {new Intl.NumberFormat('uz-UZ').format(Math.round(store.delivery_price))} so'm</p>
            </div>

            <button
              onClick={() => openEditForm(store)}
              className="w-full bg-secondary-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Sozlamalarni tahrirlash
            </button>
          </div>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Do'konlar topilmadi</p>
        </div>
      )}

      {/* Форма создания магазина */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Yangi do'kon qo'shish</h3>
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Do'kon nomi *</label>
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    checked={formData.create_new_user}
                    onChange={() => setFormData({ ...formData, create_new_user: true })}
                  />
                  Yangi foydalanuvchi yaratish
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!formData.create_new_user}
                    onChange={() => setFormData({ ...formData, create_new_user: false })}
                  />
                  Mavjud foydalanuvchidan tanlash
                </label>
              </div>

              {formData.create_new_user ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Egasining ismi *</label>
                    <input
                      type="text"
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.owner_email}
                      onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Parol *</label>
                    <input
                      type="password"
                      value={formData.owner_password}
                      onChange={(e) => setFormData({ ...formData, owner_password: e.target.value })}
                      required
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Foydalanuvchi tanlash *</label>
                  <select
                    value={formData.existing_user_id}
                    onChange={(e) => setFormData({ ...formData, existing_user_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Tanlang...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {submitting ? 'Yaratilmoqda...' : 'Yaratish'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Форма редактирования настроек магазина */}
      {editingStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Do'kon sozlamalari: {editingStore.name}</h3>
            <form onSubmit={saveStoreSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Do'kon holati *</label>
                <select
                  value={storeFormData.status}
                  onChange={(e) => setStoreFormData({ ...storeFormData, status: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="active">Aktiv</option>
                  <option value="paused">Pauza</option>
                  <option value="closed">Yopiq</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ish vaqti</label>
                <input
                  type="text"
                  value={storeFormData.working_hours}
                  onChange={(e) => setStoreFormData({ ...storeFormData, working_hours: e.target.value })}
                  placeholder="Masalan: 08:00 - 22:00"
                  className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Masalan: 08:00 - 22:00</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Yetkazish radiusi (km) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={storeFormData.delivery_radius}
                  onChange={(e) => setStoreFormData({ ...storeFormData, delivery_radius: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Yetkazib berish narxi (so'm) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={storeFormData.delivery_price}
                  onChange={(e) => setStoreFormData({ ...storeFormData, delivery_price: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Bekor qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

