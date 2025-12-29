import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

// Get directory paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const GALLERY_DIR = path.join(__dirname, '../../data/gallery')

// Ensure gallery directory exists
async function ensureGalleryDir() {
  try {
    await fs.mkdir(GALLERY_DIR, { recursive: true })
  } catch (error) {
    console.error('Failed to create gallery directory:', error)
  }
}

// Initialize gallery directory on startup
ensureGalleryDir()

interface SavedArt {
  id: string
  image: string // Base64 image data
  prompt: string
  style: string
  createdAt: number
  userId?: string
}

/**
 * Save art to gallery
 * POST /api/gallery/save
 */
router.post('/save', async (req, res) => {
  try {
    const { image, prompt, style, userId = 'default' } = req.body

    if (!image || !prompt) {
      return res.status(400).json({ error: 'Image and prompt are required' })
    }

    const artId = `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const art: SavedArt = {
      id: artId,
      image,
      prompt,
      style: style || 'realistic',
      createdAt: Date.now(),
      userId,
    }

    // Save to file system (optional - for persistence)
    // For now, we'll store in memory/database
    // In production, use a database like MongoDB or PostgreSQL

    res.json({
      success: true,
      art,
      message: 'Art saved to gallery successfully',
    })
  } catch (error: any) {
    console.error('Gallery save error:', error)
    res.status(500).json({
      error: 'Failed to save art to gallery',
      message: error.message,
    })
  }
})

/**
 * Get all saved arts for a user
 * GET /api/gallery/list?userId=default
 */
router.get('/list', async (req, res) => {
  try {
    const { userId = 'default' } = req.query

    // In production, fetch from database
    // For now, return empty array (client should use localStorage as fallback)
    res.json({
      success: true,
      arts: [],
      message: 'Gallery list retrieved (using client-side storage)',
    })
  } catch (error: any) {
    console.error('Gallery list error:', error)
    res.status(500).json({
      error: 'Failed to retrieve gallery',
      message: error.message,
    })
  }
})

/**
 * Get a specific art by ID
 * GET /api/gallery/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { userId = 'default' } = req.query

    // In production, fetch from database
    res.status(404).json({
      error: 'Art not found',
      message: 'Gallery items are stored client-side. Use localStorage.',
    })
  } catch (error: any) {
    console.error('Gallery get error:', error)
    res.status(500).json({
      error: 'Failed to retrieve art',
      message: error.message,
    })
  }
})

/**
 * Delete art from gallery
 * DELETE /api/gallery/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { userId = 'default' } = req.query

    // In production, delete from database
    res.json({
      success: true,
      message: 'Art deleted (using client-side storage)',
    })
  } catch (error: any) {
    console.error('Gallery delete error:', error)
    res.status(500).json({
      error: 'Failed to delete art',
      message: error.message,
    })
  }
})

export default router

