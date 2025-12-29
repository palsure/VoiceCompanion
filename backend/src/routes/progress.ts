import { Router, Request, Response } from 'express'
import { progressService } from '../services/progressService.js'

const router = Router()

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

