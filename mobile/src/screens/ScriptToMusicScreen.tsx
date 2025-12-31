import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system/legacy'
import * as MediaLibrary from 'expo-media-library'
import { musicApi, speechToTextApi } from '../services/api'
import { useAccessibleScreen } from '../hooks/useAccessibleButton'
import FeatureInfoIcon from '../components/FeatureInfoIcon'

type FileSystemEncoding = 'utf8' | 'base64'

const STORAGE_KEY = 'voiceCompanion_savedMusic'

const MUSIC_STYLES = [
  { id: 'acoustic', label: 'Acoustic', description: 'Gentle, organic sounds' },
  { id: 'electronic', label: 'Electronic', description: 'Modern synth and beats' },
  { id: 'classical', label: 'Classical', description: 'Orchestral and traditional' },
  { id: 'jazz', label: 'Jazz', description: 'Smooth and sophisticated' },
  { id: 'rock', label: 'Rock', description: 'Energetic and powerful' },
  { id: 'ambient', label: 'Ambient', description: 'Atmospheric and relaxing' },
]

const DEFAULT_LYRICS = `Verse 1:
Walking through the morning light
Everything feels so bright
New day brings new hope
Learning how to cope

Chorus:
Music fills the air
With melodies so fair
Every note tells a story
Of love, hope, and glory`

interface SavedMusic {
  id: string
  title: string
  script: string
  style: string
  lengthSeconds: number
  fileUri: string
  createdAt: number
}

const ScriptToMusicScreen = () => {
  useAccessibleScreen(
    'Script to Music',
    'Convert lyrics or a script into music. Generate, play, and save your tracks.'
  )

  const [activeTab, setActiveTab] = useState<'create' | 'music'>('create')

  const [script, setScript] = useState(DEFAULT_LYRICS)
  const [musicStyle, setMusicStyle] = useState('acoustic')
  const [musicLength, setMusicLength] = useState(30)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [generatedFileUri, setGeneratedFileUri] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const [savedMusic, setSavedMusic] = useState<SavedMusic[]>([])
  const [playingId, setPlayingId] = useState<string | null>(null)

  const soundRef = useRef<Audio.Sound | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw)
        setSavedMusic(Array.isArray(parsed) ? parsed : [])
      } catch (e) {
        console.warn('Failed to load saved music:', e)
      }
    }
    loadSaved()

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {})
      }
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedMusic)).catch(() => {})
  }, [savedMusic])

  const stopAnyPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync()
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }
    } catch {}
    setIsPlaying(false)
    setPlayingId(null)
  }

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = String(reader.result || '')
        const base64 = result.includes(',') ? result.split(',')[1] : result
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Failed to read audio data'))
      reader.readAsDataURL(blob)
    })

  const handleGenerate = async () => {
    if (!script.trim()) {
      setError('Please enter lyrics or a description for the music')
      return
    }

    setLoading(true)
    setError(null)
    setGeneratedFileUri(null)
    await stopAnyPlayback()

    try {
      const styleInfo = MUSIC_STYLES.find((s) => s.id === musicStyle)
      const enhancedPrompt = `${script.trim()}\n\nStyle: ${styleInfo?.label || musicStyle}${
        styleInfo ? ` (${styleInfo.description})` : ''
      }`

      const blob = await musicApi.generate(enhancedPrompt, {
        musicLengthMs: Math.max(15, Math.min(musicLength, 600)) * 1000,
        modelId: 'music_v1',
        forceInstrumental: true,
        respectSectionsDurations: true,
        storeForInpainting: false,
        signWithC2pa: false,
      })

      const base64 = await blobToBase64(blob)
      const fileUri = `${FileSystem.documentDirectory}music_${Date.now()}.mp3`
      const encoding: FileSystemEncoding = 'base64'
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding })
      setGeneratedFileUri(fileUri)
    } catch (err: any) {
      console.error('Music generation error:', err)
      setError(err?.message || 'Failed to generate music')
    } finally {
      setLoading(false)
    }
  }

  const playUri = async (uri: string, id?: string) => {
    await stopAnyPlayback()
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0 }
      )
      soundRef.current = sound
      setIsPlaying(true)
      setPlayingId(id || 'generated')

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return
        if (status.didJustFinish) {
          setIsPlaying(false)
          setPlayingId(null)
          sound.unloadAsync().catch(() => {})
          soundRef.current = null
        }
      })
    } catch (e: any) {
      console.error('Playback error:', e)
      setError(e?.message || 'Failed to play audio')
      setIsPlaying(false)
      setPlayingId(null)
    }
  }

  const handleSaveGenerated = async () => {
    if (!generatedFileUri) {
      Alert.alert('No Music', 'Generate music first, then save it.')
      return
    }

    try {
      const perm = await MediaLibrary.requestPermissionsAsync()
      if (perm.status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow media library access to save music.')
        return
      }

      const asset = await MediaLibrary.createAssetAsync(generatedFileUri)
      await MediaLibrary.createAlbumAsync('VoiceCompanion Music', asset, false).catch(() => {})

      const styleInfo = MUSIC_STYLES.find((s) => s.id === musicStyle)
      const titleBase = script.trim().split('\n').find(Boolean) || 'Generated Music'
      const title = titleBase.length > 40 ? `${titleBase.slice(0, 40)}…` : titleBase

      const item: SavedMusic = {
        id: `music_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        script: script.trim(),
        style: styleInfo?.label || musicStyle,
        lengthSeconds: musicLength,
        fileUri: generatedFileUri,
        createdAt: Date.now(),
      }

      setSavedMusic((prev) => [item, ...prev])
      Alert.alert('Saved', 'Music saved to your device and added to My Music.')
    } catch (e: any) {
      console.error('Save music error:', e)
      Alert.alert('Error', e?.message || 'Failed to save music')
    }
  }

  const handleDeleteSaved = (id: string) => {
    Alert.alert('Delete Music?', 'This will remove it from My Music (file may remain on device).', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (playingId === id) {
            await stopAnyPlayback()
          }
          setSavedMusic((prev) => prev.filter((m) => m.id !== id))
        },
      },
    ])
  }

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone permission is required for voice input.')
        return
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      )
      setRecording(newRecording)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording', err)
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = async () => {
    if (!recording) return
    setIsRecording(false)
    setLoading(true)
    try {
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecording(null)
      if (!uri) throw new Error('No audio file found')

      const encoding: FileSystemEncoding = 'base64'
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding })
      const audioDataUri = `data:audio/m4a;base64,${base64Audio}`

      const result: any = await speechToTextApi.transcribe(audioDataUri, 'en-US')
      const transcription = result.transcription || result.text || result.transcript || ''
      if (!transcription || !String(transcription).trim()) {
        throw new Error('No transcription received')
      }
      setScript(String(transcription).trim())
      Alert.alert('Success', 'Your voice has been transcribed!')
    } catch (e: any) {
      console.error('Transcription error:', e)
      Alert.alert('Transcription Error', e?.message || 'Failed to transcribe audio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>🎵 Script to Music</Text>
          <FeatureInfoIcon
            title="Script to Music"
            description="Turn lyrics or a script into music. Powered by ElevenLabs Music Generation with fallback."
            howItWorks={[
              'Enter lyrics or record voice and transcribe to text',
              'Pick a music style and length',
              'Generate music using ElevenLabs Music API (fallback available)',
              'Play and save tracks to My Music',
            ]}
            features={[
              'ElevenLabs Music Generation',
              'Voice input transcription',
              'Save and play from My Music',
            ]}
          />
        </View>
        <Text style={styles.subtitle}>Convert your lyrics or voice into beautiful music</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'create' && styles.tabButtonActive]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabText, activeTab === 'create' && styles.tabTextActive]}>
            Create Music
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'music' && styles.tabButtonActive]}
          onPress={() => setActiveTab('music')}
        >
          <Text style={[styles.tabText, activeTab === 'music' && styles.tabTextActive]}>
            My Music ({savedMusic.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'create' ? (
        <>
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Describe the music you want:</Text>
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={loading}
              >
                <Text style={styles.voiceButtonText}>
                  {isRecording ? '⏹ Stop' : '🎤 Voice Input'}
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.textInput}
              value={script}
              onChangeText={setScript}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="Enter lyrics or a music description..."
              editable={!loading}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Music Style:</Text>
            <View style={styles.styleGrid}>
              {MUSIC_STYLES.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.styleChip, musicStyle === s.id && styles.styleChipActive]}
                  onPress={() => setMusicStyle(s.id)}
                  disabled={loading}
                >
                  <Text style={[styles.styleChipText, musicStyle === s.id && styles.styleChipTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.rowBetween, { marginTop: 14 }]}>
              <Text style={styles.label}>Length (seconds):</Text>
              <TextInput
                style={styles.lengthInput}
                value={String(musicLength)}
                onChangeText={(v) => setMusicLength(Number(v.replace(/[^0-9]/g, '')) || 30)}
                keyboardType="number-pad"
                editable={!loading}
              />
            </View>
            <Text style={styles.hint}>Tip: 30–60s is fastest for demos.</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.generateButton, (loading || !script.trim()) && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={loading || !script.trim()}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateButtonText}>🎵 Generate Music</Text>}
          </TouchableOpacity>

          {generatedFileUri && !loading ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>Generated Music</Text>
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => {
                    if (isPlaying && playingId === 'generated') {
                      stopAnyPlayback()
                      return
                    }
                    playUri(generatedFileUri, 'generated')
                  }}
                >
                  <Text style={styles.playButtonText}>
                    {isPlaying && playingId === 'generated' ? '⏸ Pause' : '▶ Play'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveGenerated}>
                  <Text style={styles.saveButtonText}>💾 Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.section}>
          {savedMusic.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No saved music yet</Text>
              <Text style={styles.emptyText}>Generate music and tap Save to add it here.</Text>
            </View>
          ) : (
            savedMusic.map((m) => (
              <View key={m.id} style={styles.musicItem}>
                <View style={styles.musicItemHeader}>
                  <Text style={styles.musicTitle}>{m.title}</Text>
                  <Text style={styles.musicMeta}>
                    {m.style} • {m.lengthSeconds}s
                  </Text>
                </View>
                <View style={styles.controlsRow}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => {
                      if (isPlaying && playingId === m.id) {
                        stopAnyPlayback()
                        return
                      }
                      playUri(m.fileUri, m.id)
                    }}
                  >
                    <Text style={styles.playButtonText}>
                      {isPlaying && playingId === m.id ? '⏸ Pause' : '▶ Play'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteSaved(m.id)}>
                    <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.dateText}>
                  {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', lineHeight: 20 },

  tabs: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  tabButtonActive: { borderColor: '#e91e63', backgroundColor: '#fff7fb' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#666' },
  tabTextActive: { color: '#e91e63' },

  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e9e9e9',
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  label: { fontSize: 14, fontWeight: '800', color: '#333' },
  hint: { marginTop: 8, fontSize: 12, color: '#777' },

  textInput: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 140,
    fontSize: 14,
  },

  voiceButton: {
    backgroundColor: '#764ba2',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  voiceButtonActive: { backgroundColor: '#f44336' },
  voiceButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  styleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  styleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  styleChipActive: { backgroundColor: '#e91e63', borderColor: '#e91e63' },
  styleChipText: { color: '#666', fontWeight: '700', fontSize: 12 },
  styleChipTextActive: { color: '#fff' },

  lengthInput: {
    width: 90,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    fontWeight: '800',
  },

  generateButton: {
    backgroundColor: '#e91e63',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  generateButtonDisabled: { opacity: 0.6 },
  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    marginBottom: 12,
  },
  errorText: { color: '#c62828', fontWeight: '700' },

  resultBox: {
    backgroundColor: '#fff9e6',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e91e63',
    marginBottom: 20,
  },
  resultTitle: { fontSize: 16, fontWeight: '900', color: '#e91e63', marginBottom: 12 },
  controlsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },

  playButton: {
    flexGrow: 1,
    minWidth: 140,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#4caf50',
    alignItems: 'center',
  },
  playButtonText: { color: '#fff', fontWeight: '900' },

  saveButton: {
    flexGrow: 1,
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#ff9800',
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '900' },

  deleteButton: {
    flexGrow: 1,
    minWidth: 120,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  deleteButtonText: { color: '#555', fontWeight: '900' },

  empty: { paddingVertical: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#333', marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#666', textAlign: 'center' },

  musicItem: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  musicItemHeader: { marginBottom: 10 },
  musicTitle: { fontSize: 15, fontWeight: '900', color: '#222', marginBottom: 4 },
  musicMeta: { fontSize: 12, color: '#666', fontWeight: '700' },
  dateText: { marginTop: 10, fontSize: 11, color: '#999' },
})

export default ScriptToMusicScreen


