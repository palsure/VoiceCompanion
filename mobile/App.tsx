import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AccessibilityProvider } from './src/contexts/AccessibilityContext'
import HomeScreen from './src/screens/HomeScreen'
import LearningModeScreen from './src/screens/LearningModeScreen'
import AccessibilityModeScreen from './src/screens/AccessibilityModeScreen'
import ProgressScreen from './src/screens/ProgressScreen'
import VoiceToImageScreen from './src/screens/VoiceToImageScreen'
import ImageToVoiceScreen from './src/screens/ImageToVoiceScreen'
import BlindGuidanceScreen from './src/screens/BlindGuidanceScreen'
import VoiceGuidedShoppingScreen from './src/screens/VoiceGuidedShoppingScreen'

export type RootStackParamList = {
  Home: undefined
  Learning: undefined
  Accessibility: undefined
  Progress: undefined
  VoiceToImage: undefined
  ImageToVoice: undefined
  BlindGuidance: undefined
  VoiceGuidedShopping: undefined
}

const Stack = createStackNavigator<RootStackParamList>()

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message}</Text>
        </View>
      )
    }

    return this.props.children
  }
}

export default function App() {
  console.log('App component rendering...')
  
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <SafeAreaProvider>
          <NavigationContainer
            onReady={() => console.log('Navigation ready')}
            onStateChange={() => console.log('Navigation state changed')}
          >
            <StatusBar style="light" />
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#667eea',
                  height: 100, // Increased height for subtitle
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ 
                headerTitle: () => {
                  try {
                    const iconSource = require('./assets/icon.png')
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 20 }}>
                        <Image 
                          source={iconSource} 
                          style={{ width: 48, height: 48, marginRight: 10, borderRadius: 24 }}
                          resizeMode="contain"
                        />
                        <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 2 }}>
                            VoiceCompanion
                          </Text>
                          <Text style={{ color: '#fff', fontSize: 12, opacity: 0.9, lineHeight: 16 }}>
                            Your Intelligent Voice Assistant for Accessibility & Learning
                          </Text>
                        </View>
                      </View>
                    )
                  } catch (error) {
                    // Fallback if icon fails to load
                    return (
                      <View style={{ flexDirection: 'column', alignItems: 'flex-start', paddingRight: 20 }}>
                        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 2 }}>
                          🎙️ VoiceCompanion
                        </Text>
                        <Text style={{ color: '#fff', fontSize: 12, opacity: 0.9, lineHeight: 16 }}>
                          Your Intelligent Voice Assistant for Accessibility & Learning
                        </Text>
                      </View>
                    )
                  }
                },
                headerTitleAlign: 'left',
                headerStyle: {
                  backgroundColor: '#667eea',
                  height: 100,
                },
              }}
            />
            <Stack.Screen 
              name="Learning" 
              component={LearningModeScreen}
              options={{ title: 'Language Learning' }}
            />
            <Stack.Screen 
              name="Accessibility" 
              component={AccessibilityModeScreen}
              options={{ title: 'Accessibility Assistant' }}
            />
            <Stack.Screen 
              name="Progress" 
              component={ProgressScreen}
              options={{ title: 'Your Progress' }}
            />
            <Stack.Screen 
              name="VoiceToImage" 
              component={VoiceToImageScreen}
              options={{ 
                title: '🎨 Voice to Art',
                headerTitle: '🎨 Voice to Art'
              }}
            />
            <Stack.Screen 
              name="ImageToVoice" 
              component={ImageToVoiceScreen}
              options={{ title: '📸 Image to Voice' }}
            />
            <Stack.Screen 
              name="BlindGuidance" 
              component={BlindGuidanceScreen}
              options={{ title: 'Real-Time Guidance' }}
            />
            <Stack.Screen 
              name="VoiceGuidedShopping" 
              component={VoiceGuidedShoppingScreen}
              options={{ title: 'Voice Guided Shopping' }}
            />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#f44336',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
})

