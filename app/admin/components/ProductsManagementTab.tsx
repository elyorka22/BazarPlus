'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { ImageUpload } from '@/components/ImageUpload'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image_url: string | null
  store_id: string
  is_active: boolean
  package_type: string | null
  min_order: number | null
  max_order: number | null
  badge: string | null
  sale_type: string
  stores: {
    name: string
  }
}

export function ProductsManagementTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: '',
    store_id: '',
    category_id: '',
    is_active: true,
    package_type: '',
    min_order: '',
    max_order: '',
    badge: '',
    sale_type: 'by_piece',
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.stores?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products)
    }
  }, [searchTerm, products])

  async function loadData() {
    try {
      const supabase = createClient()
      
      // Загрузить все товары (включая неактивные) для админа
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          stores:store_id (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (productsError) {
        console.error('Error loading products:', productsError)
        alert('Ошибка загрузки товаров: ' + productsError.message)
      } else if (productsData) {
        setProducts(productsData as Product[])
        setFilteredProducts(productsData as Product[])
      }

      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name')

      if (storesError) {
        console.error('Error loading stores:', storesError)
      } else if (storesData) {
        setStores(storesData)
      }

      // Загрузить категории
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('product_categories')
        .select('id, name')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError)
      } else if (categoriesData) {
        setCategories(categoriesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function openForm(product?: Product) {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        image_url: product.image_url || '',
        store_id: product.store_id,
        category_id: (product as any).category_id || '',
        is_active: product.is_active,
        package_type: product.package_type || '',
        min_order: product.min_order?.toString() || '1',
        max_order: product.max_order?.toString() || '',
        badge: product.badge || '',
        sale_type: product.sale_type || 'by_piece',
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        image_url: '',
        store_id: stores[0]?.id || '',
        category_id: '',
        is_active: true,
        package_type: '',
        min_order: '1',
        max_order: '',
        badge: '',
        sale_type: 'by_piece',
      })
    }
    setShowForm(true)
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = createClient()
      
      // Убедиться, что image_url не пустая строка, а null если нет изображения
      const imageUrl = formData.image_url && formData.image_url.trim() !== '' 
        ? formData.image_url.trim() 
        : null
      
      console.log('Form data image_url:', formData.image_url)
      console.log('Processed imageUrl:', imageUrl)
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        image_url: imageUrl,
        store_id: formData.store_id,
        category_id: formData.category_id || null,
        is_active: formData.is_active,
        package_type: formData.package_type || null,
        min_order: formData.min_order ? parseFloat(formData.min_order) : 1,
        max_order: formData.max_order ? parseFloat(formData.max_order) : null,
        badge: formData.badge || null,
        sale_type: formData.sale_type,
      }

      console.log('Saving product with data:', productData)
      console.log('Product data image_url:', productData.image_url)

      if (editingProduct) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()

        if (error) {
          alert('Ошибка обновления товара: ' + error.message)
          console.error('Update error:', error)
          setSubmitting(false)
          return
        }
        
        console.log('Product updated:', data)
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()

        if (error) {
          alert('Ошибка создания товара: ' + error.message)
          console.error('Insert error:', error)
          setSubmitting(false)
          return
        }
        
        console.log('Product created:', data)
        if (data && data[0]) {
          console.log('Created product image_url:', data[0].image_url)
        }
      }
      
      setShowForm(false)
      loadData()
      alert('Товар успешно сохранен!')
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Ошибка сохранения товара: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Удалить товар?')) return
    try {
      const supabase = createClient()
      await supabase.from('products').delete().eq('id', id)
      loadData()
    } catch (error) {
      alert('Ошибка удаления товара')
    }
  }

  async function updateProductStatus(id: string, isActive: boolean) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', id)

      if (error) {
        alert('Ошибка обновления статуса: ' + error.message)
        loadData() // Перезагрузить данные в случае ошибки
        return
      }

      // Обновить локальное состояние
      setProducts(products.map(p => p.id === id ? { ...p, is_active: isActive } : p))
      setFilteredProducts(filteredProducts.map(p => p.id === id ? { ...p, is_active: isActive } : p))
    } catch (error) {
      alert('Ошибка обновления статуса')
      loadData()
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
        <h2 className="text-xl sm:text-2xl font-bold">Управление товарами</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border rounded-lg w-full sm:w-64 text-sm sm:text-base"
            />
          </div>
          <button
            onClick={() => openForm()}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2.5 sm:py-2 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Добавить товар</span>
            <span className="sm:hidden">Добавить</span>
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Изображение</th>
              <th className="px-4 py-3 text-left">Название</th>
              <th className="px-4 py-3 text-left">Магазин</th>
              <th className="px-4 py-3 text-left">Цена</th>
              <th className="px-4 py-3 text-left">Остаток</th>
              <th className="px-4 py-3 text-left">Статус</th>
              <th className="px-4 py-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{product.name}</div>
                  <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
                </td>
                <td className="px-4 py-3">{product.stores?.name || 'N/A'}</td>
                <td className="px-4 py-3 font-bold">{product.price} so'm</td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className="px-4 py-3">
                  <select
                    value={product.is_active ? 'active' : 'inactive'}
                    onChange={(e) => {
                      const newStatus = e.target.value === 'active'
                      updateProductStatus(product.id, newStatus)
                    }}
                    className="px-2 py-1 rounded text-xs border"
                  >
                    <option value="active">Активен</option>
                    <option value="inactive">Неактивен</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openForm(product)}
                      className="bg-secondary-500 text-white px-3 py-1 rounded text-sm hover:opacity-90"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:opacity-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex gap-3 mb-3">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-20 h-20 object-cover rounded flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📦</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description}</p>
                <p className="text-sm text-gray-600">Do'kon: {product.stores?.name || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div>
                <span className="text-gray-500">Narx:</span>
                <span className="font-bold ml-1">{product.price} so'm</span>
              </div>
              <div>
                <span className="text-gray-500">Qoldiq:</span>
                <span className="font-semibold ml-1">{product.stock}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <select
                value={product.is_active ? 'active' : 'inactive'}
                onChange={(e) => {
                  const newStatus = e.target.value === 'active'
                  updateProductStatus(product.id, newStatus)
                }}
                className="flex-1 px-2 py-2 rounded text-xs border"
              >
                <option value="active">Активен</option>
                <option value="inactive">Неактивен</option>
              </select>
              <button
                onClick={() => openForm(product)}
                className="bg-secondary-500 text-white px-3 py-2 rounded text-sm hover:opacity-90 flex items-center justify-center"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteProduct(product.id)}
                className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:opacity-90 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Товары не найдены</p>
        </div>
      )}

      {/* Форма товара */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{editingProduct ? 'Изменить' : 'Добавить'} товар</h3>
            <form onSubmit={saveProduct} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Цена (so'm) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Остаток *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <ImageUpload
                currentImage={formData.image_url}
                onImageUploadStart={() => {
                  console.log('Image upload started')
                  setImageUploading(true)
                }}
                onImageUploaded={(url) => {
                  console.log('Image uploaded, URL:', url)
                  console.log('Setting formData.image_url to:', url || '')
                  const newFormData = { ...formData, image_url: url || '' }
                  console.log('New formData:', newFormData)
                  setFormData(newFormData)
                  setImageUploading(false)
                }}
                folder="products"
                label="Mahsulot rasmi"
              />
              <div>
                <label className="block text-sm font-medium mb-2">Магазин *</label>
                <select
                  value={formData.store_id}
                  onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Категория</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Без категории</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Qanday sotiladi? *</label>
                <select
                  value={formData.sale_type}
                  onChange={(e) => setFormData({ ...formData, sale_type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="by_kg">Kg bo'yicha</option>
                  <option value="by_piece">Dona bo'yicha</option>
                  <option value="by_package">Paket bo'yicha</option>
                </select>
              </div>

              {formData.sale_type === 'by_package' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Paket turi</label>
                  <select
                    value={formData.package_type}
                    onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Tanlanmagan</option>
                    <option value="1kg">1 kg</option>
                    <option value="3kg">3 kg</option>
                    <option value="5kg">5 kg</option>
                    <option value="10kg">10 kg</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Minimal buyurtma *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_order}
                    onChange={(e) => setFormData({ ...formData, min_order: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Maksimal buyurtma</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_order}
                    onChange={(e) => setFormData({ ...formData, max_order: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="Cheksiz"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Yorliq</label>
                <select
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Yorliq yo'q</option>
                  <option value="top">Top</option>
                  <option value="discount">15%</option>
                  <option value="recommended">Tavsiya etiladi</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Aktiv
                </label>
              </div>
              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={submitting || imageUploading}
                  className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Сохранение...' : imageUploading ? 'Загрузка изображения...' : 'Сохранить'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

