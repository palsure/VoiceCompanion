import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

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

const STORAGE_KEY = '@voicecompanion:voice_mode_enabled'
const WAKE_WORD = 'hey companion'

// Common misrecognitions of the wake word
const WAKE_WORD_VARIANTS = [
  'hey companion',
  'pay companion',
  'she companion',
  'say companion',
  'hey company',
  'pay company',
  'hey comp',
  'pay comp',
  'companion',
  'hey',
]

// Function to check if text contains wake word (with variants)
const containsWakeWord = (text: string): boolean => {
  const lowerText = text.toLowerCase()
  return WAKE_WORD_VARIANTS.some(variant => lowerText.includes(variant))
}

// Function to extract command after wake word (handling variants)
const extractCommandAfterWakeWord = (text: string): string | null => {
  const lowerText = text.toLowerCase()
  
  // Try to find wake word or variant
  for (const variant of WAKE_WORD_VARIANTS) {
    const index = lowerText.indexOf(variant)
    if (index !== -1) {
      // Extract text after the wake word
      const afterWakeWord = text.substring(index + variant.length).trim()
      if (afterWakeWord.length > 0) {
        return afterWakeWord
      }
    }
  }
  
  // If no wake word found, check if it's a direct command
  const directCommands = ['help', 'open', 'go back', 'go home', 'disable', 'number', 'one', 'two', 'three', 'four', 'five', 'six']
  if (directCommands.some(cmd => lowerText.includes(cmd))) {
    return text.trim()
  }
  
  return null
}

// Available features with numbers
const AVAILABLE_FEATURES = [
  { number: 1, name: 'Voice to Art', page: 'voice-to-art', keywords: ['voice to art', 'art', 'create art', 'generate art'] },
  { number: 2, name: 'Image to Voice', page: 'image-to-voice', keywords: ['image to voice', 'describe image', 'image description'] },
  { number: 3, name: 'Script to Music', page: 'script-to-music', keywords: ['script to music', 'music', 'create music', 'generate music'] },
  { number: 4, name: 'Real-Time Guidance', page: 'real-time-guidance', keywords: ['real-time guidance', 'guidance', 'navigation', 'blind guidance'] },
  { number: 5, name: 'Voice Guided Shopping', page: 'voice-guided-shopping', keywords: ['voice guided shopping', 'shopping', 'shop'] },
  { number: 6, name: 'Language Learning', page: 'learning', keywords: ['language learning', 'learning', 'practice'] },
]

// Voice mode configurations
const VOICE_MODE_CONFIG = {
  navigation: {
    rate: 0.85,
    pitch: 1.0,
    volume: 1.0,
    sentiment: 'calm' as SentimentTag,
  },
  art: {
    rate: 0.75,
    pitch: 1.1,
    volume: 1.0,
    sentiment: 'warm' as SentimentTag,
  },
  music: {
    rate: 0.7,
    pitch: 1.15,
    volume: 1.0,
    sentiment: 'expressive' as SentimentTag,
  },
  error: {
    rate: 0.8,
    pitch: 0.9,
    volume: 1.0,
    sentiment: 'apologetic' as SentimentTag,
  },
  default: {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    sentiment: 'warm' as SentimentTag,
  },
}

interface VoiceModeProviderProps {
  children: ReactNode
  onNavigate?: (page: string) => void
  currentPage?: string // Current page for context-aware announcements
}

export const VoiceModeProvider: React.FC<VoiceModeProviderProps> = ({ children, onNavigate, currentPage }) => {
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(false)
  const [isWakeWordActive, setIsWakeWordActive] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const commandTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastListeningTimeRef = useRef<number>(0)
  const processingCommandRef = useRef<boolean>(false)
  const accumulatedTranscriptRef = useRef<string>('') // Use ref to persist across renders
  const wakeWordDetectedRef = useRef<boolean>(false)
  const commandStartTimeRef = useRef<number>(0)
  const isRecognitionStartingRef = useRef<boolean>(false) // Track if recognition is being started
  const recognitionRestartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null) // Track restart timeout

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('voicecompanion:voice_mode_enabled')
    if (saved === 'true') {
      setIsVoiceModeEnabled(true)
    }
  }, [])

  useEffect(() => {
    // Auto-start wake word detection when voice mode is enabled
    if (isVoiceModeEnabled) {
      // Small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        if (isVoiceModeEnabled) {
          startWakeWordDetection()
        }
      }, 1000)
      return () => {
        clearTimeout(timer)
        stopWakeWordDetection()
      }
    } else {
      stopWakeWordDetection()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVoiceModeEnabled])

  const toggleVoiceMode = () => {
    const newValue = !isVoiceModeEnabled
    setIsVoiceModeEnabled(newValue)
    localStorage.setItem('voicecompanion:voice_mode_enabled', newValue.toString())
    
    // Stop any current processing
    processingCommandRef.current = false
    wakeWordDetectedRef.current = false
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current)
      commandTimeoutRef.current = null
    }
    
    if (newValue) {
      // Stop any current recognition before starting new one
      stopWakeWordDetection()
      accumulatedTranscriptRef.current = '' // Reset
      
      // Simple announcement - don't read all options
      speak('Voice mode enabled. Say "Hey Companion" followed by your command. Say "Hey Companion, help" to hear all available features.', 'default', 'warm', true)
      
      // Start wake word detection after a short delay
      setTimeout(() => {
        if (isVoiceModeEnabled) {
          accumulatedTranscriptRef.current = ''
          wakeWordDetectedRef.current = false
          processingCommandRef.current = false
          console.log('🔄 Starting wake word detection...')
          startWakeWordDetection()
        }
      }, 2000) // 2 second delay to let the announcement finish
    } else {
      stopWakeWordDetection()
      stopSpeaking() // Stop any ongoing speech
      accumulatedTranscriptRef.current = '' // Reset
      // Don't speak when disabling to avoid feedback loop
      console.log('Voice mode disabled')
    }
  }

  const speak = (
    text: string,
    mode: VoiceMode = 'default',
    sentiment?: SentimentTag,
    force: boolean = false // Allow forcing speech even if voice mode is disabled (for announcements)
  ) => {
    if (!isVoiceModeEnabled && mode !== 'error' && !force) return

    const config = VOICE_MODE_CONFIG[mode]
    const finalSentiment = sentiment || config.sentiment

    let rate = config.rate
    let pitch = config.pitch

    switch (finalSentiment) {
      case 'apologetic':
        rate = 0.75
        pitch = 0.85
        break
      case 'firm':
        rate = 0.9
        pitch = 0.95
        break
      case 'expressive':
        rate = 0.7
        pitch = 1.2
        break
      case 'warm':
        rate = 0.8
        pitch = 1.1
        break
      case 'calm':
        rate = 0.85
        pitch = 1.0
        break
    }

    if (!synthesisRef.current) {
      synthesisRef.current = window.speechSynthesis
    }

    // Stop any ongoing speech first
    synthesisRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = config.volume
    utterance.lang = 'en-US'
    
    // Track when speech ends
    utterance.onend = () => {
      console.log('✅ Speech finished')
    }
    
    utterance.onerror = (event) => {
      console.error('❌ Speech synthesis error:', event)
    }

    synthesisRef.current.speak(utterance)
  }

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      try {
        synthesisRef.current.cancel()
        // Clear any pending utterances
        if (synthesisRef.current.pending) {
          synthesisRef.current.cancel()
        }
        if (synthesisRef.current.speaking) {
          synthesisRef.current.cancel()
        }
      } catch (e) {
        console.error('Error stopping speech:', e)
      }
    }
  }

  const triggerHaptic = (pattern: HapticPattern) => {
    // Web API for vibration
    if ('vibrate' in navigator) {
      const patterns = {
        success: [100],
        warning: [100, 50, 100],
        danger: [100, 50, 100, 50, 100, 50, 100],
        none: [],
      }
      const patternArray = patterns[pattern]
      if (patternArray.length > 0) {
        navigator.vibrate(patternArray)
      }
    }
  }

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop())
      console.log('Microphone permission granted')
      return true
    } catch (error: any) {
      console.error('Microphone permission error:', error)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        speak('Microphone permission denied. Please allow microphone access in your browser settings and refresh the page.', 'error', 'apologetic')
        return false
      } else if (error.name === 'NotFoundError') {
        speak('No microphone found. Please connect a microphone and try again.', 'error', 'apologetic')
        return false
      }
      return false
    }
  }

  const startWakeWordDetection = async () => {
    if (!isVoiceModeEnabled) return

    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser')
      speak('Speech recognition is not supported in your browser. Please use Chrome or Edge.', 'error', 'apologetic')
      return
    }

    // Request microphone permission first
    console.log('Requesting microphone permission...')
    const hasPermission = await requestMicrophonePermission()
    if (!hasPermission) {
      setIsVoiceModeEnabled(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    
    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore errors when stopping
      }
    }

    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true // Enable to see what's being heard
    recognitionRef.current.lang = 'en-US'
    
    let lastProcessedTranscript = ''
    let lastResultTime = 0

    recognitionRef.current.onstart = () => {
      console.log('✅ Speech recognition started successfully')
      setIsWakeWordActive(true)
      accumulatedTranscriptRef.current = '' // Reset accumulation
      processingCommandRef.current = false // Reset processing flag
      wakeWordDetectedRef.current = false
      commandStartTimeRef.current = 0
      // Don't speak on start to avoid feedback loop - user already knows it's active
      console.log('Voice mode active. Say "Hey Companion" followed by your command.')
    }

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      const now = Date.now()
      // Throttle processing to avoid too many calls
      if (now - lastResultTime < 100) {
        return
      }
      lastResultTime = now

      // Build full transcript from all results
      let fullTranscript = ''
      let hasFinalResult = false
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript
        fullTranscript += transcript + ' '
        
        if (result.isFinal) {
          hasFinalResult = true
        }
      }
      
      fullTranscript = fullTranscript.trim().toLowerCase()
      
      // Update accumulated transcript
      if (fullTranscript.length > accumulatedTranscriptRef.current.length) {
        accumulatedTranscriptRef.current = fullTranscript
      }
      
      const lastResult = event.results[event.results.length - 1]
      const lastTranscript = lastResult[0].transcript.toLowerCase().trim()
      const isFinal = lastResult.isFinal
      const confidence = lastResult[0].confidence || 0.8
      
      console.log('🎤 Voice recognition:', { 
        lastTranscript, 
        fullTranscript, 
        accumulatedTranscript: accumulatedTranscriptRef.current,
        isFinal, 
        confidence, 
        resultsLength: event.results.length,
        hasFinalResult
      })
      
      // Show interim results in console for debugging
      if (!isFinal && lastTranscript.length > 0) {
        console.log('📝 Interim (hearing):', lastTranscript, '| Full so far:', accumulatedTranscriptRef.current)
        // Don't return - continue to check for wake word in accumulated transcript
      }
      
      // Filter out common TTS phrases that might be picked up
      let filteredTranscript = accumulatedTranscriptRef.current
        .replace(/disabled voice mode active say hey companion/gi, '')
        .replace(/voice mode enabled/gi, '')
        .replace(/voice mode disabled/gi, '')
        .replace(/listening/gi, '')
        .replace(/opening/gi, '')
        .replace(/going back to home/gi, '')
        .replace(/i didn't understand/gi, '')
        // Filter out page announcement phrases
        .replace(/you are on the.*?page/gi, '')
        .replace(/you can navigate to any feature/gi, '')
        .replace(/you can describe what you want/gi, '')
        .replace(/you can upload an image/gi, '')
        .replace(/you can convert your lyrics/gi, '')
        .replace(/you can start the camera/gi, '')
        .replace(/you can identify products/gi, '')
        .replace(/you can practice languages/gi, '')
        .replace(/say hey companion open/gi, '')
        .replace(/say hey companion go back/gi, '')
        .replace(/say hey companion disable/gi, '')
        .replace(/say hey companion help/gi, '')
        .replace(/followed by the feature name or number/gi, '')
        .replace(/to return to home/gi, '')
        .replace(/to turn off voice mode/gi, '')
        .replace(/to hear all available features/gi, '')
        .replace(/for example/gi, '')
        .replace(/homepage/gi, '')
        .replace(/key companion/gi, 'hey companion') // Fix common misrecognition
        // Filter out the entire initial announcement
        .replace(/here are your available features/gi, '')
        .replace(/number one voice to art/gi, '')
        .replace(/number two image to voice/gi, '')
        .replace(/number three script to music/gi, '')
        .replace(/number four real.time guidance/gi, '')
        .replace(/number five voice guided shopping/gi, '')
        .replace(/number six language learning/gi, '')
        .replace(/to open a feature/gi, '')
        .replace(/say hey companion open followed by/gi, '')
        .replace(/the feature name or number/gi, '')
        .replace(/for example hey companion open voice to art/gi, '')
        .replace(/or hey companion open number/gi, '')
        .trim()
      
      // If transcript contains the full announcement pattern (with or without "enabled" prefix), clear it completely
      const announcementPatterns = [
        /enabled here are your available features/i,
        /voice mode enabled.*here are your available features/i,
        /here are your available features.*number (one|two|three|four|five|six)/i,
        /number (one|two|three|four|five|six).*voice to art.*number (one|two|three|four|five|six)/i, // Multiple numbers = announcement
        /to open a feature.*say hey companion/i,
        /for example.*hey companion open/i,
      ]
      
      const isAnnouncement = announcementPatterns.some(pattern => 
        filteredTranscript.match(pattern) || accumulatedTranscriptRef.current.match(pattern)
      )
      
      if (isAnnouncement) {
        console.log('🚫 Detected full announcement in transcript, clearing...', {
          filtered: filteredTranscript.substring(0, 100),
          accumulated: accumulatedTranscriptRef.current.substring(0, 100)
        })
        accumulatedTranscriptRef.current = ''
        filteredTranscript = ''
        return // Don't process this transcript
      }
      
      // Also check if transcript is mostly announcement text (more than 50% matches announcement phrases)
      const announcementPhrases = [
        'enabled', 'here are', 'your available', 'features', 'number one', 'number two', 
        'number three', 'number four', 'number five', 'number six', 'voice to art',
        'image to voice', 'script to music', 'real-time guidance', 'voice guided shopping',
        'language learning', 'to open a feature', 'say hey companion', 'for example'
      ]
      const transcriptWords = filteredTranscript.toLowerCase().split(/\s+/)
      const announcementWordCount = transcriptWords.filter(word => 
        announcementPhrases.some(phrase => word.includes(phrase.toLowerCase()) || phrase.toLowerCase().includes(word))
      ).length
      
      if (transcriptWords.length > 10 && announcementWordCount / transcriptWords.length > 0.5) {
        console.log('🚫 Detected announcement-heavy transcript (>50% announcement words), clearing...', {
          totalWords: transcriptWords.length,
          announcementWords: announcementWordCount,
          ratio: announcementWordCount / transcriptWords.length
        })
        accumulatedTranscriptRef.current = ''
        filteredTranscript = ''
        return
      }
      
      // Skip if filtered transcript is too short or just TTS noise
      if (filteredTranscript.length < 3) {
        return
      }
      
      // Check filtered transcript for wake word (even in interim results)
      // BUT: Ignore wake word if it's part of the announcement
      const isWakeWordInAnnouncement = filteredTranscript.match(/say.*hey companion|for example.*hey companion|hey companion.*open.*followed/i) ||
        accumulatedTranscriptRef.current.match(/say.*hey companion|for example.*hey companion|hey companion.*open.*followed/i)
      
      // Check for wake word or variants
      const hasWakeWord = containsWakeWord(filteredTranscript) || containsWakeWord(accumulatedTranscriptRef.current)
      
      if (hasWakeWord && !wakeWordDetectedRef.current && !processingCommandRef.current && !isWakeWordInAnnouncement) {
        console.log('🔔 Wake word detected in accumulated transcript!', {
          filteredTranscript: filteredTranscript.substring(0, 50),
          accumulated: accumulatedTranscriptRef.current.substring(0, 50)
        })
        wakeWordDetectedRef.current = true
        commandStartTimeRef.current = Date.now()
        setIsWakeWordActive(true)
        triggerHaptic('success')
        
        // Only speak "Listening" if we haven't spoken it recently (prevent repetition)
        const now = Date.now()
        if (now - lastListeningTimeRef.current > 2000) {
          speak('Listening...', 'default', 'calm')
          lastListeningTimeRef.current = now
        }
      } else if (isWakeWordInAnnouncement) {
        console.log('🚫 Ignoring wake word - it\'s part of the announcement')
        // Clear the transcript if wake word is in announcement
        accumulatedTranscriptRef.current = ''
        return
      } else if (hasWakeWord && wakeWordDetectedRef.current) {
        // Extract command after wake word from filtered transcript (handle variants)
        let command = extractCommandAfterWakeWord(filteredTranscript) || extractCommandAfterWakeWord(accumulatedTranscriptRef.current) || ''
        
        // If no command extracted, try splitting by any wake word variant
        if (!command || command.length < 2) {
          for (const variant of WAKE_WORD_VARIANTS) {
            const parts = filteredTranscript.split(new RegExp(variant, 'i'))
            if (parts.length > 1) {
              command = parts[parts.length - 1].trim()
              if (command.length > 2) break
            }
          }
        }
        
        // Clean up command - remove extra words and extract the actual command
        // Look for number commands first (most reliable)
        const numberWordPattern = /\b(?:open\s+)?(?:number\s+)?(?:one|two|three|four|five|six|\d+)\b/gi
        const numberMatches = command.match(numberWordPattern)
        
        if (numberMatches && numberMatches.length > 0) {
          // Use the last number command found (most recent)
          const lastNumberCommand = numberMatches[numberMatches.length - 1]
          // Reconstruct command with "open" prefix if needed
          if (!lastNumberCommand.toLowerCase().includes('open')) {
            command = `open ${lastNumberCommand}`
          } else {
            command = lastNumberCommand
          }
          console.log('📋 Extracted number command from transcript:', command)
        } else {
          // For non-number commands, try to extract the core command
          // Remove common filler words and misrecognitions
          command = command
            .replace(/\b(project|anthony|and|the|a|an|uh|um|pay|she|say)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
        }
        
        console.log('📋 Extracted command from accumulated:', command, {
          isFinal: isFinal,
          commandLength: command.length,
          processingCommand: processingCommandRef.current
        })
        
        // If we have a final result with the command, process it immediately
        if (isFinal && command && command.length > 2) {
          console.log('✅ Processing command from final result')
          if (commandTimeoutRef.current) {
            clearTimeout(commandTimeoutRef.current)
          }
          console.log('🎯 About to call handleVoiceCommand with:', command)
          handleVoiceCommand(command)
          console.log('✅ handleVoiceCommand called')
          wakeWordDetectedRef.current = false
          setIsWakeWordActive(true) // Keep listening for next command
          accumulatedTranscriptRef.current = '' // Reset
          // Reset processing flag after a delay to allow next command
          setTimeout(() => {
            processingCommandRef.current = false
          }, 1000)
          return
        }
      }
      
      // Only process final results for direct commands (without wake word)
      if (isFinal && hasFinalResult) {
        const finalTranscript = accumulatedTranscriptRef.current || fullTranscript
        
        // Skip if this is the same transcript we just processed
        if (finalTranscript === lastProcessedTranscript) {
          accumulatedTranscriptRef.current = '' // Reset for next command
          return
        }
        
        lastProcessedTranscript = finalTranscript
        console.log('✅ Final transcript:', finalTranscript)
        
        // Filter out TTS phrases from final transcript
        let filteredFinal = finalTranscript
          .replace(/disabled voice mode active say hey companion/gi, '')
          .replace(/voice mode enabled/gi, '')
          .replace(/voice mode disabled/gi, '')
          .replace(/listening/gi, '')
          .replace(/opening/gi, '')
          .replace(/going back to home/gi, '')
          .replace(/i didn't understand/gi, '')
          .replace(/enabled here are your available features/gi, '')
          .replace(/here are your available features/gi, '')
          .replace(/to open a feature.*say hey companion/gi, '')
          .replace(/for example.*hey companion/gi, '')
          .trim()
        
        // Check if this is an announcement - if so, ignore completely
        const lowerFinal = filteredFinal.toLowerCase()
        const isAnnouncement = lowerFinal.match(/enabled here are|here are your available features|to open a feature.*say hey companion|for example.*hey companion|voice mode enabled/i) ||
          lowerFinal.length > 100 || // Long transcripts are likely announcements
          (lowerFinal.includes('number one') && lowerFinal.includes('number two')) // Multiple numbers = announcement
        
        if (isAnnouncement) {
          console.log('🚫 Ignoring final transcript - it\'s an announcement:', lowerFinal.substring(0, 100))
          accumulatedTranscriptRef.current = ''
          return
        }
        
        // Skip if filtered transcript is too short
        if (filteredFinal.length < 3) {
          accumulatedTranscriptRef.current = '' // Reset
          return
        }
        
        // If wake word was already detected, process the final command
        if (wakeWordDetectedRef.current && filteredFinal.length > 2 && !processingCommandRef.current) {
          const timeSinceWakeWord = Date.now() - commandStartTimeRef.current
          console.log('⏱️ Time since wake word:', timeSinceWakeWord, 'ms')
          
          if (timeSinceWakeWord < 5000) { // Increased timeout to 5 seconds
            // Extract command after wake word from filtered final transcript (handle variants)
            let command = extractCommandAfterWakeWord(filteredFinal) || filteredFinal
            
            // If no command extracted, try splitting by any wake word variant
            if (!command || command.length < 2) {
              for (const variant of WAKE_WORD_VARIANTS) {
                const parts = filteredFinal.split(new RegExp(variant, 'i'))
                if (parts.length > 1) {
                  command = parts[parts.length - 1].trim()
                  if (command.length > 2) break
                }
              }
            }
            
            // Clean up command - extract number commands if present
            const numberWordPattern = /\b(?:open\s+)?(?:number\s+)?(?:one|two|three|four|five|six|\d+)\b/gi
            const numberMatches = command.match(numberWordPattern)
            
            if (numberMatches && numberMatches.length > 0) {
              // Use the last number command found (most recent)
              const lastNumberCommand = numberMatches[numberMatches.length - 1]
              // Reconstruct command with "open" prefix if needed
              if (!lastNumberCommand.toLowerCase().includes('open')) {
                command = `open ${lastNumberCommand}`
              } else {
                command = lastNumberCommand
              }
              console.log('📋 Extracted number command from final transcript:', command)
            } else {
              // Remove common filler words and misrecognitions
              command = command
                .replace(/\b(project|anthony|and|the|a|an|uh|um|pay|she|say)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim()
            }
            
            console.log('📋 Processing command after wake word from final:', command, {
              commandLength: command.length,
              processingCommand: processingCommandRef.current
            })
            
            if (command && command.length > 2) {
              if (commandTimeoutRef.current) {
                clearTimeout(commandTimeoutRef.current)
              }
              
              console.log('🎯 About to call handleVoiceCommand with:', command)
              handleVoiceCommand(command)
              console.log('✅ handleVoiceCommand called')
              wakeWordDetectedRef.current = false
              setIsWakeWordActive(true) // Keep listening for next command
              accumulatedTranscriptRef.current = '' // Reset
              // Reset processing flag after a delay to allow next command
              setTimeout(() => {
                processingCommandRef.current = false
              }, 1500)
              return
            }
          } else {
            // Timeout - reset
            console.log('⏰ Command timeout')
            wakeWordDetectedRef.current = false
            setIsWakeWordActive(true) // Keep listening
            accumulatedTranscriptRef.current = '' // Reset
            processingCommandRef.current = false
          }
        } else {
          // Check if it has wake word variants or is a direct command
          const hasWakeWordVariant = containsWakeWord(filteredFinal)
          const lowerTranscript = filteredFinal.toLowerCase()
          
          // If it has wake word variant, try to extract command
          if (hasWakeWordVariant && !processingCommandRef.current) {
            const extractedCommand = extractCommandAfterWakeWord(filteredFinal)
            if (extractedCommand && extractedCommand.length > 2) {
              console.log('🎯 Extracted command from wake word variant:', extractedCommand, 'from:', filteredFinal)
              triggerHaptic('success')
              handleVoiceCommand(extractedCommand)
              accumulatedTranscriptRef.current = ''
              setTimeout(() => {
                processingCommandRef.current = false
              }, 1500)
              return
            }
          }
          
          // Allow direct commands without wake word (for easier use)
          // Check if it looks like a navigation command
          if (filteredFinal.length > 0 && !processingCommandRef.current) {
          // First check if it's an announcement - if so, ignore completely
          const isAnnouncement = lowerTranscript.match(/enabled here are|here are your available features|to open a feature.*say hey companion|for example.*hey companion|voice mode enabled/i) ||
            lowerTranscript.length > 100 || // Long transcripts are likely announcements
            (lowerTranscript.includes('number one') && lowerTranscript.includes('number two')) || // Multiple numbers = announcement
            lowerTranscript.includes('number one voice to art') || // Announcement phrases
            lowerTranscript.includes('number two image to voice') ||
            lowerTranscript.includes('number three script to music') ||
            lowerTranscript.includes('number four real-time guidance') ||
            lowerTranscript.includes('number five voice guided shopping') ||
            lowerTranscript.includes('number six language learning')
          
          if (isAnnouncement) {
            console.log('🚫 Ignoring direct command check - transcript is announcement:', lowerTranscript.substring(0, 100))
            accumulatedTranscriptRef.current = ''
            return // Exit early from onresult handler
          }
          
          // Only accept very specific, short commands - be very strict
          const isNavigationCommand = 
            lowerTranscript.length < 30 && // Very short commands only
            !lowerTranscript.includes('here are') && 
            !lowerTranscript.includes('available features') &&
            !lowerTranscript.includes('say hey companion') &&
            !lowerTranscript.includes('for example') &&
            !lowerTranscript.includes('voice mode enabled') &&
            !lowerTranscript.includes('number one') && // Don't match announcement phrases
            !lowerTranscript.includes('number two') &&
            !lowerTranscript.includes('number three') &&
            !lowerTranscript.includes('number four') &&
            !lowerTranscript.includes('number five') &&
            !lowerTranscript.includes('number six') &&
            (
              lowerTranscript.match(/^(open|go to|navigate to|show me)\s+(voice to art|image to voice|script to music|real-time guidance|voice guided shopping|language learning|home)$/i) ||
              lowerTranscript.match(/^(number|#)?\s*([1-6])$/i) ||
              lowerTranscript === 'voice to art' ||
              lowerTranscript === 'image to voice' ||
              lowerTranscript === 'script to music' ||
              lowerTranscript === 'real-time guidance' ||
              lowerTranscript === 'voice guided shopping' ||
              lowerTranscript === 'language learning' ||
              lowerTranscript === 'home' ||
              lowerTranscript === 'go back' ||
              lowerTranscript === 'back' ||
              lowerTranscript.includes('help') // Allow "help" as direct command
            )
          
          console.log('🔍 Checking if direct command:', { 
            lowerTranscript, 
            isNavigationCommand: !!isNavigationCommand,
            hasWakeWordVariant: hasWakeWordVariant
          })
          
          if (isNavigationCommand) {
            console.log('🎯 Direct command detected (no wake word needed):', filteredFinal)
            triggerHaptic('success')
            handleVoiceCommand(filteredFinal)
            accumulatedTranscriptRef.current = '' // Reset
            // Reset processing flag after a delay to allow next command
            setTimeout(() => {
              processingCommandRef.current = false
            }, 1500)
          } else {
            // Log what we heard (for debugging)
            console.log('👂 Heard (no wake word, not a command):', filteredFinal)
            accumulatedTranscriptRef.current = '' // Reset even if not a command
          }
          }
        }
        
        // Reset accumulated transcript after processing final result
        if (!processingCommandRef.current) {
          accumulatedTranscriptRef.current = ''
        }
      }
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error, event)
      wakeWordDetectedRef.current = false
      
      if (event.error === 'no-speech') {
        // This is normal - no speech detected, don't restart here
        // The onend handler will restart recognition automatically
        console.log('🔇 No speech detected (this is normal)')
        // Clear any pending restart timeout
        if (recognitionRestartTimeoutRef.current) {
          clearTimeout(recognitionRestartTimeoutRef.current)
          recognitionRestartTimeoutRef.current = null
        }
      } else if (event.error === 'aborted') {
        // Recognition was stopped, don't restart
        console.log('⏹️ Recognition aborted')
        setIsWakeWordActive(false)
      } else if (event.error === 'audio-capture') {
        speak('No microphone found. Please connect a microphone.', 'error', 'apologetic')
        setIsWakeWordActive(false)
      } else if (event.error === 'not-allowed') {
        speak('Microphone permission denied. Please allow microphone access in your browser settings and refresh the page.', 'error', 'apologetic')
        setIsWakeWordActive(false)
        setIsVoiceModeEnabled(false)
      } else if (event.error === 'network') {
        speak('Network error. Please check your internet connection.', 'error', 'apologetic')
        setIsWakeWordActive(false)
      } else {
        console.error('❓ Unknown recognition error:', event.error)
        setIsWakeWordActive(false)
      }
    }

    recognitionRef.current.onend = () => {
      console.log('🔚 Speech recognition ended')
      
      // Don't restart if voice mode is disabled or we're explicitly stopping
      if (!isVoiceModeEnabled) {
        console.log('🛑 Not restarting - voice mode disabled')
        setIsWakeWordActive(false)
        return
      }
      
      // Clear any pending restart timeout
      if (recognitionRestartTimeoutRef.current) {
        clearTimeout(recognitionRestartTimeoutRef.current)
        recognitionRestartTimeoutRef.current = null
      }
      
      // Restart recognition if voice mode is still enabled and not processing
      if (isVoiceModeEnabled && !processingCommandRef.current && !isRecognitionStartingRef.current) {
        isRecognitionStartingRef.current = true
        recognitionRestartTimeoutRef.current = setTimeout(() => {
          // Double-check conditions before restarting
          if (!isVoiceModeEnabled || processingCommandRef.current) {
            isRecognitionStartingRef.current = false
            return
          }
          
          try {
            if (recognitionRef.current && isVoiceModeEnabled && !processingCommandRef.current) {
              console.log('🔄 Restarting speech recognition...')
              recognitionRef.current.start()
              // Reset flag after a short delay to allow recognition to start
              setTimeout(() => {
                isRecognitionStartingRef.current = false
              }, 1000)
            } else {
              isRecognitionStartingRef.current = false
            }
          } catch (e: any) {
            isRecognitionStartingRef.current = false
            if (e.message && e.message.includes('already started')) {
              // Recognition is already running, that's okay
              console.log('ℹ️ Recognition already started (ignoring)')
            } else {
              console.error('Error restarting recognition on end:', e)
            }
          }
        }, 500)
      } else {
        setIsWakeWordActive(false)
      }
    }

    try {
      // Check if recognition is already starting
      if (isRecognitionStartingRef.current) {
        console.log('ℹ️ Recognition is already starting, skipping...')
        return
      }
      
      isRecognitionStartingRef.current = true
      console.log('🚀 Starting speech recognition...')
      recognitionRef.current.start()
      setIsWakeWordActive(true)
      
      // Reset flag after recognition starts
      setTimeout(() => {
        isRecognitionStartingRef.current = false
      }, 1000)
    } catch (error: any) {
      isRecognitionStartingRef.current = false
      console.error('❌ Error starting recognition:', error)
      if (error.message && error.message.includes('already started')) {
        // Recognition is already running, that's okay
        console.log('ℹ️ Recognition already started')
        setIsWakeWordActive(true)
      } else {
        speak('Failed to start voice recognition. Please try again.', 'error', 'apologetic')
        setIsWakeWordActive(false)
      }
    }
  }

  const stopWakeWordDetection = () => {
    console.log('🛑 Stopping wake word detection')
    
    // Set flag to prevent restart
    isRecognitionStartingRef.current = false
    processingCommandRef.current = false
    wakeWordDetectedRef.current = false
    
    // Clear all timeouts first
    if (commandTimeoutRef.current) {
      clearTimeout(commandTimeoutRef.current)
      commandTimeoutRef.current = null
    }
    if (recognitionRestartTimeoutRef.current) {
      clearTimeout(recognitionRestartTimeoutRef.current)
      recognitionRestartTimeoutRef.current = null
    }
    
    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current.onend = null // Remove onend handler to prevent auto-restart
        recognitionRef.current.onresult = null // Remove onresult handler
        recognitionRef.current.onerror = null // Remove onerror handler
      } catch (e) {
        console.error('Error stopping recognition:', e)
      }
    }
    
    // Reset all state
    setIsWakeWordActive(false)
    accumulatedTranscriptRef.current = '' // Reset accumulated transcript
    commandStartTimeRef.current = 0
    
    // Stop any ongoing speech
    stopSpeaking()
  }

  // Announce page-specific options (ONLY reads, does not navigate)
  const announcePageOptions = (page?: string) => {
    if (!isVoiceModeEnabled || !page) return
    
    // Stop recognition completely before announcement
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        // Temporarily remove onend handler to prevent auto-restart during announcement
        const originalOnEnd = recognitionRef.current.onend
        recognitionRef.current.onend = null
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Clear accumulated transcript
    accumulatedTranscriptRef.current = ''
    wakeWordDetectedRef.current = false
    processingCommandRef.current = false
    
    const pageOptions: { [key: string]: string } = {
      'home': 'You are on the home page. You can navigate to any feature by saying "Hey Companion, open" followed by the feature name or number. Say "Hey Companion, help" to hear all available features.',
      'voice-to-art': 'You are on the Voice to Art page. You can describe what you want to see, and we will create it. Say "Hey Companion, go back" to return to home, or "Hey Companion, disable voice mode" to turn off voice mode.',
      'image-to-voice': 'You are on the Image to Voice page. You can upload an image or take a photo to get a detailed voice description. Say "Hey Companion, go back" to return to home, or "Hey Companion, disable voice mode" to turn off voice mode.',
      'script-to-music': 'You are on the Script to Music page. You can convert your lyrics or voice into beautiful music. Say "Hey Companion, go back" to return to home, or "Hey Companion, disable voice mode" to turn off voice mode.',
      'real-time-guidance': 'You are on the Real-Time Guidance page. You can start the camera for continuous voice guidance. Say "Hey Companion, go back" to return to home, or "Hey Companion, disable voice mode" to turn off voice mode.',
      'voice-guided-shopping': 'You are on the Voice Guided Shopping page. You can identify products, read labels, and get shopping assistance. Say "Hey Companion, go back" to return to home, or "Hey Companion, disable voice mode" to turn off voice mode.',
      'learning': 'You are on the Language Learning page. You can practice languages with intelligent feedback. Say "Hey Companion, go back" to return to home, or "Hey Companion, disable voice mode" to turn off voice mode.',
    }
    
    const announcement = pageOptions[page] || `You are on the ${page} page. Say "Hey Companion, go back" to return to home, or "Hey Companion, help" for more options.`
    
    // Calculate approximate speech duration (words per minute = 150, add buffer)
    const wordCount = announcement.split(' ').length
    const estimatedDuration = (wordCount / 150) * 60 * 1000 // Convert to milliseconds
    const waitTime = Math.max(estimatedDuration + 2000, 5000) // At least 5 seconds
    
    speak(announcement, 'default', 'calm')
    
    // Restart recognition after announcement finishes with proper cleanup
    setTimeout(() => {
      if (isVoiceModeEnabled && !processingCommandRef.current) {
        accumulatedTranscriptRef.current = '' // Reset transcript
        wakeWordDetectedRef.current = false
        
        // Re-initialize recognition handlers if needed
        if (recognitionRef.current) {
          try {
            console.log('🔄 Restarting recognition after page announcement...')
            startWakeWordDetection() // Use the full initialization function
          } catch (e: any) {
            if (e.message && !e.message.includes('already started')) {
              console.error('Error restarting recognition after announcement:', e)
            }
          }
        }
      }
    }, waitTime)
  }

  const handleVoiceCommand = (command: string) => {
    console.log('🎤 handleVoiceCommand called with:', command, {
      processingCommand: processingCommandRef.current,
      onNavigate: !!onNavigate,
      onNavigateType: typeof onNavigate
    })
    
    if (processingCommandRef.current) {
      console.log('⚠️ Already processing a command, ignoring:', command)
      return
    }
    
    processingCommandRef.current = true
    console.log('✅ Processing voice command:', command)
    const lowerCommand = command.toLowerCase().trim()
    
    // Remove common filler words and clean up
    let cleanedCommand = lowerCommand
      .replace(/^(hey companion|hey|companion|please|can you|could you)\s+/i, '')
      .trim()
    
    // Remove duplicate phrases (e.g., "open number project anthony open number three" -> "open number three")
    // Extract the last occurrence of number-related commands
    const numberPatterns = [
      /\b(?:open\s+)?(?:number\s+)?(?:one|two|three|four|five|six|\d+)\b/gi,
      /\b(?:open|go to|navigate to)\s+(?:number\s+)?(?:one|two|three|four|five|six|\d+)\b/gi,
    ]
    
    // Find all number matches
    const allMatches: string[] = []
    numberPatterns.forEach(pattern => {
      const matches = cleanedCommand.match(pattern)
      if (matches) {
        allMatches.push(...matches)
      }
    })
    
    // If we found number matches, use the last one (most recent command)
    if (allMatches.length > 0) {
      const lastMatch = allMatches[allMatches.length - 1]
      console.log('📌 Found number command in transcript, using:', lastMatch)
      cleanedCommand = lastMatch.trim()
    } else {
      // Remove extra words that might be misrecognitions
      // Keep only the core command words
      cleanedCommand = cleanedCommand
        .replace(/\b(project|anthony|and|the|a|an)\b/gi, '') // Remove common misrecognitions
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
    }
    
    console.log('Cleaned command:', cleanedCommand)
    
    // Map word numbers to digits
    const wordToNumber: { [key: string]: number } = {
      'one': 1,
      'two': 2,
      'three': 3,
      'four': 4,
      'five': 5,
      'six': 6,
    }
    
    // First check if it's a number command (e.g., "open 3", "open number 3", "number 3", "open number three")
    // Check for word numbers first
    let number: number | null = null
    for (const [word, num] of Object.entries(wordToNumber)) {
      if (cleanedCommand.includes(word)) {
        number = num
        console.log(`✅ Found word number: "${word}" -> ${num}`)
        break
      }
    }
    
    // If no word number found, check for digit
    if (number === null) {
      const numberMatch = cleanedCommand.match(/\b(?:open\s+)?(?:number\s+)?(\d+)\b/i)
      if (numberMatch) {
        number = parseInt(numberMatch[1], 10)
        console.log(`✅ Found digit number: ${number}`)
      }
    }
    
    if (number !== null) {
      const featureByNumber = AVAILABLE_FEATURES.find(f => f.number === number)
      console.log(`🔍 Looking for feature number ${number}:`, {
        found: !!featureByNumber,
        feature: featureByNumber,
        onNavigate: !!onNavigate,
        availableFeatures: AVAILABLE_FEATURES.map(f => ({ number: f.number, name: f.name, page: f.page }))
      })
      
      if (featureByNumber && onNavigate) {
        console.log(`🎯 Opening feature ${number}: ${featureByNumber.name} -> ${featureByNumber.page}`)
        speak(`Opening ${featureByNumber.name}`, 'navigation', 'calm')
        triggerHaptic('success')
        setIsWakeWordActive(false)
        
        setTimeout(() => {
          console.log(`🚀 Calling onNavigate with: ${featureByNumber.page}`, {
            page: featureByNumber.page,
            onNavigate: onNavigate,
            onNavigateType: typeof onNavigate
          })
          if (onNavigate) {
            try {
              onNavigate(featureByNumber.page)
              console.log(`✅ onNavigate called successfully for page: ${featureByNumber.page}`)
            } catch (error) {
              console.error(`❌ Error calling onNavigate:`, error)
            }
          } else {
            console.error(`❌ onNavigate is not available!`)
          }
          // Reset state after navigation to allow next command
          setTimeout(() => {
            processingCommandRef.current = false
            accumulatedTranscriptRef.current = ''
            wakeWordDetectedRef.current = false
            setIsWakeWordActive(true)
          }, 1000)
        }, 800)
        return
      } else {
        if (!featureByNumber) {
          console.log(`❌ Feature number ${number} not found in AVAILABLE_FEATURES`)
        }
        if (!onNavigate) {
          console.log(`❌ onNavigate function is not available`)
        }
      }
    }
    
    // Extract feature from command
    const feature = extractFeature(cleanedCommand)
    console.log('Extracted feature:', feature)
    
    if (feature && onNavigate) {
      
      // Then check by name/keyword
      const pageMap: { [key: string]: string } = {
        'voice to art': 'voice-to-art',
        'image to voice': 'image-to-voice',
        'script to music': 'script-to-music',
        'real-time guidance': 'real-time-guidance',
        'voice guided shopping': 'voice-guided-shopping',
        'shopping': 'voice-guided-shopping',
        'language learning': 'learning',
        'home': 'home',
      }
      
      const page = pageMap[feature.toLowerCase()]
      console.log(`🔍 Looking up page for feature "${feature}":`, {
        found: !!page,
        page: page,
        pageMapKeys: Object.keys(pageMap),
        featureLower: feature.toLowerCase()
      })
      
      if (page) {
        console.log(`🎯 Navigating to ${page} for feature "${feature}"`)
        // Find the feature name for better announcement
        const featureInfo = AVAILABLE_FEATURES.find(f => f.page === page)
        const featureName = featureInfo ? featureInfo.name : feature
        
        speak(`Opening ${featureName}`, 'navigation', 'calm')
        triggerHaptic('success')
        setIsWakeWordActive(false)
        
        // Small delay to allow speech to start before navigation
        setTimeout(() => {
          console.log(`🚀 Calling onNavigate with: ${page}`, {
            page: page,
            onNavigate: onNavigate,
            onNavigateType: typeof onNavigate
          })
          if (onNavigate) {
            try {
              onNavigate(page)
              console.log(`✅ onNavigate called successfully`)
            } catch (error) {
              console.error(`❌ Error calling onNavigate:`, error)
            }
          } else {
            console.error(`❌ onNavigate is not available!`)
          }
          // Reset state after navigation to allow next command
          setTimeout(() => {
            processingCommandRef.current = false
            accumulatedTranscriptRef.current = ''
            wakeWordDetectedRef.current = false
            setIsWakeWordActive(true) // Keep listening for next command
          }, 1000)
        }, 800)
        return
      } else {
        console.log(`❌ No page mapping found for feature: "${feature}" (lowercase: "${feature.toLowerCase()}")`)
      }
    } else {
      console.log(`❌ Feature extraction failed or onNavigate not available:`, {
        feature: feature,
        onNavigate: !!onNavigate
      })
    }
    
    // Don't set processingCommandRef.current = false here - let it be set in the return statements above
    // This ensures we can still process help/disable commands
    
    // Help command - list all features with numbers (only when user asks)
    if (cleanedCommand.includes('help') || cleanedCommand.includes('what can you do') || cleanedCommand.includes('list features') || cleanedCommand.includes('show features') || cleanedCommand.includes('what options') || cleanedCommand.includes('what are my options')) {
      console.log('✅ Help command detected')
      // Stop recognition temporarily to avoid picking up TTS
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors
        }
      }
      
      const featuresList = AVAILABLE_FEATURES.map(f => `Number ${f.number}, ${f.name}`).join('. ')
      const announcement = `Here are your available features: ${featuresList}. To open a feature, say "Hey Companion, open" followed by the feature name or number. For example, "Hey Companion, open Voice to Art" or "Hey Companion, open number 1".`
      
      // Calculate speech duration
      const wordCount = announcement.split(' ').length
      const estimatedDuration = (wordCount / 150) * 60 * 1000
      const waitTime = Math.max(estimatedDuration + 1000, 3000)
      
      speak(announcement, 'default', 'warm')
      
      // Restart recognition after announcement
      setTimeout(() => {
        if (isVoiceModeEnabled && !processingCommandRef.current) {
          accumulatedTranscriptRef.current = ''
          wakeWordDetectedRef.current = false
          console.log('🔄 Restarting recognition after help announcement...')
          startWakeWordDetection()
        }
        processingCommandRef.current = false
      }, waitTime)
      return
    }
    
    // Disable voice mode command
    if (cleanedCommand.includes('disable voice mode') || cleanedCommand.includes('turn off voice mode') || cleanedCommand.includes('stop voice mode') || cleanedCommand.includes('exit voice mode')) {
      speak('Disabling voice mode', 'default', 'calm')
      triggerHaptic('success')
      setTimeout(() => {
        toggleVoiceMode()
        processingCommandRef.current = false
      }, 500)
      return
    }
    
    // Back/Home command
    if (cleanedCommand.includes('go back') || cleanedCommand.includes('back to home') || cleanedCommand === 'home' || cleanedCommand === 'back' || cleanedCommand.includes('go home')) {
      if (onNavigate) {
        console.log('✅ Go back/home command detected')
        speak('Going back to home', 'navigation', 'calm')
        triggerHaptic('success')
        setIsWakeWordActive(false)
        setTimeout(() => {
          console.log('🚀 Navigating to home')
          onNavigate('home')
          setTimeout(() => {
            processingCommandRef.current = false
            setIsWakeWordActive(true)
          }, 1000)
        }, 800)
        return
      }
    }
    
    // Page-specific options command - announce current page options when asked
    if (cleanedCommand.includes('what can i do') || cleanedCommand.includes('what options') || cleanedCommand.includes('show options') || cleanedCommand.includes('list options') || cleanedCommand.includes('what are my options')) {
      console.log('✅ Page options command detected')
      // Stop recognition temporarily
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors
        }
      }
      
      announcePageOptions(currentPage)
      
      // Restart recognition after announcement
      const announcement = currentPage ? `You are on the ${currentPage} page.` : 'You are on the home page.'
      const wordCount = announcement.split(' ').length
      const estimatedDuration = (wordCount / 150) * 60 * 1000
      const waitTime = Math.max(estimatedDuration + 2000, 3000)
      
      setTimeout(() => {
        if (isVoiceModeEnabled && !processingCommandRef.current) {
          accumulatedTranscriptRef.current = ''
          wakeWordDetectedRef.current = false
          console.log('🔄 Restarting recognition after page options announcement...')
          startWakeWordDetection()
        }
        processingCommandRef.current = false
      }, waitTime)
      return
    }
    
    // If no command matched, provide feedback
    console.log('❌ Command not recognized:', {
      originalCommand: command,
      cleanedCommand: cleanedCommand,
      number: number,
      feature: feature,
      onNavigate: !!onNavigate,
      availableFeatures: AVAILABLE_FEATURES.map(f => ({ number: f.number, name: f.name, page: f.page }))
    })
    setIsWakeWordActive(false)
    speak('I didn\'t understand that command. Try saying "Hey Companion, open Voice to Art" or "Hey Companion, open number 1"', 'error', 'apologetic')
    triggerHaptic('warning')
    processingCommandRef.current = false
  }

  const extractFeature = (command: string): string | null => {
    const lowerCommand = command.toLowerCase().trim()
    console.log('🔍 extractFeature input:', lowerCommand)
    
    // Numbers are handled separately in handleVoiceCommand, so skip here
    // This function only handles text-based feature names
    
    // Remove common navigation words
    const cleaned = lowerCommand
      .replace(/^(go to|open|show|show me|navigate to|take me to|number)\s+/i, '')
      .replace(/\b(number\s+)?\d+\b/g, '') // Remove any remaining numbers
      .trim()
    
    console.log('🔍 extractFeature cleaned:', cleaned)
    
    // Feature matching with priority (more specific patterns first)
    // Order matters - check longer/more specific patterns first
    const featurePatterns = [
      // Most specific patterns first
      { pattern: /^image\s+to\s+voice|image\s+to\s+voice|describe\s+image|image\s+description/i, feature: 'image to voice', priority: 10 },
      { pattern: /^voice\s+to\s+art|voice\s+to\s+art|art\s+generation|create\s+art/i, feature: 'voice to art', priority: 10 },
      { pattern: /^script\s+to\s+music|script\s+to\s+music|music\s+generation|create\s+music/i, feature: 'script to music', priority: 10 },
      { pattern: /^real[\s-]?time\s+guidance|real[\s-]?time\s+guidance|blind\s+guidance/i, feature: 'real-time guidance', priority: 10 },
      { pattern: /^voice\s+guided\s+shopping|voice\s+guided\s+shopping/i, feature: 'shopping', priority: 10 },
      { pattern: /^language\s+learning|language\s+learning/i, feature: 'language learning', priority: 10 },
      
      // Medium specificity
      { pattern: /\bimage\s+to\s+voice\b/i, feature: 'image to voice', priority: 8 },
      { pattern: /\bvoice\s+to\s+art\b/i, feature: 'voice to art', priority: 8 },
      { pattern: /\bscript\s+to\s+music\b/i, feature: 'script to music', priority: 8 },
      { pattern: /\breal[\s-]?time\s+guidance\b/i, feature: 'real-time guidance', priority: 8 },
      
      // Less specific but still good
      { pattern: /\bimage.*voice\b/i, feature: 'image to voice', priority: 6 },
      { pattern: /\bvoice.*art\b/i, feature: 'voice to art', priority: 6 },
      { pattern: /\bmusic\b.*(script|generate|create)/i, feature: 'script to music', priority: 6 },
      { pattern: /\bguidance\b|\bnavigation\b/i, feature: 'real-time guidance', priority: 5 },
      { pattern: /\bshopping\b|\bshop\b/i, feature: 'shopping', priority: 5 },
      { pattern: /\blearning\b|\blanguage\b/i, feature: 'language learning', priority: 5 },
      
      // Home/back
      { pattern: /^home$|^back$/i, feature: 'home', priority: 10 },
    ]
    
    // Sort by priority (higher first)
    featurePatterns.sort((a, b) => b.priority - a.priority)
    
    // Try patterns in order - check both cleaned and original command
    for (const { pattern, feature } of featurePatterns) {
      if (pattern.test(cleaned) || pattern.test(lowerCommand)) {
        console.log(`✅ Matched pattern "${pattern}" to feature: ${feature}`)
        return feature
      }
    }
    
    // Fallback: check against feature keywords
    for (const featureInfo of AVAILABLE_FEATURES) {
      for (const keyword of featureInfo.keywords) {
        if (cleaned.includes(keyword) || lowerCommand.includes(keyword)) {
          console.log(`✅ Matched keyword "${keyword}" to feature: ${featureInfo.name}`)
          return featureInfo.name.toLowerCase()
        }
      }
    }
    
    // Fallback: simple keyword matching (be more specific)
    const textToCheck = cleaned.length > 0 ? cleaned : lowerCommand
    
    // Check for "image to voice" first (before checking just "art")
    if ((textToCheck.includes('image') && textToCheck.includes('voice')) || 
        textToCheck.includes('image to voice')) {
      console.log('✅ Fallback match: image to voice')
      return 'image to voice'
    }
    
    // Check for "voice to art" (must have both "voice" and "art")
    if ((textToCheck.includes('voice') && textToCheck.includes('art')) ||
        textToCheck.includes('voice to art') ||
        (textToCheck.includes('art') && !textToCheck.includes('image'))) {
      console.log('✅ Fallback match: voice to art')
      return 'voice to art'
    }
    
    // Check for "script to music" or just "music" with context
    if (textToCheck.includes('script to music') ||
        (textToCheck.includes('music') && (textToCheck.includes('script') || textToCheck.includes('generate') || textToCheck.includes('create')))) {
      console.log('✅ Fallback match: script to music')
      return 'script to music'
    }
    
    // Check for guidance/navigation
    if (textToCheck.includes('guidance') || textToCheck.includes('navigation') || textToCheck.includes('real-time')) {
      console.log('✅ Fallback match: real-time guidance')
      return 'real-time guidance'
    }
    
    // Check for shopping
    if (textToCheck.includes('shop') || textToCheck.includes('shopping')) {
      console.log('✅ Fallback match: shopping')
      return 'shopping'
    }
    
    // Check for language learning
    if (textToCheck.includes('learning') || (textToCheck.includes('language') && !textToCheck.includes('voice'))) {
      console.log('✅ Fallback match: language learning')
      return 'language learning'
    }
    
    console.log('❌ No feature matched for:', command)
    return null
  }

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
  if (context === undefined) {
    throw new Error('useVoiceMode must be used within a VoiceModeProvider')
  }
  return context
}
