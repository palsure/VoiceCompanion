import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../App'
import ProgressTracker from '../components/ProgressTracker'

type ProgressScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Progress'>

interface Props {
  navigation: ProgressScreenNavigationProp
}

const ProgressScreen = ({ navigation }: Props) => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ProgressTracker />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
})

export default ProgressScreen


