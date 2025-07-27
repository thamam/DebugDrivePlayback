# Debug Player Framework

A comprehensive debug tool for self-driving car data analysis, featuring real-time visualization and authentic vehicle data processing.

## 🚀 Quick Start (2 Commands Max)

### One Command (Automatic Detection)
```bash
./run.sh
```

### Manual Options
```bash
# Docker database + manual app
./start-postgres-only.sh && ./local-setup.sh && npm run dev

# Fully manual (requires Node.js 22, Python 3.11+, PostgreSQL)  
./local-setup.sh && npm run dev
```

**Open:** http://localhost:5000

📖 **[Complete Quick Start Guide](QUICK_START.md)**

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Python FastAPI
- **Database**: PostgreSQL + Drizzle ORM
- **Real Data**: Authentic Kia Niro EV trip data included

## 📁 Key Features

- **Real-time Data Visualization**: Interactive charts and spatial views
- **Plugin System**: Extensible architecture for custom data analysis
- **Widget Wizard**: Dynamic widget creation system
- **Authentic Data**: Real vehicle telemetry from Kia Niro EV
- **Multi-tab Interface**: Temporal, spatial, and collision analysis views
- **Bookmark System**: Save and navigate to specific timestamps

## 📊 Included Data

The application includes authentic vehicle data from a Kia Niro EV:
- **Duration**: 179 seconds of real driving data
- **Signals**: 23 different vehicle signals (speed, steering, GPS, etc.)
- **Location**: `data/trips/2025-07-15T12_06_02/`

## 🔧 Development

### Prerequisites
- Node.js v18 or v20
- Python 3.8+
- PostgreSQL 13+

### Local Development
```bash
# Start Python backend
./start_python_backend.sh

# Start frontend (new terminal)
./start_frontend.sh

# Or use development script
./dev.sh
```

### Adding Your Own Data
1. Create directory: `data/trips/your-trip-name/`
2. Add CSV files with format: `time_stamp,data_value`
3. Include required signals: vehicle_speed, gps_latitude, gps_longitude, steering_wheel_angle

## 📖 Documentation

- **Local Setup**: [LOCAL_SETUP.md](LOCAL_SETUP.md) - Complete setup instructions
- **Testing**: [TEST_RUNNER_GUIDE.md](TEST_RUNNER_GUIDE.md) - Test execution guide
- **Backend**: [BACKEND_SETUP.md](BACKEND_SETUP.md) - Python backend details
- **Widget System**: [WIDGET_WIZARD_DOCUMENTATION.md](WIDGET_WIZARD_DOCUMENTATION.md) - Widget creation guide

## 🧪 Testing

### Quick Testing
```bash
# Run all tests
./run-tests-simple.sh

# Individual test types
npm run test:unit
npm run test:e2e
npm run test:coverage
```

### Comprehensive Testing
```bash
# Run ALL possible tests (recommended)
./run-all-tests-comprehensive.sh

# Validate CI/CD setup
.github/validate-workflows.sh
```

### 🤖 Automated CI/CD
Every commit and pull request automatically runs **ALL** tests including:
- ✅ Unit Tests (Jest)
- ✅ E2E Tests (Playwright - 3 browsers)
- ✅ Integration Tests (Frontend ↔ Backend)
- ✅ Python Backend Tests
- ✅ Performance Tests
- ✅ Security Scans
- ✅ Code Quality Checks
- ✅ Build Validation

**📊 [View CI/CD Setup Guide](docs/CICD_SETUP_GUIDE.md)**

## 🌐 Accessing the Application

- **Frontend**: http://localhost:5000
- **Python Backend**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Note**: For performance with real data, local installation is recommended over Replit deployment.