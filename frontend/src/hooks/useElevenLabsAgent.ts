import { useState, useRef, useCallback } from 'react'
import { elevenLabsAgentService } from '../services/elevenLabsAgent'
import { conversationApi } from '../services/api'

interface UseElevenLabsAgentOptions {
  scenario?: string | null
  onFeedback?: (feedback: any) => void
  onMessage?: (message: { role: 'user' | 'assistant'; content: string }) => void
  mode?: 'accessibility' | 'learning'
  capturedImage?: string | null
}

export const useElevenLabsAgent = (options: UseElevenLabsAgentOptions = {}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const initializeSpeechRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript
        setIsListening(false)
        
        // Notify about user message
        if (options.onMessage) {
          options.onMessage({ role: 'user', content: transcript })
        }
        
        try {
          // Send to backend for processing with ElevenLabs Agents and Gemini
          const response = await conversationApi.sendMessage({
            message: transcript,
            scenario: options.scenario || undefined,
            mode: options.mode || 'learning',
            imageData: options.capturedImage || undefined,
          })

          // Notify about assistant response
          if (options.onMessage && response.response) {
            options.onMessage({ role: 'assistant', content: response.response })
          }

          // Play response audio if available
          if (response.audioUrl) {
            await playAudio(response.audioUrl)
          } else if (response.response) {
            // Fallback to text-to-speech
            await speakText(response.response)
          }

          // Trigger feedback callback
          if (options.onFeedback && response.feedback) {
            options.onFeedback(response.feedback)
          }
        } catch (error) {
          console.error('Error processing conversation:', error)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [options.scenario, options.onFeedback])

  const playAudio = async (audioUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl)
      setIsSpeaking(true)
      audio.onended = () => {
        setIsSpeaking(false)
        resolve()
      }
      audio.onerror = reject
      audio.play()
    })
  }

  const speakText = async (text: string): Promise<void> => {
    // Use Web Speech API as fallback
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }
      window.speechSynthesis.speak(utterance)
    })
  }

  const startConversation = useCallback(async () => {
    if (!recognitionRef.current) {
      initializeSpeechRecognition()
    }

    if (recognitionRef.current && !isListening) {
      try {
        // Initialize conversation with ElevenLabs Agent
        const agentConfig = {
          scenario: options.scenario || undefined,
          language: 'en', // This would be configurable
        }
        
        // For now, we'll use the backend to handle agent creation
        // In a full implementation, this would use the ElevenLabs Agents SDK directly
        const id = await elevenLabsAgentService.createConversation(agentConfig)
        setConversationId(id)

        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error('Failed to start conversation:', error)
      }
    }
  }, [isListening, options.scenario, initializeSpeechRecognition])

  const stopConversation = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [isListening])

  return {
    isListening,
    isSpeaking,
    conversationId,
    startConversation,
    stopConversation,
  }
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

