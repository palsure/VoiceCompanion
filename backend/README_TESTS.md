# Backend Testing Guide

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are located in `src/__tests__/` directory:
- `routes/` - Route handler tests
- `services/` - Service layer tests
- `setup.ts` - Test configuration and setup

## Writing Tests

### Example Route Test

```typescript
import { describe, it, expect } from '@jest/globals'

describe('MyRoute', () => {
  it('should handle valid requests', () => {
    // Test implementation
  })
})
```

### Example Service Test

```typescript
import { describe, it, expect, jest } from '@jest/globals'

jest.mock('../../services/myService.js')

describe('MyService', () => {
  it('should perform expected behavior', () => {
    // Test implementation
  })
})
```

## Coverage

Coverage reports are generated in the `coverage/` directory. Open `coverage/index.html` in a browser to view detailed coverage.

