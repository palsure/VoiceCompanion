// In-memory storage for progress (in production, use a database)
interface UserProgress {
  userId?: string
  totalConversations: number
  totalTime: number // in seconds
  grammarScore: number
  vocabularyScore: number
  pronunciationScore: number
  streak: number
  lastPracticeDate?: string
  conversationHistory: Array<{
    date: string
    scenario?: string
    duration: number
  }>
}

class ProgressService {
  private progressStore: Map<string, UserProgress> = new Map()

  private getDefaultProgress(): UserProgress {
    return {
      totalConversations: 0,
      totalTime: 0,
      grammarScore: 0,
      vocabularyScore: 0,
      pronunciationScore: 0,
      streak: 0,
      conversationHistory: [],
    }
  }

  getProgress(userId: string = 'default'): UserProgress {
    if (!this.progressStore.has(userId)) {
      this.progressStore.set(userId, this.getDefaultProgress())
    }
    return this.progressStore.get(userId)!
  }

  updateProgress(
    userId: string = 'default',
    updates: Partial<UserProgress>
  ): UserProgress {
    const current = this.getProgress(userId)
    const updated = {
      ...current,
      ...updates,
      conversationHistory: updates.conversationHistory || current.conversationHistory,
    }
    this.progressStore.set(userId, updated)
    return updated
  }

  recordConversation(
    userId: string = 'default',
    scenario?: string,
    duration: number = 0,
    feedback?: {
      grammar?: { score?: number }
      vocabulary?: { score?: number }
      pronunciation?: { score?: number }
    }
  ): UserProgress {
    const current = this.getProgress(userId)
    
    // Update scores based on feedback
    let grammarScore = current.grammarScore
    let vocabularyScore = current.vocabularyScore
    let pronunciationScore = current.pronunciationScore

    if (feedback) {
      if (feedback.grammar?.score !== undefined) {
        grammarScore = Math.round(
          (grammarScore * current.totalConversations + feedback.grammar.score) /
          (current.totalConversations + 1)
        )
      }
      if (feedback.vocabulary?.score !== undefined) {
        vocabularyScore = Math.round(
          (vocabularyScore * current.totalConversations + feedback.vocabulary.score) /
          (current.totalConversations + 1)
        )
      }
      if (feedback.pronunciation?.score !== undefined) {
        pronunciationScore = Math.round(
          (pronunciationScore * current.totalConversations + feedback.pronunciation.score) /
          (current.totalConversations + 1)
        )
      }
    }

    // Update streak
    const today = new Date().toISOString().split('T')[0]
    let streak = current.streak
    if (current.lastPracticeDate) {
      const lastDate = new Date(current.lastPracticeDate)
      const todayDate = new Date(today)
      const daysDiff = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysDiff === 1) {
        streak = current.streak + 1
      } else if (daysDiff > 1) {
        streak = 1
      }
    } else {
      streak = 1
    }

    const updated = this.updateProgress(userId, {
      totalConversations: current.totalConversations + 1,
      totalTime: current.totalTime + duration,
      grammarScore,
      vocabularyScore,
      pronunciationScore,
      streak,
      lastPracticeDate: today,
      conversationHistory: [
        ...current.conversationHistory,
        {
          date: today,
          scenario,
          duration,
        },
      ],
    })

    return updated
  }
}

export const progressService = new ProgressService()
export default progressService

