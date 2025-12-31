import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react'

export type HapticPattern = 'success' | 'warning' | 'danger' | 'none'
export type VoiceMode = 'navigation' | 'art' | 'music' | 'error' | 'default'
export type SentimentTag = 'calm' | 'warm' | 'apologetic' | 'firm' | 'expressive'

interface VoiceModeContextType {
  isVoiceModeEnabled: boolean
  isWakeWordActive: boolean
  toggleVoiceMode: () => void
  speak: (text: string, mode?: VoiceMode, sentiment?: SentimentTag, force?: boolean) => void
  stopSpeaking: () => void
  triggerHaptic: (pattern: HapticPattern) => void
  startWakeWordDetection: () => void
  stopWakeWordDetection: () => void
}

const VoiceModeContext = createContext<VoiceModeContextType | undefined>(undefined)

const WAKE_WORD_VARIANTS = [
  'hey companion',
  'pay companion', 
  'say companion',
  'hey company',
  'companion',
]

const AVAILABLE_FEATURES = [
  { number: 1, name: 'Voice to Art', page: 'voice-to-art', keywords: ['voice to art', 'art', 'create art'] },
  { number: 2, name: 'Image to Voice', page: 'image-to-voice', keywords: ['image to voice', 'describe image'] },
  { number: 3, name: 'Script to Music', page: 'script-to-music', keywords: ['script to music', 'music'] },
  { number: 4, name: 'Real-Time Guidance', page: 'real-time-guidance', keywords: ['real-time guidance', 'guidance'] },
  { number: 5, name: 'Voice Guided Shopping', page: 'voice-guided-shopping', keywords: ['shopping', 'shop'] },
  { number: 6, name: 'Language Learning', page: 'learning', keywords: ['language learning', 'learning'] },
]

interface VoiceModeProviderProps {
  children: ReactNode
  onNavigate?: (page: string) => void
  currentPage?: string
}

export const VoiceModeProvider: React.FC<VoiceModeProviderProps> = ({ children, onNavigate, currentPage }) => {
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(false)
  const [isWakeWordActive, setIsWakeWordActive] = useState(false)
  
  // Use refs to avoid stale closures
  const isEnabledRef = useRef(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isProcessingRef = useRef(false)
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousPageRef = useRef<string | undefined>(undefined)

  // Sync ref with state
  useEffect(() => {
    isEnabledRef.current = isVoiceModeEnabled
  }, [isVoiceModeEnabled])

  // Don't auto-enable from localStorage - let user choose each session
  // Voice mode starts disabled by default
  useEffect(() => {
    // Clear any saved preference so it always starts disabled
    localStorage.removeItem('voicecompanion:voice_mode_enabled')
  }, [])

  const speak = useCallback((text: string, mode: VoiceMode = 'default', sentiment?: SentimentTag, force?: boolean) => {
    if (!isEnabledRef.current && !force) return
    
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel()
  }, [])

  const triggerHaptic = useCallback((pattern: HapticPattern) => {
    if ('vibrate' in navigator) {
      const patterns: { [key in HapticPattern]: number[] } = {
        success: [100],
        warning: [100, 50, 100],
        danger: [200, 100, 200],
        none: [],
      }
      navigator.vibrate(patterns[pattern])
    }
  }, [])

  const handleCommand = useCallback((command: string) => {
    const lowerCommand = command.toLowerCase().trim()
    console.log('🎯 Processing command:', lowerCommand)

    // Help command
    if (lowerCommand.includes('help')) {
      const features = AVAILABLE_FEATURES.map(f => `${f.number}, ${f.name}`).join('. ')
      speak(`Available features: ${features}. Say Hey Companion followed by the feature name or number.`, 'default', 'warm', true)
      return
    }

    // Go back / home
    if (lowerCommand.includes('go back') || lowerCommand.includes('go home') || lowerCommand.includes('home')) {
      speak('Going home', 'default', 'calm', true)
      onNavigate?.('home')
      return
    }

    // Disable voice mode
    if (lowerCommand.includes('disable') || lowerCommand.includes('turn off') || lowerCommand.includes('stop voice')) {
      speak('Voice mode disabled', 'default', 'calm', true)
      setTimeout(() => {
        setIsVoiceModeEnabled(false)
        isEnabledRef.current = false
        localStorage.setItem('voicecompanion:voice_mode_enabled', 'false')
      }, 500)
      return
    }

    // Number commands
    const wordToNumber: { [key: string]: number } = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6,
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    }

    for (const [word, num] of Object.entries(wordToNumber)) {
      if (lowerCommand.includes(word) || lowerCommand.includes(`number ${word}`)) {
        const feature = AVAILABLE_FEATURES.find(f => f.number === num)
        if (feature) {
          speak(`Opening ${feature.name}`, 'default', 'warm', true)
          onNavigate?.(feature.page)
          return
        }
      }
    }

    // Feature name commands
    for (const feature of AVAILABLE_FEATURES) {
      if (feature.keywords.some(kw => lowerCommand.includes(kw))) {
        speak(`Opening ${feature.name}`, 'default', 'warm', true)
        onNavigate?.(feature.page)
        return
      }
    }

    // Unknown command
    speak("I didn't understand. Say Hey Companion help for options.", 'default', 'calm', true)
  }, [onNavigate, speak])

  const startWakeWordDetection = useCallback(() => {
    if (!isEnabledRef.current) return
    if (recognitionRef.current) return // Already running

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      speak('Speech recognition not supported in this browser.', 'error', 'apologetic', true)
      return
    }

    console.log('🎤 Starting speech recognition...')
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    recognition.onstart = () => {
      console.log('✅ Speech recognition started')
      setIsWakeWordActive(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isProcessingRef.current) return

      const lastResult = event.results[event.results.length - 1]
      if (!lastResult.isFinal) return

      const transcript = lastResult[0].transcript.toLowerCase().trim()
      console.log('🗣️ Heard:', transcript)

      // Check for wake word
      const hasWakeWord = WAKE_WORD_VARIANTS.some(v => transcript.includes(v))
      if (!hasWakeWord) return

      // Extract command after wake word
      let command = transcript
      for (const variant of WAKE_WORD_VARIANTS) {
        const idx = transcript.indexOf(variant)
        if (idx !== -1) {
          command = transcript.substring(idx + variant.length).trim()
          break
        }
      }

      if (command.length > 0) {
        isProcessingRef.current = true
        handleCommand(command)
        setTimeout(() => {
          isProcessingRef.current = false
        }, 2000)
      }
    }

    recognition.onerror = (event: any) => {
      console.log('⚠️ Recognition error:', event.error)
      if (event.error === 'not-allowed') {
        speak('Microphone permission denied.', 'error', 'apologetic', true)
        setIsVoiceModeEnabled(false)
        isEnabledRef.current = false
      }
    }

    recognition.onend = () => {
      console.log('🔚 Speech recognition ended')
      setIsWakeWordActive(false)
      recognitionRef.current = null

      // Restart if still enabled
      if (isEnabledRef.current && !isProcessingRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current)
        restartTimeoutRef.current = setTimeout(() => {
          if (isEnabledRef.current) {
            console.log('🔄 Restarting recognition...')
            startWakeWordDetection()
          }
        }, 500)
      }
    }

    try {
      recognition.start()
    } catch (e) {
      console.error('Failed to start recognition:', e)
    }
  }, [handleCommand, speak])

  const stopWakeWordDetection = useCallback(() => {
    console.log('🛑 Stopping speech recognition')
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null // Prevent restart
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null
    }
    setIsWakeWordActive(false)
  }, [])

  const toggleVoiceMode = useCallback(() => {
    const newValue = !isVoiceModeEnabled
    setIsVoiceModeEnabled(newValue)
    isEnabledRef.current = newValue
    localStorage.setItem('voicecompanion:voice_mode_enabled', newValue.toString())

    if (newValue) {
      speak('Voice mode enabled. Say Hey Companion followed by your command.', 'default', 'warm', true)
      setTimeout(() => {
        startWakeWordDetection()
      }, 2000)
    } else {
      stopWakeWordDetection()
      stopSpeaking()
    }
  }, [isVoiceModeEnabled, speak, startWakeWordDetection, stopWakeWordDetection, stopSpeaking])

  // Auto-start when enabled
  useEffect(() => {
    if (isVoiceModeEnabled) {
      const timer = setTimeout(() => {
        if (isEnabledRef.current && !recognitionRef.current) {
          startWakeWordDetection()
        }
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      stopWakeWordDetection()
    }
  }, [isVoiceModeEnabled, startWakeWordDetection, stopWakeWordDetection])

  // Announce page changes with options
  useEffect(() => {
    // Only announce if page actually changed and voice mode is enabled
    if (currentPage && currentPage !== previousPageRef.current && isEnabledRef.current) {
      console.log('📍 Page changed from', previousPageRef.current, 'to', currentPage)
      previousPageRef.current = currentPage
      
      const pageAnnouncements: { [key: string]: string } = {
        'home': 'Home page. Say Hey Companion followed by a feature name or number. Say Hey Companion help for the full list.',
        'voice-to-art': 'Voice to Art. Describe what you want to create and click Generate. Say Hey Companion go back to return home.',
        'image-to-voice': 'Image to Voice. Upload or capture an image to hear a description. Say Hey Companion go back to return home.',
        'script-to-music': 'Script to Music. Enter a music prompt and generate your song. Say Hey Companion go back to return home.',
        'real-time-guidance': 'Real-Time Guidance. Start the camera to receive live navigation assistance. Say Hey Companion go back to return home.',
        'voice-guided-shopping': 'Voice Guided Shopping. Point your camera at products to identify them. Say Hey Companion go back to return home.',
        'learning': 'Language Learning. Select a language, difficulty, and scenario to practice. Say Hey Companion go back to return home.',
        'about': 'About page. Learn about VoiceCompanion. Say Hey Companion go back to return home.',
      }
      
      const announcement = pageAnnouncements[currentPage]
      if (announcement) {
        // Wait for any current speech to finish, then announce
        window.speechSynthesis.cancel()
        setTimeout(() => {
          if (isEnabledRef.current) {
            console.log('🔊 Announcing:', announcement)
            const utterance = new SpeechSynthesisUtterance(announcement)
            utterance.rate = 0.9
            utterance.pitch = 1.0
            window.speechSynthesis.speak(utterance)
          }
        }, 1000)
      }
    } else if (currentPage) {
      // Just update the ref without announcing (initial load or voice mode disabled)
      previousPageRef.current = currentPage
    }
  }, [currentPage])

  return (
    <VoiceModeContext.Provider
      value={{
        isVoiceModeEnabled,
        isWakeWordActive,
        toggleVoiceMode,
        speak,
        stopSpeaking,
        triggerHaptic,
        startWakeWordDetection,
        stopWakeWordDetection,
      }}
    >
      {children}
    </VoiceModeContext.Provider>
  )
}

export const useVoiceMode = (): VoiceModeContextType => {
  const context = useContext(VoiceModeContext)
  if (!context) {
    throw new Error('useVoiceMode must be used within a VoiceModeProvider')
  }
  return context
}
