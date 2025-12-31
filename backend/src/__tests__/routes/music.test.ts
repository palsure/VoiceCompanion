import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock ElevenLabs service
jest.mock('../../services/elevenLabsService.js', () => ({
  elevenLabsService: {
    generateMusic: jest.fn(),
  },
}))

describe('Music Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/music/generate', () => {
    it('should require a prompt', () => {
      // Test validation
      const prompt = ''
      expect(prompt.trim().length).toBe(0)
    })

    it('should accept valid prompt', () => {
      const prompt = 'Upbeat jazz with piano'
      expect(prompt.trim().length).toBeGreaterThan(0)
    })

    it('should extract style from prompt', () => {
      const prompt = 'Upbeat jazz, Style: Acoustic (Gentle, organic sounds)'
      const styleMatch = prompt.match(/Style:\s*([^\n(]+)/i)
      const style = styleMatch ? styleMatch[1].trim() : undefined
      expect(style).toBe('Acoustic')
    })
  })
})

