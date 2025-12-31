# Testing and Documentation Setup

This document describes the testing and API documentation setup for the VoiceCompanion backend.

## Testing

### Setup

The backend uses **Jest** with **ts-jest** for TypeScript support and ESM modules.

### Running Tests

```bash
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
backend/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts              # Test configuration
│   │   ├── routes/               # Route handler tests
│   │   │   ├── gallery.test.ts
│   │   │   ├── music.test.ts
│   │   │   └── textToSpeech.test.ts
│   │   ├── services/             # Service layer tests
│   │   │   └── visionService.test.ts
│   │   └── server.test.ts        # Server-level tests
│   └── ...
├── jest.config.js                # Jest configuration
└── coverage/                     # Coverage reports (generated)
```

### Writing Tests

Example test file:

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

describe('MyFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should perform expected behavior', () => {
    expect(true).toBe(true)
  })
})
```

### Coverage

Coverage reports are generated in the `coverage/` directory:
- HTML report: `coverage/index.html` (open in browser)
- LCOV report: `coverage/lcov.info` (for CI/CD)
- Text summary: displayed in terminal

## API Documentation

### Setup

The backend uses **Swagger/OpenAPI** with **swagger-jsdoc** and **swagger-ui-express** for interactive API documentation.

### Accessing Documentation

Once the server is running:

1. **Swagger UI** (Interactive): `http://localhost:5000/docs`
2. **OpenAPI JSON**: `http://localhost:5000/docs.json`

### Documented Endpoints

The following endpoints are documented:

- **Health**: `GET /health`
- **Vision**: 
  - `POST /api/vision/analyze`
  - `POST /api/vision/text`
- **Image Generation**: `POST /api/image-generation/generate`
- **Text-to-Speech**: `POST /api/text-to-speech/generate`
- **Music**: `POST /api/music/generate`
- **Gallery**:
  - `POST /api/gallery/save`
  - `GET /api/gallery/list`

### Adding Documentation

To document a new endpoint, add JSDoc comments above the route handler:

```typescript
/**
 * @swagger
 * /api/my-endpoint:
 *   post:
 *     summary: Brief description
 *     tags: [MyTag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field
 *             properties:
 *               field:
 *                 type: string
 *                 description: Field description
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Bad request
 */
router.post('/my-endpoint', async (req, res) => {
  // Implementation
})
```

### Swagger Configuration

The Swagger configuration is in `src/config/swagger.ts`:
- OpenAPI 3.0.0 specification
- Server URLs (development/production)
- Common schemas (Error, HealthResponse)
- API tags for organization

## Dependencies

### Testing
- `jest` - Testing framework
- `ts-jest` - TypeScript support for Jest
- `@types/jest` - TypeScript types for Jest
- `supertest` - HTTP assertion library (for route testing)
- `@types/supertest` - TypeScript types for supertest

### Documentation
- `swagger-jsdoc` - Generate OpenAPI spec from JSDoc comments
- `swagger-ui-express` - Serve Swagger UI
- `@types/swagger-jsdoc` - TypeScript types
- `@types/swagger-ui-express` - TypeScript types

## Next Steps

1. **Expand Test Coverage**: Add more comprehensive tests for all routes and services
2. **Integration Tests**: Add tests that test the full request/response cycle
3. **Documentation**: Continue adding Swagger docs to remaining endpoints
4. **CI/CD**: Integrate tests into deployment pipeline

