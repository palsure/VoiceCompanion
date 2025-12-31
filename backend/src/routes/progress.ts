import { Router, Request, Response } from 'express'
import { progressService } from '../services/progressService.js'

const router = Router()

/**
 * @swagger
 * /api/progress:
 *   get:
 *     summary: Get user learning progress
 *     tags: [Language Learning]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User progress data
 *       500:
 *         description: Server error
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default'
    const progress = progressService.getProgress(userId)
    res.json(progress)
  } catch (error: any) {
    console.error('Get progress error:', error)
    res.status(500).json({ error: error.message || 'Failed to get progress' })
  }
})

/**
 * @swagger
 * /api/progress:
 *   post:
 *     summary: Update user learning progress
 *     tags: [Language Learning]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated progress
 *       500:
 *         description: Server error
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const userId = (req.body.userId as string) || 'default'
    const updates = req.body

    const updated = progressService.updateProgress(userId, updates)
    res.json(updated)
  } catch (error: any) {
    console.error('Update progress error:', error)
    res.status(500).json({ error: error.message || 'Failed to update progress' })
  }
})

export default router

