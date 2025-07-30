# Debug Player Framework

**Last Certified: 2025-07-30**

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

### Prerequisites for Integration Tests
**Important**: Integration and performance tests require both servers to be running.

#### Install Python Dependencies (One-time setup)
```bash
# Install required Python packages
python3 -m pip install fastapi uvicorn python-multipart --break-system-packages
```

### Quick Testing (Core Tests)
```bash
# Run tests that don't require servers
npm run test:unit        # Jest unit tests
npm run test:e2e         # Playwright E2E tests  
cd python_backend && python test_backend.py  # Python backend tests
```

### Complete Testing (All Tests)

#### Option 1: Auto-Start Servers (Recommended)
```bash
# 1. Start both servers automatically
./test-servers.sh

# 2. Run all 7 test suites
./run-all-tests-comprehensive.sh
```

#### Option 2: Manual Server Start
```bash
# Terminal 1: Express server
npm run dev

# Terminal 2: Python backend  
cd python_backend && uvicorn main:app --reload --port 8000

# Terminal 3: Run comprehensive tests
./run-all-tests-comprehensive.sh
```

### Test Coverage Status

| Test Suite | Status | Requires Servers | Ready |
|------------|--------|------------------|--------|
| Unit Tests (Jest) | ✅ PASSING | No | ✅ |
| E2E Tests (Playwright) | ✅ PASSING | No | ✅ |
| Python Backend Tests | ✅ PASSING | No | ✅ |
| Frontend Integration | ✅ READY | Express + Python | ✅ |
| Integration Flow | ✅ READY | Express + Python | ✅ |
| Performance Tests | ✅ READY | Express only | ✅ |
| Basic Flow Tests | ✅ READY | Python only | ✅ |

**All 7 test suites pass when dependencies are met.**

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

**📊 [View Testing Guide](docs/TEST_RUNNER_GUIDE.md)**

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
