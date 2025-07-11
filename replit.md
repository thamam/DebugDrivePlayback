# Debug Player Framework

## Overview

This is a comprehensive debug player framework designed for visualizing and analyzing recorded vehicle data through an extensible plugin-based architecture. The application provides real-time visualization capabilities for autonomous vehicle debugging, collision detection, and spatial analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern React application using TypeScript for type safety
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework with dark theme support
- **Shadcn/ui**: Component library built on Radix UI primitives
- **Recharts**: Data visualization library for charts and graphs
- **React Query**: Server state management and caching
- **Wouter**: Lightweight routing library

### Backend Architecture
- **Express.js**: Node.js web framework for frontend service
- **TypeScript**: Type-safe backend development
- **ESM**: Modern ES modules throughout the application
- **Memory Storage**: In-memory data storage for development (with interface for future database integration)
- **Python Backend**: FastAPI-based backend for data processing and analysis
- **Plugin System**: Extensible architecture for different data sources and analyzers

### Database Architecture
- **Drizzle ORM**: Type-safe database toolkit
- **PostgreSQL**: Production database (configured but not yet implemented)
- **Neon Database**: Cloud PostgreSQL provider integration
- **Schema-first approach**: Database schema defined in TypeScript

## Key Components

### Data Visualization
- **Multi-tab interface**: Temporal Analysis, Spatial Analysis, Integrated View, Collision Analysis
- **Interactive charts**: Line charts, scatter plots, spatial 2D/3D views
- **Real-time cursor tracking**: Synchronized visualization across multiple charts
- **Plugin-based data loading**: Extensible architecture for different data sources

### User Interface
- **Dockable panels**: Resizable and collapsible sidebars
- **Timeline control**: Playback controls with variable speed
- **Bookmark system**: Save and navigate to specific timestamps
- **Signal filtering**: Toggle visibility of different data signals
- **Dark theme**: Professional dark interface optimized for data analysis

### Data Management
- **Session management**: Load, save, and manage debugging sessions
- **Vehicle data**: Time-series data for speed, acceleration, position, steering
- **Collision detection**: Real-time monitoring of safety margins
- **Export capabilities**: Data export functionality for analysis

## Data Flow

1. **Data Loading**: Vehicle data loaded through Python plugin system (VehicleDataPlugin)
2. **Processing**: Data processed and validated through real data generators and collision detection
3. **Visualization**: Real-time rendering of charts and spatial views
4. **Interaction**: User controls timeline, filters signals, creates bookmarks
5. **Analysis**: System monitors for collision violations and safety alerts through CollisionDetectionPlugin

## Python Backend Components

### Core Architecture
- **Plot Manager**: Central coordinator for plugin registration and data flow
- **Cache Handler**: High-performance caching system with configurable memory limits
- **Signal Validation**: Comprehensive validation system for data integrity
- **Performance Monitor**: Real-time performance tracking and metrics

### Plugin System
- **Base Plugin**: Abstract base class for all data processing plugins
- **Vehicle Data Plugin**: Handles vehicle telemetry data (speed, acceleration, position, steering)
- **Collision Detection Plugin**: Real-time collision detection and safety margin analysis
- **Extensible Architecture**: Easy to add new plugins for different data sources

### Data Processing
- **Real Data Generation**: Realistic vehicle trajectory simulation with multiple scenarios
- **Collision Analysis**: Advanced collision detection with configurable safety thresholds
- **Performance Metrics**: Comprehensive performance monitoring and optimization
- **Multi-format Support**: CSV, Parquet, and other data formats

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM, React Router alternative)
- UI libraries (Radix UI components, Lucide icons)
- Visualization (Recharts for charts)
- State management (React Query)
- Styling (Tailwind CSS, class-variance-authority)

### Backend Dependencies
- Express.js web framework
- Database tools (Drizzle ORM, PostgreSQL drivers)
- Development tools (tsx for TypeScript execution)
- Build tools (esbuild for production builds)
- Python backend (FastAPI, uvicorn, pandas, numpy)
- Data processing libraries (pandas, numpy, pydantic)

### Development Dependencies
- Vite for development and building
- TypeScript for type checking
- ESLint and Prettier for code quality
- Replit-specific plugins for development environment

## Deployment Strategy

### Development Environment
- **Vite dev server**: Hot module replacement and fast refresh
- **Express backend**: API server with middleware integration
- **Replit integration**: Specialized plugins for Replit environment
- **Memory storage**: In-memory data for rapid development

### Production Build
- **Frontend build**: Vite builds optimized React bundle
- **Backend build**: esbuild creates optimized server bundle
- **Static serving**: Express serves built frontend assets
- **Database migration**: Drizzle handles schema migrations

### Environment Configuration
- **Environment variables**: DATABASE_URL for PostgreSQL connection
- **Build scripts**: Separate development and production commands
- **Type checking**: TypeScript compilation verification
- **Database operations**: Drizzle kit for schema management

The application is designed as a single-page application with a clear separation between frontend visualization and backend data management, using modern web technologies to provide a responsive and professional debugging experience for vehicle data analysis.

## Recent Changes (July 2025)

### Completed Python Backend Implementation
- ✅ Full Python backend implementation with FastAPI server
- ✅ Plugin-based architecture for extensible data processing
- ✅ Real vehicle data generation with multiple scenarios (normal, emergency, collision)
- ✅ Comprehensive collision detection system with safety margin analysis
- ✅ Performance monitoring and caching system
- ✅ Signal validation and data integrity checks
- ✅ Complete test coverage with scenario-based testing
- ✅ FastAPI REST API with health monitoring endpoints

### Advanced Plugin Interface System (July 2025)
- ✅ Comprehensive plugin interface definitions with TypeScript types
- ✅ Plugin template system with predefined patterns for common use cases
- ✅ Advanced plugin creation wizard with multi-step configuration
- ✅ Interface compliance validation and signal mapping
- ✅ Data column specifications with validation rules
- ✅ Visualization configuration with charts, displays, and interactions
- ✅ Processing pipeline configuration with caching and performance settings
- ✅ Plugin categories: data_source, visualization, analysis, streaming, hybrid
- ✅ Complete plugin lifecycle management with CRUD operations

### Plugin Interface Components
- **Data Loading**: Configurable data sources with validation (CSV, JSON, streaming)
- **Signal Processing**: Comprehensive signal definitions with type safety
- **Visualization**: Chart configurations, display elements, and user interactions
- **Processing Pipeline**: Multi-step data processing with caching and optimization
- **Interface Compliance**: Validation system ensuring plugin interface rules
- **Template System**: Pre-built templates for car_pose, path_view, car_state, streaming plugins

### System Status
- Frontend: Complete and functional with React/TypeScript interface
- Backend: Dual backend system (Express.js for frontend, Python for data processing)
- Data Processing: Real-time vehicle data analysis with collision detection
- Plugin System: Advanced interface system with comprehensive template library
- Testing: Comprehensive test suite validating all scenarios
- Performance: Optimized for responsive data loading and playback