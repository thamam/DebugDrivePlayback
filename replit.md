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
- **Express.js**: Node.js web framework
- **TypeScript**: Type-safe backend development
- **ESM**: Modern ES modules throughout the application
- **Memory Storage**: In-memory data storage for development (with interface for future database integration)

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

1. **Data Loading**: Vehicle data loaded through plugin system
2. **Processing**: Data processed and validated through mock data generators
3. **Visualization**: Real-time rendering of charts and spatial views
4. **Interaction**: User controls timeline, filters signals, creates bookmarks
5. **Analysis**: System monitors for collision violations and safety alerts

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