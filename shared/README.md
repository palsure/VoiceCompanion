# VoiceCompanion Shared Module

This is a shared module containing API services and business logic that can be used by both the mobile (React Native) and web (React) applications.

## Structure

- `src/types.ts` - Shared TypeScript types and interfaces
- `src/api.ts` - API service classes and factory functions
- `src/index.ts` - Main exports

## Usage

### In Mobile App (React Native)

```typescript
import { createApiClient, createApiServices } from '@voicecompanion/shared'
import { Platform } from 'react-native'

const API_BASE_URL = 
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000')

const apiClient = createApiClient({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 35000,
})

export const { imageGenerationApi, speechToTextApi, ... } = createApiServices(apiClient)
```

### In Web App (React)

```typescript
import { createApiClient, createApiServices } from '@voicecompanion/shared'

const apiClient = createApiClient({
  baseURL: '/api', // Vite proxy handles this
  timeout: 35000,
})

export const { imageGenerationApi, speechToTextApi, ... } = createApiServices(apiClient)
```

## Installation

From the root directory:

```bash
cd shared
npm install
npm run build
```

Then link it in mobile and web apps:

```bash
# In mobile/package.json and frontend/package.json, add:
"@voicecompanion/shared": "file:../shared"
```

## Development

```bash
# Watch mode for development
npm run watch
```

