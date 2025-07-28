# Data Flow Documentation

## Overview

This document details the complete data flow through the Debug Player Framework, from raw vehicle data ingestion to real-time visualization. Understanding these flows is critical for maintaining the zero-delay performance requirements.

## 1. Data Ingestion Flow

### Raw Vehicle Data → Plugin System
```
CSV Files (767,683 points)
├── data/trips/2025-07-15T12_06_02/
│   ├── car_pose.csv         # Vehicle position data
│   ├── imu_data.csv         # Inertial measurement data
│   ├── vehicle_signals.csv  # Speed, steering, brake data
│   └── metadata.json       # Trip metadata
         │
         ▼
Python TripDataPlugin
├── Data Validation
├── Signal Extraction
├── Temporal Alignment
└── Memory Optimization
         │
         ▼
PlotManager (Python)
├── Plugin Registration
├── Signal Aggregation
├── Time Range Calculation
└── API Endpoint Exposure
```

**Performance Critical Points:**
- **File Reading**: Streaming readers for large files
- **Memory Usage**: Lazy loading, not full file in memory
- **Signal Processing**: Vectorized operations with NumPy
- **Time Complexity**: O(1) timestamp lookups

### Data Loading API Flow
```
POST /api/python/load-data
{
  "filePath": "/home/thh3/data/trips/2025-07-15T12_06_02",
  "pluginType": "vehicle_data"
}
         │
         ▼ Express Route Handler
         │
         ▼ Python Backend Proxy
         │
         ▼ FastAPI /load-data
         │
         ▼ TripDataPlugin.load()
         │
         ▼ PlotManager.register_plugin()
         │
         ▼ Response (12-15 seconds)
{
  "success": true,
  "plugin_name": "TripDataPlugin",
  "time_range": [1752570362.062682, 1752570538.2367],
  "signals": { ... 54 signals ... },
  "data_points": 767683
}
```

## 2. Session Management Flow

### Session Creation
```
Frontend Request
├── Trip data loaded via Python API
├── Session metadata extracted
└── POST /api/sessions with session data
         │
         ▼ Express Session Handler
         │
         ▼ Mock Session Creation (Database bypassed)
         │
         ▼ Session ID Generation (timestamp-based)
         │
         ▼ Response with Session Object
{
  "id": 1753137571600,
  "name": "Trip 2025-07-15T12_06_02",
  "filePath": "/home/thh3/data/trips/2025-07-15T12_06_02",
  "duration": 300,
  "signalCount": 54
}
```

### Session Navigation
```
Trip Loader Page
├── Load Trip Data Button → API Call → Session Creation
├── Start Analysis Button → Navigate with Session ID
└── URL: /?session=1753137571600
         │
         ▼ Debug Player Page
         │
         ▼ useDebugPlayer Hook
         │
         ▼ Extract Session ID from URL
         │
         ▼ Load Trajectory Data: GET /api/trajectory/{sessionId}
```

## 3. Real-Time Timeline Flow

### Critical Performance Path: Timeline Interaction

```
User Timeline Interaction (Slider Move)
         │ (Target: <16ms response)
         ▼
React onChange Handler
├── setCurrentTime(newTime)
└── Triggers useEffect with [currentTime] dependency
         │ (0ms - synchronous state update)
         ▼
Signal Data Fetching Hook
├── Cache Key Generation: Math.round(currentTime * 10) / 10
├── Cache Lookup: signalCacheRef.current.has(cacheKey)
└── Branch: Cache Hit vs Cache Miss
         │
         ├─ CACHE HIT (Target: 0ms)
         │  ├── Instant data retrieval
         │  ├── console.log("⚡ INSTANT: Signals...")
         │  └── No API call needed
         │
         └─ CACHE MISS (Target: <20ms total)
            ├── Immediate API call (no debouncing)
            ├── fetch('/api/python/data/timestamp')
            ├── Response caching for future hits
            ├── console.log("🔥 FETCHED: Signals...")
            └── Background pre-fetching of adjacent timestamps
```

### Signal Data API Flow
```
POST /api/python/data/timestamp
{
  "timestamp": 1752570370.123,
  "signals": ["speed", "steering", "brake", "throttle", "driving_mode"]
}
         │ (Express Route: 1-2ms overhead)
         ▼
Express Proxy Handler
├── Route: /api/python/data/timestamp
├── Proxy to: http://localhost:8000/data
└── Forward request with body
         │ (Network: 1-2ms localhost)
         ▼
Python FastAPI Handler
├── Route: POST /data
├── PlotManager.request_data_update()
├── Plugin signal lookup
└── Response generation
         │ (Processing: 10-15ms)
         ▼
Response
{
  "timestamp": 1752570370.123,
  "data": {
    "speed": {
      "timestamp": 1752570370.142682,
      "value": null,  # Note: Currently returning null - needs investigation
      "units": "m/s"
    },
    "steering": { ... },
    "brake": { ... }
  }
}
```

## 4. Trajectory Visualization Flow

### Trajectory Data Loading
```
GET /api/trajectory/{sessionId}
         │
         ▼ Express Route Handler
         │
         ▼ Python Backend Integration
         │
         ▼ Data Range Request to Python
POST http://localhost:8000/data-range
{
  "start_time": 0,
  "end_time": 10000,
  "signals": ["car_pose_car_pose_front_axle_x_meters", "car_pose_car_pose_front_axle_y_meters"]
}
         │
         ▼ Python Processing
         │
         ▼ Response with Trajectory Points
{
  "success": true,
  "trajectory": [
    {
      "timestamp": 1752570362.062682,
      "x": 35.577,
      "y": -427.813
    },
    // ... 17,473 trajectory points
  ],
  "time_range": [1752570362.092851, 1752570538.225811],
  "total_points": 17473
}
```

### Data Virtualization (Performance Critical)
```
Original Problem: 767,683 points processed synchronously
├── Math.random() called 767k times
├── Math.sin() called 767k times  
├── Object creation for 767k points
└── Result: 3-5 second browser freeze

Performance Solution: Data Virtualization
├── Limit processing to 1,000 sample points
├── Replace expensive operations with simple patterns
├── Store metadata for full dataset
└── Result: <100ms processing time

const trajectoryMeta = {
  totalPoints: 767683,
  timeRange: [start, end],
  samplePoints: trajectory.slice(0, 1000)  // Only process first 1000
};

const sampleDataPoints = trajectoryMeta.samplePoints.map((point, index) => ({
  time: point.timestamp - timeRange[0],
  vehicle_speed: 15 + (index % 10),      // Simple pattern vs Math.random()
  steering_angle: (index % 20) - 10,     // Simple pattern vs Math.sin()
  position_x: point.x,
  position_y: point.y,
  // ... other fields
}));
```

## 5. Caching and Performance Flow

### Multi-Level Caching Strategy

```
Level 1: Browser Memory Cache (signalCacheRef)
├── LRU cache with 1000 entry limit
├── Key: rounded timestamp (0.1s precision)
├── Value: complete signal data response
├── Lifetime: session duration
└── Hit Rate Target: >90% for timeline scrubbing

Level 2: Background Pre-fetching
├── Triggered after cache miss
├── Pre-fetch adjacent timestamps: ±0.1s, ±0.3s, ±0.5s
├── Async operations, don't block main thread
├── Fire-and-forget pattern
└── Predictive loading for smooth scrubbing

Level 3: API Response Optimization
├── Python backend internal caching
├── Express.js response compression
├── HTTP keep-alive connections
├── Connection pooling
└── Target: <20ms API response times
```

### Cache Management Flow
```
Cache Entry Lifecycle:
1. Cache Miss → API Call → Store Response
2. Cache Hit → Instant Return
3. Cache Size Check → LRU Eviction if >1000 entries
4. Background Pre-fetch → Populate Adjacent Timestamps
5. Session End → Cache Clear

Memory Management:
├── Cache Size Monitoring
├── Automatic Cleanup (LRU)
├── Memory Usage Tracking
└── Leak Prevention
```

## 6. Error Handling and Recovery Flow

### Error Propagation
```
Component Level Errors
├── API Call Failures
├── Data Parsing Errors
├── Network Timeouts
└── Invalid Responses
         │
         ▼ Error Boundaries
         │
         ▼ Graceful Degradation
         │
         ▼ User Feedback
         │
         ▼ Recovery Actions
```

### Specific Error Scenarios
```
1. Data Loading Failures
   ├── File not found → Clear error message
   ├── Invalid data format → Validation feedback
   ├── Memory errors → Chunked loading
   └── Network errors → Retry mechanism

2. Timeline Interaction Errors
   ├── API timeouts → Cache fallback
   ├── Invalid timestamps → Boundary clamping
   ├── Missing signals → Default values
   └── Rate limiting → Queue management

3. Session Management Errors
   ├── Invalid session ID → Redirect to loader
   ├── Session expiry → Re-authentication
   ├── Database errors → Mock session fallback
   └── Navigation errors → Error page
```

## 7. Performance Monitoring Flow

### Real-Time Metrics Collection
```
Frontend Metrics
├── Timeline interaction response time
├── Cache hit/miss ratios
├── Memory usage tracking
├── Render performance (FPS)
└── User interaction latency

Backend Metrics
├── API response times
├── Database query performance
├── Python processing time
├── Memory and CPU usage
└── Error rates

Integration Points
├── Server log analysis
├── Browser performance API
├── Custom performance marks
├── Automated alerts
└── Performance regression detection
```

### Performance Targets
```
Critical Performance Metrics:
├── Timeline Response: <16ms (1 frame @ 60fps)
├── Cache Hit Response: 0ms (instant)
├── API Response: <20ms (P95)
├── Data Loading: <15s (large datasets)
├── Memory Usage: <100MB growth per hour
├── Cache Hit Rate: >90% during scrubbing
└── UI Responsiveness: 60fps maintained
```

## 8. Data Dependencies

### Module Dependencies
```
Frontend → Express Backend → Python Backend → File System
   ├── Session management
   ├── API proxying  
   ├── Data processing
   └── File access

React Hooks → TanStack Query → Fetch API → Express Routes
   ├── State management
   ├── Server state caching
   ├── HTTP communication
   └── Route handling

Python Plugins → PlotManager → FastAPI → Express Proxy
   ├── Data analysis
   ├── Plugin coordination
   ├── API endpoints
   └── Request forwarding
```

### Critical Dependencies
```
Performance Dependencies:
├── React 18 (Concurrent features)
├── TypeScript (Type safety)
├── Vite (Fast builds and HMR)
├── TanStack Query (Intelligent caching)
├── FastAPI (High-performance Python)
├── NumPy (Vectorized operations)
├── Pandas (Efficient data manipulation)
└── PostgreSQL (Reliable persistence)

Development Dependencies:
├── Jest (Unit testing)
├── Playwright (E2E testing)
├── ESLint (Code quality)
├── Prettier (Code formatting)
├── Pytest (Python testing)
└── GitHub Actions (CI/CD)
```

## 9. Future Optimizations

### Planned Improvements
```
Short-term:
├── WebSocket real-time updates
├── Service Worker caching
├── IndexedDB persistence
├── Web Workers for processing
└── HTTP/2 push for pre-fetching

Medium-term:
├── GraphQL for efficient queries
├── Redis caching layer
├── CDN for static assets
├── Database read replicas
└── Horizontal scaling

Long-term:
├── Edge computing deployment
├── Real-time streaming protocols
├── Machine learning predictions
├── Advanced compression algorithms
└── GPU-accelerated processing
```

This data flow documentation ensures that all team members understand the critical performance paths and can maintain the zero-delay responsiveness requirements while developing new features.
