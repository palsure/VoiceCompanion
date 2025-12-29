import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native'
import api from '../services/api'

const ProgressTracker = () => {
  const [progress, setProgress] = useState({
    totalConversations: 0,
    totalTime: 0,
    grammarScore: 0,
    vocabularyScore: 0,
    pronunciationScore: 0,
    streak: 0,
  })
  const [skillLevel, setSkillLevel] = useState<string>('beginner')
  const [recommendations, setRecommendations] = useState<string[]>([])

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const [progressRes, skillRes, recRes] = await Promise.all([
          api.get('/progress').catch(() => ({ data: null })),
          api.get('/personalization/skill-level').catch(() => ({ data: null })),
          api.get('/personalization/recommendations').catch(() => ({ data: null })),
        ])

        if (progressRes?.data) {
          setProgress(progressRes.data)
        }

        if (skillRes?.data) {
          setSkillLevel(skillRes.data.level)
        }

        if (recRes?.data?.recommendations) {
          setRecommendations(recRes.data.recommendations)
        }
      } catch (error) {
        console.error('Failed to load progress:', error)
        // Don't block rendering if API fails
      }
    }

    // Delay initial load to prevent blocking render
    const timeout = setTimeout(loadProgress, 100)
    const interval = setInterval(loadProgress, 5000)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Your Progress</Text>

      <View style={styles.skillBadge}>
        <Text style={styles.skillLabel}>Skill Level:</Text>
        <Text style={styles.skillValue}>
          {skillLevel.toUpperCase()}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progress.totalConversations}</Text>
          <Text style={styles.statLabel}>Conversations</Text>
        </View>
        <View style={{ width: 12 }} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.floor(progress.totalTime / 60)}m</Text>
          <Text style={styles.statLabel}>Practice Time</Text>
        </View>
        <View style={{ width: 12 }} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{progress.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      <View style={styles.scoresContainer}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Grammar</Text>
          <View style={styles.scoreBar}>
            <View
              style={[styles.scoreFill, { width: `${progress.grammarScore}%` }]}
            />
          </View>
          <Text style={styles.scoreValue}>{progress.grammarScore}%</Text>
        </View>
        <View style={{ marginTop: 12 }} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Vocabulary</Text>
          <View style={styles.scoreBar}>
            <View
              style={[styles.scoreFill, { width: `${progress.vocabularyScore}%` }]}
            />
          </View>
          <Text style={styles.scoreValue}>{progress.vocabularyScore}%</Text>
        </View>
        <View style={{ marginTop: 12 }} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Pronunciation</Text>
          <View style={styles.scoreBar}>
            <View
              style={[styles.scoreFill, { width: `${progress.pronunciationScore}%` }]}
            />
          </View>
          <Text style={styles.scoreValue}>{progress.pronunciationScore}%</Text>
        </View>
      </View>

      {recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>💡 Recommendations</Text>
          {recommendations.map((rec, idx) => (
            <View key={idx} style={styles.recommendationItem}>
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#667eea',
    borderRadius: 12,
    marginBottom: 16,
  },
  skillLabel: {
    color: '#fff',
    fontWeight: '500',
  },
  skillValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    marginLeft: 8,
  },
  beginner: {},
  intermediate: {},
  advanced: {},
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  scoresContainer: {
    marginBottom: 20,
  },
  scoreItem: {
    gap: 8,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  scoreBar: {
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    textAlign: 'right',
  },
  recommendationsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recommendationItem: {
    padding: 12,
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    borderRadius: 6,
    marginBottom: 8,
  },
  recommendationText: {
    color: '#856404',
    lineHeight: 20,
  },
})

export default ProgressTracker

