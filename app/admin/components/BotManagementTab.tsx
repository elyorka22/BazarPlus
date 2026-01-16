'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Edit, Save, MessageSquare } from 'lucide-react'

interface BotSetting {
  id: string
  key: string
  value: string
  description: string | null
}

interface BotButton {
  id: string
  text: string
  action: string | null
  order_index: number
  is_active: boolean
}

interface ButtonResponse {
  buttonText: string
  responseText: string
  buttonKey: 'site_about' | 'become_seller'
}

export function BotManagementTab() {
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [botButtons, setBotButtons] = useState<BotButton[]>([])
  const [loading, setLoading] = useState(true)
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [editingResponse, setEditingResponse] = useState<ButtonResponse | null>(null)
  const [responseText, setResponseText] = useState('')
  
  // Тексты ответов для кнопок
  const [siteAboutText, setSiteAboutText] = useState('')
  const [becomeSellerTitle, setBecomeSellerTitle] = useState('')
  const [becomeSellerContent, setBecomeSellerContent] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClient()
      
      // Load welcome message
      const { data: welcomeData } = await supabase
        .from('bot_settings')
        .select('*')
        .eq('key', 'welcome_message')
        .single()

      if (welcomeData) {
        setWelcomeMessage(welcomeData.value)
      }

      // Load bot buttons (only active buttons without store_id for main bot)
      const { data: buttonsData, error: buttonsError } = await supabase
        .from('bot_buttons')
        .select('*')
        .is('store_id', null) // Только кнопки главного бота (без store_id)
        .order('order_index', { ascending: true })

      console.log('Bot buttons data:', buttonsData)
      console.log('Bot buttons error:', buttonsError)

      if (buttonsError) {
        console.error('Error loading bot buttons:', buttonsError)
      }

      if (buttonsData) {
        setBotButtons(buttonsData)
      } else {
        setBotButtons([])
      }

      // Load site_about text (для кнопки "Sayt haqida")
      const { data: siteAboutData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'site_about')
        .single()

      if (siteAboutData) {
        setSiteAboutText(siteAboutData.value || '')
      }

      // Load become_seller_page content (для кнопки "Sotuvchi bo'lish")
      const { data: sellerPageData } = await supabase
        .from('become_seller_page')
        .select('title, content')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (sellerPageData) {
        setBecomeSellerTitle(sellerPageData.title || '')
        setBecomeSellerContent(sellerPageData.content || '')
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveWelcomeMessage() {
    try {
      const supabase = createClient()
      
      const { data: existing, error: checkError } = await supabase
        .from('bot_settings')
        .select('id')
        .eq('key', 'welcome_message')
        .single()

      console.log('Existing welcome message:', existing)
      console.log('Check error:', checkError)

      if (existing) {
        const { data, error } = await supabase
          .from('bot_settings')
          .update({ value: welcomeMessage })
          .eq('key', 'welcome_message')
          .select()

        console.log('Update result:', data)
        console.log('Update error:', error)

        if (error) {
          alert('Ошибка обновления сообщения: ' + error.message)
          return
        }
      } else {
        const { data, error } = await supabase
          .from('bot_settings')
          .insert({
            key: 'welcome_message',
            value: welcomeMessage,
            description: 'Приветственное сообщение бота',
          })
          .select()

        console.log('Insert result:', data)
        console.log('Insert error:', error)

        if (error) {
          alert('Ошибка создания сообщения: ' + error.message)
          return
        }
      }
      
      alert('Сообщение успешно сохранено!')
      loadData() // Перезагрузить данные для отображения
    } catch (error) {
      console.error('Error saving welcome message:', error)
      alert('Ошибка сохранения сообщения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
    }
  }

  function openResponseForm(button: BotButton) {
    let response: ButtonResponse | null = null
    let textToEdit = ''

    if (button.text.includes('Sayt haqida')) {
      response = {
        buttonText: button.text,
        responseText: siteAboutText,
        buttonKey: 'site_about'
      }
      textToEdit = siteAboutText
    } else if (button.text.includes('Sotuvchi')) {
      response = {
        buttonText: button.text,
        responseText: `${becomeSellerTitle}\n\n${becomeSellerContent}`,
        buttonKey: 'become_seller'
      }
      textToEdit = `${becomeSellerTitle}\n\n${becomeSellerContent}`
    }

    if (response) {
      setEditingResponse(response)
      setResponseText(textToEdit)
      setShowResponseForm(true)
    }
  }

  async function saveButtonResponse(e: React.FormEvent) {
    e.preventDefault()
    if (!editingResponse) return
    
    try {
      const supabase = createClient()
      
      if (editingResponse.buttonKey === 'site_about') {
        // Сохранить текст для кнопки "Sayt haqida"
        const { data: existing } = await supabase
          .from('site_settings')
          .select('id')
          .eq('key', 'site_about')
          .single()

        if (existing) {
          const { error } = await supabase
            .from('site_settings')
            .update({ value: responseText })
            .eq('key', 'site_about')

          if (error) {
            alert('Ошибка сохранения: ' + error.message)
            return
          }
        } else {
          const { error } = await supabase
            .from('site_settings')
            .insert({
              key: 'site_about',
              value: responseText,
              description: 'Текст ответа на кнопку "Sayt haqida"'
            })

          if (error) {
            alert('Ошибка сохранения: ' + error.message)
            return
          }
        }
      } else if (editingResponse.buttonKey === 'become_seller') {
        // Сохранить текст для кнопки "Sotuvchi bo'lish"
        // Разделить текст на title и content (первая строка - title, остальное - content)
        const lines = responseText.split('\n')
        const title = lines[0] || "Sotuvchi bo'lish"
        const content = lines.slice(1).join('\n').trim() || ''

        const { data: existing } = await supabase
          .from('become_seller_page')
          .select('id')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (existing) {
          const { error } = await supabase
            .from('become_seller_page')
            .update({ title, content })
            .eq('id', existing.id)

          if (error) {
            alert('Ошибка сохранения: ' + error.message)
            return
          }
        } else {
          const { error } = await supabase
            .from('become_seller_page')
            .insert({
              title,
              content,
              is_active: true
            })

          if (error) {
            alert('Ошибка сохранения: ' + error.message)
            return
          }
        }
      }
      
      alert('Текст ответа успешно сохранен!')
      setShowResponseForm(false)
      loadData()
    } catch (error) {
      console.error('Error saving button response:', error)
      alert('Ошибка сохранения: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'))
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
      {/* Welcome Message */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Приветственное сообщение
        </h2>
        <div className="space-y-4">
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border rounded-lg"
            placeholder="Введите приветственное сообщение для бота..."
          />
          <button
            onClick={saveWelcomeMessage}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-2 rounded-lg hover:opacity-90 transition flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Сохранить сообщение
          </button>
        </div>
      </div>

      {/* Bot Buttons Responses */}
      <div className="border-t pt-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Ответы на кнопки бота</h2>
          <p className="text-sm text-gray-500 mt-1">Измените текст сообщений, которые пользователи получают при нажатии на кнопки</p>
        </div>

        <div className="space-y-3">
          {botButtons.map((button) => (
            <div key={button.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold">{button.text}</span>
                  <span className={`px-2 py-1 rounded text-xs ${button.is_active ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'}`}>
                    {button.is_active ? 'Активна' : 'Неактивна'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {button.text.includes('Sayt haqida') 
                    ? `Текущий ответ: ${siteAboutText.substring(0, 50)}${siteAboutText.length > 50 ? '...' : ''}`
                    : button.text.includes('Sotuvchi')
                    ? `Текущий ответ: ${becomeSellerTitle || 'Не задано'}`
                    : 'Нажмите "Изменить ответ" для просмотра'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openResponseForm(button)}
                  className="bg-secondary-500 text-white px-3 py-1 rounded text-sm hover:opacity-90"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Изменить ответ
                </button>
              </div>
            </div>
          ))}
        </div>

        {botButtons.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Кнопки бота не найдены в базе данных. Примените миграцию 014_create_default_bot_buttons.sql
          </div>
        )}
      </div>

      {/* Форма редактирования ответа на кнопку */}
      {showResponseForm && editingResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">Изменить ответ на кнопку: {editingResponse.buttonText}</h3>
            <form onSubmit={saveButtonResponse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Текст ответа *
                  {editingResponse.buttonKey === 'become_seller' && (
                    <span className="text-xs text-gray-500 ml-2">(Первая строка - заголовок, остальное - содержание)</span>
                  )}
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  required
                  rows={10}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={
                    editingResponse.buttonKey === 'site_about'
                      ? 'Введите текст ответа на кнопку "Sayt haqida"...'
                      : 'Введите заголовок на первой строке, затем содержание...'
                  }
                />
                {editingResponse.buttonKey === 'become_seller' && (
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Совет: Первая строка будет использована как заголовок, остальной текст - как содержание сообщения
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 rounded-lg font-semibold hover:opacity-90">
                  <Save className="w-4 h-4 inline mr-2" />
                  Сохранить
                </button>
                <button type="button" onClick={() => setShowResponseForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300">
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

