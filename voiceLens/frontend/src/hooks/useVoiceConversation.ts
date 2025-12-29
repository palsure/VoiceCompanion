import { useState, useCallback } from 'react'
import { useElevenLabs } from './useElevenLabs'
import { voiceService } from '../services/voiceService'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export const useVoiceConversation = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)

  const handleTranscript = useCallback(async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return

    const userMessage: Message = {
      role: 'user',
      content: transcript,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsProcessing(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const imageToSend = currentImage || undefined
      
      // Clear image after sending
      if (currentImage) {
        setCurrentImage(null)
      }
      
      const response = await voiceService.sendMessage(
        transcript,
        imageToSend,
        history
      )

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error processing message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }, [messages, currentImage, isProcessing])

  const { isListening, isSpeaking, startListening, stopListening, speak } = useElevenLabs({
    onTranscript: handleTranscript,
  })

  const sendMessage = useCallback(async (message: string) => {
    await handleTranscript(message)
  }, [handleTranscript])

  const speakResponse = useCallback(async (text: string) => {
    await speak(text)
  }, [speak])

  return {
    messages,
    isListening,
    isSpeaking,
    isProcessing,
    currentImage,
    setCurrentImage,
    startListening,
    stopListening,
    sendMessage,
    speakResponse,
  }
}

