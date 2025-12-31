import React, { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

interface FeatureInfoIconProps {
  title: string
  description: string
  howItWorks: string[]
  features?: string[]
}

const FeatureInfoIcon = ({ title, description, howItWorks, features }: FeatureInfoIconProps) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Learn more about ${title}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.iconButton, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.iconText}>ℹ️</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              <Text style={styles.description}>{description}</Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How it works</Text>
                {howItWorks.map((s, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <Text style={styles.stepNumber}>{idx + 1}.</Text>
                    <Text style={styles.stepText}>{s}</Text>
                  </View>
                ))}
              </View>

              {features && features.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Key features</Text>
                  {features.map((f, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={styles.bulletMark}>✓</Text>
                      <Text style={styles.bulletText}>{f}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 18,
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a1a',
    flex: 1,
    paddingRight: 10,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '900',
  },
  modalBody: {
    paddingHorizontal: 16,
  },
  modalBodyContent: {
    paddingVertical: 14,
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 14,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#333',
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  stepNumber: {
    width: 18,
    fontWeight: '900',
    color: '#666',
  },
  stepText: {
    flex: 1,
    color: '#444',
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  bulletMark: {
    width: 18,
    color: '#4caf50',
    fontWeight: '900',
  },
  bulletText: {
    flex: 1,
    color: '#444',
    lineHeight: 20,
  },
})

export default FeatureInfoIcon


