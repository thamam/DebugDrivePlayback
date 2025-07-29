# Debug Player Framework - Architecture Overview

## System Architecture

The Debug Player Framework is a high-performance, real-time vehicle debugging tool designed for analyzing autonomous vehicle telemetry data. The system is built with zero-tolerance for delays and maximum responsiveness.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Express.js     │    │   Python        │
│   React/TS      │◄──►│   Backend        │◄──►│   FastAPI       │
│                 │    │                  │    │                 │
│ • Timeline UI   │    │ • API Gateway    │    │ • Data Analysis │
│ • Visualization │    │ • Session Mgmt   │    │ • Plugin System │
│ • Real-time     │    │ • Route Proxy    │    │ • Signal Proc   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser       │    │   PostgreSQL     │    │   File System   │
│   • Performance │    │   • Sessions     │    │   • Trip Data   │
│   • Caching     │    │   • User Data    │    │   • CSV Files   │
│   • WebSockets  │    │   • Metadata     │    │   • Raw Logs    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Principles

### 1. Zero-Delay Responsiveness
- **Timeline Interactions**: Must respond within 16ms (single frame at 60fps)
- **Signal Data**: Instant cache hits, sub-20ms API responses
- **No Debouncing**: Direct API calls with intelligent caching
- **Pre-fetching**: Adjacent timestamps loaded in background

### 2. Real-Time Data Processing
- **767,683 data points**: Handled through data virtualization
- **Plugin Architecture**: Extensible signal processing
- **Streaming Updates**: Live data ingestion support
- **Memory Efficiency**: Smart caching with size limits

### 3. Production-Grade Performance
- **Sub-second Data Loading**: Large datasets processed efficiently
- **Responsive UI**: No blocking operations on main thread
- **Error Recovery**: Graceful handling of missing data
- **Testing Coverage**: Comprehensive integration tests

## Technology Stack

### Frontend (Client)
- **React 18** with TypeScript
- **Vite** for development and building
- **TanStack Query** for server state management
- **Tailwind CSS** with shadcn/ui components
- **Playwright** for end-to-end testing

### Backend (Server)
- **Express.js** with TypeScript
- **Vite SSR** for development integration
- **Drizzle ORM** with PostgreSQL
- **FastAPI Integration** via HTTP proxy
- **Jest** for unit testing

### Data Layer (Python)
- **FastAPI** for high-performance API
- **Pandas** for data manipulation
- **NumPy** for numerical processing
- **Plugin System** for extensible analysis
- **Pytest** for testing

### Infrastructure
- **PostgreSQL** for persistent data
- **Node.js 22** runtime
- **Python 3.12** runtime
- **Docker** support for deployment
- **GitHub Actions** for CI/CD

## Data Flow Architecture

### 1. Data Loading Flow
```
Trip Data (CSV) → Python Plugin → Data Processing → Express API → React State
     │                │               │              │           │
     │                ▼               ▼              ▼           ▼
   767k Points    Plugin System   Virtualization   Session    Component
                                                    Cache      Rendering
```

### 2. Timeline Interaction Flow
```
User Slider → React Hook → Cache Check → API Call → Signal Update
    │           │            │           │           │
    16ms        0ms         0ms        15ms        0ms
   Target    Instant    Cache Hit   Network     Display
```

### 3. Real-Time Signal Flow
```
Timestamp Change → Cache Lookup → Background Prefetch → Display Update
        │              │              │                    │
     Immediate      Instant        Predictive           Smooth
```

## Module Structure

```
Debug Player Framework
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── debug-player/  # Core player components
│   │   │   ├── ui/           # Base UI components (shadcn)
│   │   │   └── widget-wizard/ # Widget creation system
│   │   ├── hooks/            # React hooks for state management
│   │   ├── lib/              # Utility libraries
│   │   ├── pages/            # Main application pages
│   │   └── types/            # TypeScript type definitions
│   └── index.html            # Application entry point
├── server/                    # Express.js backend
│   ├── routes.ts             # API route definitions
│   ├── db.ts                 # Database connection
│   ├── storage.ts            # Data access layer
│   ├── python-integration.ts # Python backend proxy
│   └── vite.ts              # Vite development setup
├── python_backend/           # Python FastAPI service
│   ├── main.py              # FastAPI application
│   ├── core/                # Core analysis modules
│   │   └── plot_manager.py  # Plugin management system
│   └── plugins/             # Data analysis plugins
│       ├── vehicle_data_plugin.py
│       ├── collision_detection_plugin.py
│       └── trip_data_plugin.py
├── shared/                   # Shared TypeScript types
│   └── schema.ts            # Database schema definitions
├── docs/                    # Documentation
└── data/                    # Sample trip data
    └── trips/               # Organized by trip date
```

## Performance Optimizations

### Frontend Optimizations
1. **Data Virtualization**: Process only visible data points
2. **Intelligent Caching**: LRU cache with 1000-entry limit
3. **Predictive Pre-fetching**: Load adjacent timestamps
4. **Zero Debouncing**: Immediate API calls with cache checks
5. **Memory Management**: Automatic cache cleanup

### Backend Optimizations
1. **Connection Pooling**: Efficient database connections
2. **Response Caching**: API response caching layers
3. **Async Processing**: Non-blocking I/O operations
4. **Compression**: Gzip compression for large responses
5. **Error Boundaries**: Graceful degradation

### Data Processing Optimizations
1. **Streaming Processing**: Process data in chunks
2. **Plugin Architecture**: Modular, efficient analysis
3. **Parallel Processing**: Multi-threaded data operations
4. **Memory Mapping**: Efficient file access
5. **Index Optimization**: Fast data lookup

## Security Considerations

### Data Protection
- **Input Validation**: All user inputs validated
- **SQL Injection**: Parameterized queries only
- **XSS Prevention**: Content sanitization
- **CORS Configuration**: Restricted cross-origin access

### Authentication (Future)
- **JWT Tokens**: Stateless authentication
- **Role-Based Access**: User permission system
- **Session Management**: Secure session handling
- **API Rate Limiting**: Prevent abuse

## Deployment Architecture

### Development Environment
```
Local Machine
├── Node.js Server (Port 5000)
├── Python Backend (Port 8000)
├── PostgreSQL (Port 5432)
└── Vite Dev Server (Integrated)
```

### Production Environment
```
Container Cluster
├── Nginx (Load Balancer)
├── Express.js (Scaled)
├── Python FastAPI (Scaled)
├── PostgreSQL (Primary/Replica)
└── Redis (Caching Layer)
```

## Testing Strategy

### Unit Tests
- **Jest**: Frontend component testing
- **Pytest**: Python backend testing
- **Coverage**: 80%+ code coverage target

### Integration Tests
- **API Testing**: Complete data flow validation
- **Performance Testing**: Response time verification
- **End-to-End**: Full user workflow testing

### Performance Tests
- **Load Testing**: High concurrent user simulation
- **Stress Testing**: System breaking point analysis
- **Memory Testing**: Memory leak detection
- **Benchmark Testing**: Performance regression prevention

## Monitoring and Observability

### Performance Monitoring
- **Real-time Metrics**: API response times
- **Memory Usage**: Browser and server monitoring
- **Error Tracking**: Automatic error collection
- **Performance Budgets**: Automated performance checks

### Logging
- **Structured Logging**: JSON-formatted logs
- **Log Levels**: Debug, Info, Warn, Error
- **Correlation IDs**: Request tracing
- **Log Aggregation**: Centralized log collection

## Future Roadmap

### Near-term (Next Sprint)
- [ ] WebSocket real-time updates
- [ ] Advanced visualization modes
- [ ] Plugin marketplace
- [ ] User authentication system

### Medium-term (Next Quarter)
- [ ] Multi-vehicle comparison
- [ ] AI-powered anomaly detection
- [ ] Cloud deployment
- [ ] Mobile responsiveness

### Long-term (Next Year)
- [ ] Real-time vehicle streaming
- [ ] Machine learning insights
- [ ] Collaborative debugging
- [ ] Enterprise features
