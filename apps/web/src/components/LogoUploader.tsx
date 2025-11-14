import { useState, useRef, useCallback } from 'react'
import { Upload, Link as LinkIcon, Clipboard, X } from 'lucide-react'

interface LogoUploaderProps {
  onImageSelected: (imageData: string, source: 'file' | 'paste' | 'url') => void
  onClose: () => void
  currentPrompt: string
}

export function LogoUploader({ onImageSelected, onClose, currentPrompt }: LogoUploaderProps) {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const convertToDataURL = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }, [])

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const dataURL = await convertToDataURL(file)
      onImageSelected(dataURL, 'file')
    } catch (err) {
      setError('Failed to load image')
    } finally {
      setIsLoading(false)
    }
  }, [convertToDataURL, onImageSelected])

  const handlePaste = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const clipboardItems = await navigator.clipboard.read()
      
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            const file = new File([blob], 'pasted-image.png', { type })
            const dataURL = await convertToDataURL(file)
            onImageSelected(dataURL, 'paste')
            return
          }
        }
      }
      
      setError('No image found in clipboard')
    } catch (err) {
      setError('Failed to paste image. Please grant clipboard permission.')
    } finally {
      setIsLoading(false)
    }
  }, [convertToDataURL, onImageSelected])

  const handleUrlLoad = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch image and convert to data URL
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch image')
      
      const blob = await response.blob()
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to an image')
      }

      const file = new File([blob], 'url-image.png', { type: blob.type })
      const dataURL = await convertToDataURL(file)
      onImageSelected(dataURL, 'url')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load image from URL')
    } finally {
      setIsLoading(false)
    }
  }, [url, convertToDataURL, onImageSelected])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Upload Logo
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose how to add your logo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Prompt for AI generation:
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            "{currentPrompt}"
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Use this prompt with ChatGPT DALL-E 3, Leonardo.ai, or another AI image generator
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Click to browse files
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Supports PNG, JPG, SVG, WebP
              </p>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          <button
            onClick={handlePaste}
            disabled={isLoading}
            className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            <Clipboard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Paste from Clipboard
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Paste an image you copied (Cmd/Ctrl+V)
              </p>
            </div>
          </button>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Or load from URL:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlLoad()}
                />
              </div>
              <button
                onClick={handleUrlLoad}
                disabled={isLoading || !url.trim()}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load
              </button>
            </div>
          </div>
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          {isLoading && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">Loading image...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

