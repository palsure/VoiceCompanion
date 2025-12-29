import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Speech from 'expo-speech'

interface AccessibilityContextType {
  isEnabled: boolean
  toggle: () => void
  speak: (text: string, options?: { priority?: 'high' | 'normal'; delay?: number }) => void
  stopSpeaking: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

const STORAGE_KEY = '@voicecompanion:accessibility_enabled'

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load saved preference
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        setIsEnabled(value === 'true')
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })
  }, [])

  const toggle = async () => {
    const newValue = !isEnabled
    setIsEnabled(newValue)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newValue.toString())
      // Announce the change
      if (newValue) {
        speak('Accessibility mode enabled. I will describe options and buttons as you navigate.')
      } else {
        speak('Accessibility mode disabled.')
      }
    } catch (error) {
      console.error('Failed to save accessibility preference:', error)
    }
  }

  const speak = (text: string, options?: { priority?: 'high' | 'normal'; delay?: number }) => {
    if (!isEnabled) return

    const delay = options?.delay || 0
    
    if (delay > 0) {
      setTimeout(() => {
        Speech.speak(text, {
          language: 'en',
          pitch: 1.0,
          rate: 0.9, // Slightly slower for clarity
          volume: 1.0,
        })
      }, delay)
    } else {
      Speech.speak(text, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        volume: 1.0,
      })
    }
  }

  const stopSpeaking = () => {
    Speech.stop()
  }

  if (isLoading) {
    return null // Or a loading indicator
  }

  return (
    <AccessibilityContext.Provider value={{ isEnabled, toggle, speak, stopSpeaking }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

