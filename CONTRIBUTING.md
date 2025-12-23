# Contributing to Voice Vision Companion

Thank you for your interest in contributing to Voice Vision Companion!

## Development Setup

1. Follow the setup instructions in README.md
2. Ensure all environment variables are configured
3. Run the development servers:
   ```bash
   npm run dev:backend  # Terminal 1
   npm run dev:frontend # Terminal 2
   ```

## Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Write clear, descriptive variable and function names
- Add comments for complex logic
- Ensure accessibility features are maintained

## Testing

- Test voice interactions in Chrome or Edge (best Web Speech API support)
- Test camera features with actual camera access
- Verify accessibility features (high contrast, font sizes, keyboard navigation)
- Test error handling and graceful degradation

## Pull Request Process

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit a pull request with a clear description

## Accessibility Guidelines

- All interactive elements must be keyboard accessible
- Provide ARIA labels where appropriate
- Maintain high contrast mode support
- Ensure screen reader compatibility
- Test with actual assistive technologies

## Questions?

Feel free to open an issue for questions or discussions.

