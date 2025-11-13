import { useState, useEffect, useCallback } from 'react'
import { nanoid } from 'nanoid'
import type { Logo } from '../types/logo'

const STORAGE_KEY = 'swimto_logos'
const MAX_LOGOS = 10

/**
 * Hook for managing logo evolution state
 */
export function useLogoEvolution() {
  const [logos, setLogos] = useState<Logo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Logo[]
        setLogos(parsed)
      }
    } catch (error) {
      console.error('Failed to load logos from storage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logos))
      } catch (error) {
        console.error('Failed to save logos to storage:', error)
      }
    }
  }, [logos, isLoading])

  const initializeLogos = useCallback((seedLogos: Omit<Logo, 'id' | 'createdAt' | 'isFavorite'>[]) => {
    const initializedLogos: Logo[] = seedLogos.map((seed, index) => ({
      ...seed,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      isFavorite: false,
    })).slice(0, MAX_LOGOS)

    // Pad with empty slots if needed
    while (initializedLogos.length < MAX_LOGOS) {
      initializedLogos.push(createEmptyLogo(initializedLogos.length))
    }

    setLogos(initializedLogos)
  }, [])

  const createEmptyLogo = (index: number): Logo => ({
    id: nanoid(),
    imageData: '',
    prompt: `Logo slot ${index + 1}`,
    generation: 0,
    parentId: null,
    createdAt: new Date().toISOString(),
    isFavorite: false,
    metadata: {
      model: 'manual'
    }
  })

  const replaceLogo = useCallback((index: number, newLogoData: {
    imageData: string
    prompt: string
    model?: Logo['metadata']['model']
    iterationNotes?: string
  }) => {
    setLogos(prev => {
      const updated = [...prev]
      const oldLogo = updated[index]
      
      updated[index] = {
        id: nanoid(),
        imageData: newLogoData.imageData,
        prompt: newLogoData.prompt,
        generation: oldLogo.imageData ? oldLogo.generation + 1 : 1,
        parentId: oldLogo.imageData ? oldLogo.id : null,
        createdAt: new Date().toISOString(),
        isFavorite: false,
        metadata: {
          model: newLogoData.model || 'manual',
          iterationNotes: newLogoData.iterationNotes
        }
      }
      
      return updated
    })
  }, [])

  const updateLogo = useCallback((index: number, updates: Partial<Logo>) => {
    setLogos(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...updates }
      return updated
    })
  }, [])

  const toggleFavorite = useCallback((index: number) => {
    setLogos(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        isFavorite: !updated[index].isFavorite
      }
      return updated
    })
  }, [])

  const getLineage = useCallback((logoId: string): Logo[] => {
    const lineage: Logo[] = []
    let currentId: string | null = logoId

    while (currentId) {
      const logo = logos.find(l => l.id === currentId)
      if (!logo) break
      
      lineage.push(logo)
      currentId = logo.parentId
    }

    return lineage.reverse()
  }, [logos])

  const getFavorites = useCallback(() => {
    return logos.filter(logo => logo.isFavorite && logo.imageData)
  }, [logos])

  const clearAll = useCallback(() => {
    const emptyLogos: Logo[] = Array.from({ length: MAX_LOGOS }, (_, i) => createEmptyLogo(i))
    setLogos(emptyLogos)
  }, [])

  const exportLogos = useCallback(() => {
    const data = {
      version: '1.0.0',
      exported: new Date().toISOString(),
      logos: logos.filter(l => l.imageData)
    }
    return JSON.stringify(data, null, 2)
  }, [logos])

  const importLogos = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString)
      if (!data.logos || !Array.isArray(data.logos)) {
        throw new Error('Invalid format')
      }

      const imported: Logo[] = data.logos.slice(0, MAX_LOGOS)
      
      // Pad with empty slots if needed
      while (imported.length < MAX_LOGOS) {
        imported.push(createEmptyLogo(imported.length))
      }

      setLogos(imported)
      return true
    } catch (error) {
      console.error('Failed to import logos:', error)
      return false
    }
  }, [])

  return {
    logos,
    isLoading,
    initializeLogos,
    replaceLogo,
    updateLogo,
    toggleFavorite,
    getLineage,
    getFavorites,
    clearAll,
    exportLogos,
    importLogos,
  }
}
