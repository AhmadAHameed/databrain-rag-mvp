# DataBrain - Frontend React Application

An intelligent data management platform with AI-powered insights and advanced analytics.

## Developer Information

- **Developer:** Ahmad Abdulhameed
- **Company:** MVP_COMPANY
- **Contact:** a.a.elhameed@gmail.com
- **Version:** 0.0.1-dev

## Quick Start

### Development with Mock Data (Recommended)

```bash
# Install dependencies
npm install

# Start with mock data (no backend required)
npm run dev:mock

# Or use regular dev command (checks .env configuration)
npm run dev
```

### Development with Real Backend

```bash
# Start with real API
npm run dev:real

# Or manually configure and start
npm run mode:real
npm run dev
```

## Development Modes

This application includes a comprehensive mocking system for frontend development:

### 🎭 Mock Mode
- Uses realistic mock data
- No backend dependency required
- Perfect for UI development and testing
- Simulates network delays and errors

### 🔌 Real API Mode  
- Connects to live backend API
- Full functionality testing
- Production-like environment

### Managing Modes

```bash
# Check current mode
npm run mode:status

# Toggle between modes
npm run mode:toggle

# Enable specific mode
npm run mode:mock   # or npm run dev:mock
npm run mode:real   # or npm run dev:real

# Get help
npm run mode:help
```

## Configuration

### Environment Variables

Create a `.env` file (or use `.env.development` for defaults):

```bash
# API Configuration
VITE_API_BASE_URL=http://backend:8000

# App Information
VITE_APP_NAME=DataBrain
VITE_APP_VERSION=0.0.1-dev

# Development/Mocking
VITE_USE_MOCKS=false           # Set to 'true' for mock mode
VITE_MOCK_API_DELAY=1000       # Mock response delay (ms)
```

### Application Configuration

The application uses a centralized configuration system in `src/config/`:

- `appConfig.ts` - Application settings and content
- `environment.ts` - Environment variable management

```typescript
// Example: Updating app configuration
export const APP_CONFIG = {
  projectName: 'Your Project Name',
  developer: {
    name: 'Your Name',
    company: 'Your Company',
    email: 'your.email@company.com'
  },
  // ... other configuration options
};
```

## Project Structure

```
src/
├── config/
│   └── appConfig.ts          # Centralized configuration
├── features/
│   ├── admin/               # Admin dashboard
│   ├── main/                # Main layout and homepage
│   └── ...                  # Other features
├── components/              # Reusable components
└── ...
```

## Getting Started

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
