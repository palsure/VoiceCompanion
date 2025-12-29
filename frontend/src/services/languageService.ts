import api from './api'

export interface LanguageAnalysis {
  grammar: {
    errors: Array<{
      incorrect: string
      correct: string
      explanation: string
    }>
  }
  vocabulary: {
    suggestions: string[]
    level: string
  }
  pronunciation: {
    score: number
    feedback: string
  }
  cultural: {
    context: string
    idioms?: Array<{
      used: string
      native: string
      explanation: string
    }>
  }
}

export const languageService = {
  analyze: async (text: string, targetLanguage: string = 'en'): Promise<LanguageAnalysis> => {
    const response = await api.post('/language/analyze', { text, targetLanguage })
    return response.data
  },
}

export default languageService

