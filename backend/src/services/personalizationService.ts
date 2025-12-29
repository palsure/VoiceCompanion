import { progressService } from './progressService.js'

interface SkillLevel {
  level: 'beginner' | 'intermediate' | 'advanced'
  grammar: number
  vocabulary: number
  pronunciation: number
}

class PersonalizationService {
  assessSkillLevel(userId: string = 'default'): SkillLevel {
    const progress = progressService.getProgress(userId)
    
    // Calculate average score (handle division by zero)
    const totalScore = progress.grammarScore + progress.vocabularyScore + progress.pronunciationScore
    const avgScore = totalScore > 0 
      ? Math.round(totalScore / 3)
      : 0

    let level: 'beginner' | 'intermediate' | 'advanced'
    if (avgScore < 40) {
      level = 'beginner'
    } else if (avgScore < 70) {
      level = 'intermediate'
    } else {
      level = 'advanced'
    }

    return {
      level,
      grammar: progress.grammarScore,
      vocabulary: progress.vocabularyScore,
      pronunciation: progress.pronunciationScore,
    }
  }

  getAdaptiveDifficulty(userId: string = 'default'): {
    complexity: 'simple' | 'moderate' | 'complex'
    vocabularyLevel: string
    grammarFocus: string[]
  } {
    const skillLevel = this.assessSkillLevel(userId)
    const progress = progressService.getProgress(userId)

    let complexity: 'simple' | 'moderate' | 'complex'
    let vocabularyLevel: string
    let grammarFocus: string[] = []

    switch (skillLevel.level) {
      case 'beginner':
        complexity = 'simple'
        vocabularyLevel = 'basic'
        grammarFocus = ['present tense', 'basic questions', 'common phrases']
        break
      case 'intermediate':
        complexity = 'moderate'
        vocabularyLevel = 'intermediate'
        grammarFocus = ['past tense', 'conditional', 'complex sentences']
        break
      case 'advanced':
        complexity = 'complex'
        vocabularyLevel = 'advanced'
        grammarFocus = ['subjunctive', 'idiomatic expressions', 'nuanced vocabulary']
        break
    }

    // Identify weaknesses
    const scores = [
      { name: 'grammar', value: progress.grammarScore },
      { name: 'vocabulary', value: progress.vocabularyScore },
      { name: 'pronunciation', value: progress.pronunciationScore },
    ]
    scores.sort((a, b) => a.value - b.value)
    
    // Add focus areas based on weaknesses (only if scores exist)
    if (scores.length > 0 && scores[0].value < 50) {
      if (scores[0].name === 'grammar') {
        grammarFocus.push('grammar fundamentals')
      } else if (scores[0].name === 'vocabulary') {
        grammarFocus.push('vocabulary building')
      } else {
        grammarFocus.push('pronunciation practice')
      }
    }

    return {
      complexity,
      vocabularyLevel,
      grammarFocus,
    }
  }

  getLearningRecommendations(userId: string = 'default'): string[] {
    const skillLevel = this.assessSkillLevel(userId)
    const progress = progressService.getProgress(userId)
    const recommendations: string[] = []

    if (progress.totalConversations < 5) {
      recommendations.push('Practice more conversations to build confidence')
    }

    if (progress.streak < 3) {
      recommendations.push('Try to practice daily to maintain your streak!')
    }

    if (skillLevel.grammar < 60) {
      recommendations.push('Focus on grammar exercises and corrections')
    }

    if (skillLevel.vocabulary < 60) {
      recommendations.push('Expand your vocabulary with new words and phrases')
    }

    if (skillLevel.pronunciation < 60) {
      recommendations.push('Practice pronunciation with native-like patterns')
    }

    if (recommendations.length === 0) {
      recommendations.push('Great progress! Keep practicing to maintain your skills')
    }

    return recommendations
  }
}

export const personalizationService = new PersonalizationService()
export default personalizationService

