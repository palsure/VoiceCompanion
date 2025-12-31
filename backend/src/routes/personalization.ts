import { Router, Request, Response } from 'express'
import { personalizationService } from '../services/personalizationService.js'

const router = Router()

/**
 * @swagger
 * /api/personalization/skill-level:
 *   get:
 *     summary: Get user skill level assessment
 *     tags: [Language Learning]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID (defaults to 'default')
 *     responses:
 *       200:
 *         description: Skill level assessment
 *       500:
 *         description: Server error
 */
router.get('/skill-level', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default'
    console.log('Getting skill level for userId:', userId)
    const skillLevel = personalizationService.assessSkillLevel(userId)
    console.log('Skill level result:', skillLevel)
    res.json(skillLevel)
  } catch (error: any) {
    console.error('Get skill level error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({ 
      error: error.message || 'Failed to get skill level',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

/**
 * @swagger
 * /api/personalization/difficulty:
 *   get:
 *     summary: Get adaptive difficulty settings
 *     tags: [Language Learning]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Difficulty settings
 *       500:
 *         description: Server error
 */
router.get('/difficulty', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default'
    const difficulty = personalizationService.getAdaptiveDifficulty(userId)
    res.json(difficulty)
  } catch (error: any) {
    console.error('Get difficulty error:', error)
    res.status(500).json({ error: error.message || 'Failed to get difficulty' })
  }
})

/**
 * @swagger
 * /api/personalization/recommendations:
 *   get:
 *     summary: Get learning recommendations
 *     tags: [Language Learning]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Learning recommendations
 *       500:
 *         description: Server error
 */
router.get('/recommendations', (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || 'default'
    const recommendations = personalizationService.getLearningRecommendations(userId)
    res.json({ recommendations })
  } catch (error: any) {
    console.error('Get recommendations error:', error)
    res.status(500).json({ error: error.message || 'Failed to get recommendations' })
  }
})

export default router

