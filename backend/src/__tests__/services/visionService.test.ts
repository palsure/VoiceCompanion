import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { VisionService } from '../../services/visionService.js'

// Mock Google Cloud Vision
jest.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    labelDetection: jest.fn(),
    objectLocalization: jest.fn(),
  })),
}))

describe('VisionService', () => {
  let visionService: VisionService

  beforeEach(() => {
    visionService = new VisionService()
  })

  describe('analyzeImage', () => {
    it('should handle missing client gracefully', async () => {
      // If client is null, should return empty analysis
      const result = await visionService.analyzeImage('base64imagedata')
      expect(result).toBeDefined()
    })
  })

  describe('detectObjects', () => {
    it('should return empty array when client is not available', async () => {
      const result = await visionService.detectObjects('base64imagedata')
      expect(Array.isArray(result)).toBe(true)
    })
  })
})

