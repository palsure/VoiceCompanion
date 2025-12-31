# API Documentation

## Accessing Documentation

Once the server is running, you can access the API documentation at:

- **Swagger UI**: `http://localhost:5000/docs`
- **OpenAPI JSON**: `http://localhost:5000/docs.json`

## API Endpoints

### Health Check
- `GET /health` - Check server health status

### Vision
- `POST /api/vision/analyze` - Analyze an image and provide description
- `POST /api/vision/text` - Extract text from an image (OCR)

### Image Generation
- `POST /api/image-generation/generate` - Generate image from text/voice description

### Text-to-Speech
- `POST /api/text-to-speech/generate` - Generate speech from text using ElevenLabs

### Music
- `POST /api/music/generate` - Generate music from text/script

### Gallery
- `POST /api/gallery/save` - Save art to gallery
- `GET /api/gallery/list` - Get all saved arts for a user
- `DELETE /api/gallery/:id` - Delete art from gallery

## Adding Documentation

To add Swagger documentation to a new route, add JSDoc comments above the route handler:

```typescript
/**
 * @swagger
 * /api/my-route:
 *   post:
 *     summary: Brief description
 *     tags: [MyTag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/my-route', async (req, res) => {
  // Route implementation
})
```

## Tags

Available tags for organizing endpoints:
- Health
- Vision
- Image Generation
- Text-to-Speech
- Speech-to-Text
- Music
- Gallery
- Guidance
- Conversation
- Language Learning

