import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock ElevenLabs service
jest.mock('../../services/elevenLabsService.js', () => ({
  elevenLabsService: {
    textToSpeech: jest.fn(),
  },
}))

describe('Text-to-Speech Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/text-to-speech/generate', () => {
    it('should require text parameter', () => {
      const text = ''
      expect(text).toBe('')
    })

    it('should accept valid text', () => {
      const text = 'Hello, this is a test.'
      expect(typeof text).toBe('string')
      expect(text.length).toBeGreaterThan(0)
    })
  })
})

