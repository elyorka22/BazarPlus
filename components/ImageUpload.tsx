'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { uploadImage } from '@/lib/imageUpload'

interface ImageUploadProps {
  currentImage?: string | null
  onImageUploaded: (url: string | null) => void
  onImageUploadStart?: () => void
  folder: 'products' | 'banners' | 'categories' | 'stores'
  userId?: string
  label?: string
  className?: string
}

export function ImageUpload({
  currentImage,
  onImageUploaded,
  onImageUploadStart,
  folder,
  userId,
  label = 'Rasm yuklash',
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Faqat rasm fayllari qabul qilinadi')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Rasm hajmi 5MB dan katta bo\'lmasligi kerak')
      return
    }

    setUploading(true)
    if (onImageUploadStart) {
      onImageUploadStart()
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase Storage
    const imageUrl = await uploadImage(file, folder, userId)
    
    if (imageUrl) {
      onImageUploaded(imageUrl)
    } else {
      alert('Rasm yuklashda xatolik yuz berdi')
      setPreview(currentImage || null)
    }

    setUploading(false)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleRemove() {
    setPreview(null)
    onImageUploaded(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id={`image-upload-${folder}`}
            disabled={uploading}
          />
          <label
            htmlFor={`image-upload-${folder}`}
            className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg cursor-pointer hover:opacity-90 transition ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Yuklanmoqda...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>{preview ? 'O\'zgartirish' : label}</span>
              </>
            )}
          </label>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG yoki WEBP (maks. 5MB)
          </p>
        </div>
      </div>
    </div>
  )
}

