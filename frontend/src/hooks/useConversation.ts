import { useState, useCallback } from 'react'
import { conversationApi, ConversationRequest } from '../services/api'

export const useConversation = () => {
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: 'user' | 'assistant'; content: string }>
  >([])
  const [isProcessing, setIsProcessing] = useState(false)

  const sendMessage = useCallback(async (
    message: string,
    scenario?: string
  ): Promise<string> => {
    setIsProcessing(true)
    try {
      const request: ConversationRequest = {
        message,
        scenario,
        conversationHistory,
      }

      const response = await conversationApi.sendMessage(request)
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: response.response },
      ])

      return response.response
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [conversationHistory])

  const clearHistory = useCallback(() => {
    setConversationHistory([])
  }, [])

  return {
    conversationHistory,
    isProcessing,
    sendMessage,
    clearHistory,
  }
}

