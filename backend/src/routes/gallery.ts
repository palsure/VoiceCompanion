import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

// Get directory paths
// Use /tmp on Cloud Run (read-only filesystem), otherwise use local data directory
const GALLERY_DIR = process.env.NODE_ENV === 'production' 
  ? '/tmp/gallery' 
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '../../data/gallery')

// Ensure gallery directory exists (non-blocking)
async function ensureGalleryDir() {
  try {
    await fs.mkdir(GALLERY_DIR, { recursive: true })
    console.log(`Gallery directory ready: ${GALLERY_DIR}`)
  } catch (error) {
    console.error('Failed to create gallery directory:', error)
    // Don't throw - allow server to start even if gallery dir creation fails
  }
}

// Initialize gallery directory on startup (non-blocking, don't await)
ensureGalleryDir().catch(err => {
  console.error('Gallery directory initialization error (non-fatal):', err)
})

interface SavedArt {
  id: string
  image: string // Base64 image data
  prompt: string
  style: string
  createdAt: number
  userId?: string
}

function safeUserId(userId: string) {
  return String(userId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_')
}

function galleryFilePath(userId: string) {
  return path.join(GALLERY_DIR, `${safeUserId(userId)}.json`)
}

async function readGallery(userId: string): Promise<SavedArt[]> {
  const file = galleryFilePath(userId)
  try {
    const raw = await fs.readFile(file, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err: any) {
    if (err?.code === 'ENOENT') return []
    throw err
  }
}

async function writeGallery(userId: string, arts: SavedArt[]) {
  await ensureGalleryDir()
  const file = galleryFilePath(userId)
  await fs.writeFile(file, JSON.stringify(arts, null, 2), 'utf8')
}

/**
 * @swagger
 * /api/gallery/save:
 *   post:
 *     summary: Save art to gallery
 *     tags: [Gallery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *               - prompt
 *             properties:
 *               image:
 *                 type: string
 *                 description: Base64 encoded image data
 *               prompt:
 *                 type: string
 *                 description: Text prompt used to generate the image
 *               style:
 *                 type: string
 *                 description: Art style (e.g., "realistic", "artistic", "cartoon")
 *               userId:
 *                 type: string
 *                 description: User ID (defaults to "default")
 *     responses:
 *       200:
 *         description: Art saved successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
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

    const existing = await readGallery(userId)
    const updated = [art, ...existing].slice(0, 200) // basic cap to avoid runaway storage
    await writeGallery(userId, updated)

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
 * @swagger
 * /api/gallery/list:
 *   get:
 *     summary: Get all saved arts for a user
 *     tags: [Gallery]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID (defaults to "default")
 *     responses:
 *       200:
 *         description: Gallery list retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 arts:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/list', async (req, res) => {
  try {
    const { userId = 'default' } = req.query

    const arts = await readGallery(String(userId))
    res.json({
      success: true,
      arts,
      message: 'Gallery list retrieved',
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

    const arts = await readGallery(String(userId))
    const art = arts.find((a) => a.id === id)
    if (!art) {
      return res.status(404).json({ error: 'Art not found' })
    }
    res.json({ success: true, art })
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

    const arts = await readGallery(String(userId))
    const next = arts.filter((a) => a.id !== id)
    await writeGallery(String(userId), next)
    res.json({
      success: true,
      message: 'Art deleted',
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

