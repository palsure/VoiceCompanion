import { useState, useCallback } from 'react'
import { languageService } from '../services/languageService'

export const useLanguageFeedback = () => {
  const [feedback, setFeedback] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeText = useCallback(async (text: string, targetLanguage: string = 'en') => {
    setIsAnalyzing(true)
    try {
      const analysis = await languageService.analyze(text, targetLanguage)
      setFeedback(analysis)
      return analysis
    } catch (error) {
      console.error('Error analyzing language:', error)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  return {
    feedback,
    isAnalyzing,
    analyzeText,
  }
}

