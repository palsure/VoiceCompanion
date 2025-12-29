import { useRef, useEffect } from 'react'
import { TouchableOpacity, TouchableOpacityProps } from 'react-native'
import { useAccessibility } from '../contexts/AccessibilityContext'

interface UseAccessibleButtonOptions {
  label: string
  description?: string
  delay?: number
  onPress?: () => void
}

/**
 * Hook to make buttons accessible with voice descriptions
 * Returns props that should be spread onto TouchableOpacity
 */
export const useAccessibleButton = ({
  label,
  description,
  delay = 300,
  onPress,
}: UseAccessibleButtonOptions) => {
  const { speak, isEnabled } = useAccessibility()
  const hasSpokenRef = useRef(false)

  const handlePressIn = () => {
    if (isEnabled && !hasSpokenRef.current) {
      const text = description ? `${label}. ${description}` : label
      speak(text, { delay })
      hasSpokenRef.current = true
    }
  }

  const handlePress = () => {
    if (onPress) {
      onPress()
    }
    // Reset after a delay so it can speak again if pressed multiple times
    setTimeout(() => {
      hasSpokenRef.current = false
    }, 1000)
  }

  return {
    onPressIn: handlePressIn,
    onPress: handlePress,
    accessible: true,
    accessibilityLabel: description ? `${label}. ${description}` : label,
    accessibilityRole: 'button' as const,
  }
}

/**
 * Hook to announce screen content when screen loads
 */
export const useAccessibleScreen = (title: string, description?: string) => {
  const { speak, isEnabled } = useAccessibility()
  const hasAnnouncedRef = useRef(false)

  useEffect(() => {
    if (isEnabled && !hasAnnouncedRef.current) {
      const text = description ? `${title}. ${description}` : title
      speak(text, { delay: 500 })
      hasAnnouncedRef.current = true
    }
  }, [isEnabled, title, description, speak])
}

