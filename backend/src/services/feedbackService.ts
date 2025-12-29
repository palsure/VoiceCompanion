import { geminiService } from './geminiService.js'

class FeedbackService {
  async analyzeFeedback(
    text: string,
    targetLanguage: string = 'en',
    audioData?: string
  ): Promise<{
    grammar: any
    vocabulary: any
    pronunciation: any
    cultural: any
  }> {
    // Use Gemini to analyze the language
    const analysis = await geminiService.analyzeLanguage(text, targetLanguage)

    // If audio data is provided, we could add pronunciation analysis here
    // For now, we'll use the text-based analysis from Gemini
    if (audioData) {
      // In a full implementation, we could:
      // 1. Use speech recognition to get phonemes
      // 2. Compare with native pronunciation patterns
      // 3. Provide detailed pronunciation feedback
      analysis.pronunciation = {
        ...analysis.pronunciation,
        note: 'Audio analysis would be enhanced with additional speech processing',
      }
    }

    return analysis
  }

  formatFeedback(analysis: any) {
    return {
      grammar: {
        corrections: analysis.grammar?.errors || [],
        score: analysis.grammar?.score || 0,
      },
      vocabulary: {
        suggestions: analysis.vocabulary?.suggestions || [],
        level: analysis.vocabulary?.level || 'intermediate',
      },
      pronunciation: {
        score: analysis.pronunciation?.score || 0,
        feedback: analysis.pronunciation?.feedback || 'No pronunciation feedback available',
      },
      cultural: analysis.cultural?.context || analysis.cultural || '',
    }
  }
}

export const feedbackService = new FeedbackService()
export default feedbackService

