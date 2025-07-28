# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Debug Player Framework is a comprehensive debug tool for self-driving car data analysis featuring real-time visualization and authentic vehicle data processing. The project includes a React/TypeScript frontend, Express.js backend, Python FastAPI services, and PostgreSQL database for data persistence.

## Common Development Commands

### Quick Start
```bash
# One-command launch (auto-detects setup)
./run.sh

# Manual setup if needed
./local-setup.sh && npm run dev
```

### Build and Development
```bash
# Development server (runs on port 5000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check
tsc --noEmit

# Database migrations
npm run db:push
```

### Testing
```bash
# Run all tests (recommended)
./run-tests-simple.sh

# Individual test types
npm run test:unit
npm run test:e2e
npm run test:coverage

# Run specific test file
npx jest path/to/test.ts
npx playwright test path/to/test.spec.ts
```

### Python Backend
```bash
# Start Python backend (runs on port 8000)
cd python_backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or use the script
./start_backend.py
```

## Architecture

### Frontend (React + TypeScript)
- **Entry Point**: `client/src/main.tsx`
- **Main App**: `client/src/App.tsx` - Routes and providers setup
- **Pages**: `client/src/pages/` - Main application pages
  - `debug-player.tsx` - Main debug player interface
  - `widget-manager.tsx` - Widget management system
  - `plugin-manager.tsx` - Plugin management interface
  - `trip-loader.tsx` - Trip data loading interface
- **Components**: `client/src/components/`
  - `debug-player/` - Core player components (sidebars, timeline, visualization)
  - `widget-wizard/` - Widget creation and management components
  - `ui/` - Reusable UI components (shadcn/ui based)
- **State Management**: React Query for server state, local hooks for UI state
- **Styling**: Tailwind CSS with custom components

### Backend Architecture
- **Express Server**: `server/index.ts` - Main server entry, serves on port 5000
- **Routes**: `server/routes.ts` - API endpoints registration
- **Database**: PostgreSQL with Drizzle ORM (`server/db.ts`)
- **Python Integration**: `server/python-backend.ts` - Proxy to Python services
- **Python Backend**: `python_backend/main.py` - FastAPI server for data analysis (port 8000)
  - Plugin system for extensible data processing
  - Real-time data streaming and caching
  - Collision detection and trajectory analysis

### Data Flow
1. Frontend requests data through Express API (`/api/*`)
2. Express routes handle authentication and basic operations
3. Python-specific requests are proxied to FastAPI backend
4. Python backend loads and processes vehicle data through plugins
5. Processed data is cached and returned to frontend
6. Frontend visualizes data using React components and charts

### Key Features
- **Real Trip Data**: Located in `data/trips/` with authentic Kia Niro EV telemetry
- **Plugin System**: Extensible architecture for custom data analysis plugins
- **Widget Wizard**: Dynamic widget creation and management system
- **Multi-tab Interface**: Temporal, spatial, and collision analysis views
- **Performance Monitoring**: Built-in metrics and caching for optimal performance

### Testing Strategy
- **Unit Tests**: Jest for component and utility testing
- **E2E Tests**: Playwright for full application testing
- **Coverage**: Maintained through `test-reports/coverage/`
- **Python Tests**: Located in `python_backend/test_backend.py`

## 📖 Documentation

All documentation has been organized in the `docs/` directory:

### Setup Documentation
- **Local Setup**: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md) - Manual installation guide
- **Docker Setup**: [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md) - Docker installation guide  
- **Backend Setup**: [docs/BACKEND_SETUP.md](docs/BACKEND_SETUP.md) - Python backend details
- **Trip Data**: [docs/TRIP_DATA_SETUP.md](docs/TRIP_DATA_SETUP.md) - Data loading instructions

### Testing Documentation  
- **Test Runner**: [docs/TEST_RUNNER_GUIDE.md](docs/TEST_RUNNER_GUIDE.md) - Test execution guide
- **Testing Strategy**: [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) - Comprehensive testing approach
- **Interactive Testing**: [docs/INTERACTIVE_TESTING_GUIDE.md](docs/INTERACTIVE_TESTING_GUIDE.md) - Manual testing guide

### Features Documentation
- **Widget System**: [docs/WIDGET_WIZARD_DOCUMENTATION.md](docs/WIDGET_WIZARD_DOCUMENTATION.md) - Widget creation guide

## Important Notes

- Always use port 5000 for the main application (hardcoded for Replit compatibility)
- Python backend must be running for full functionality
- Database connection string is stored in `.env` file
- Real vehicle data is included in `data/trips/2025-07-15T12_06_02/`
- Widget templates are defined in `client/src/lib/widget-templates.ts`
- Plugin interfaces are defined in `client/src/types/plugin-interfaces.ts`
- Use `./fix-docker.sh` to troubleshoot Docker daemon issues
- Run `./cleanup-obsolete.sh` to remove duplicate/outdated files
