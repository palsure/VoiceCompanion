import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native'

interface FeedbackPanelProps {
  feedback: any
}

const FeedbackPanel = ({ feedback }: FeedbackPanelProps) => {
  if (!feedback) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>💬 Feedback</Text>
        <Text style={styles.placeholder}>
          Start a conversation to receive real-time feedback!
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 Feedback</Text>
      <ScrollView style={styles.content}>
        {feedback.grammar && feedback.grammar.corrections?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Grammar</Text>
            {feedback.grammar.corrections.map((correction: any, idx: number) => (
              <View key={idx} style={styles.correction}>
                <Text style={styles.incorrect}>{correction.incorrect}</Text>
                <Text style={styles.arrow}> → </Text>
                <Text style={styles.correct}>{correction.correct}</Text>
                {correction.explanation && (
                  <Text style={styles.explanation}>{correction.explanation}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {feedback.vocabulary && feedback.vocabulary.suggestions?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Vocabulary</Text>
            {feedback.vocabulary.suggestions.map((suggestion: string, idx: number) => (
              <View key={idx} style={styles.suggestion}>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </View>
        )}

        {feedback.pronunciation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Pronunciation</Text>
            <Text style={styles.score}>
              Score: {feedback.pronunciation.score}/100
            </Text>
            {feedback.pronunciation.feedback && (
              <Text style={styles.feedbackText}>{feedback.pronunciation.feedback}</Text>
            )}
          </View>
        )}

        {feedback.cultural && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌍 Cultural Context</Text>
            <Text style={styles.feedbackText}>{feedback.cultural}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    maxHeight: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  placeholder: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  correction: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  incorrect: {
    textDecorationLine: 'line-through',
    color: '#d32f2f',
    fontWeight: '500',
  },
  arrow: {
    color: '#666',
    fontWeight: 'bold',
  },
  correct: {
    color: '#388e3c',
    fontWeight: '500',
  },
  explanation: {
    width: '100%',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  suggestion: {
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  suggestionText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
  },
  feedbackText: {
    color: '#555',
    lineHeight: 20,
    fontSize: 14,
  },
})

export default FeedbackPanel


