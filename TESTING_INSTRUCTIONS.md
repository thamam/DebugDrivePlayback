# DebugDrivePlayback - Testing Instructions

## 🎯 Overview
Your DebugDrivePlayback application has been completely overhauled with:
- ✅ All mock data eliminated and replaced with real data service
- ✅ Docker-based installation for simplified setup
- ✅ Storybook for component testing and development
- ✅ Enhanced widget system with persistence and collaboration
- ✅ Security vulnerabilities fixed
- ✅ Comprehensive error handling

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your database credentials
# For Docker setup: Use the defaults (debug_user/debug_pass)
# For local setup: Update with your PostgreSQL username/password
nano .env

# What to edit in .env:
# - Replace 'debug_user' with your PostgreSQL username (if different)
# - Replace 'debug_pass' with your PostgreSQL password (if different)
# - Keep 'localhost' for local setup, or use Docker service name for Docker
```

### 2. Docker Installation (Recommended)
```bash
# Make setup script executable and run
chmod +x setup-docker.sh
./setup-docker.sh

# Start all services
docker-compose -f docker-compose-dev.yml up -d
```

### 3. Traditional Installation (Alternative)
```bash
# Install dependencies
npm install

# Setup Python backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start services
npm run dev        # Frontend (Terminal 1)
npm run server     # Backend (Terminal 2)
python server.py   # Python service (Terminal 3)
```

## 🧪 Testing Checklist

### Core Functionality Tests

#### ✅ 1. Data Loading & Real Data Verification
- [ ] Load a CSV data file (should see real data, no mock data)
- [ ] Verify trajectory visualization shows actual GPS coordinates
- [ ] Check that signal data reflects real vehicle telemetry
- [ ] Confirm timestamps match actual data from CSV files

#### ✅ 2. Main Application Stability
- [ ] Navigate between different views without crashes
- [ ] Load multiple data sessions consecutively
- [ ] Verify error boundaries catch and display errors gracefully
- [ ] Check that application recovers from network issues

#### ✅ 3. Widget System Testing
```bash
# Test widget creation wizard
1. Click "Create Widget" in the widget manager
2. Follow the wizard steps to create a custom widget
3. Verify widget appears in the dashboard
4. Test widget persistence (refresh page, widget should remain)
```

#### ✅ 4. Plugin System Testing
```bash
# Test custom plugin creation
1. Access the plugin wizard from the main navigation
2. Create a simple data analysis plugin
3. Test plugin execution with real data
4. Verify plugin results are displayed correctly
```

### Storybook Component Testing

#### ✅ 5. Launch Storybook
```bash
npm run storybook
```
Then visit: http://localhost:6006

#### ✅ 6. Test Components in Isolation
- [ ] **Data Loader**: Test with different file formats
- [ ] **Error Boundary**: Verify error handling displays
- [ ] **Widget Wizard**: Test widget creation flow
- [ ] **Navigation**: Test all navigation scenarios
- [ ] **Trajectory Visualizer**: Test with sample GPS data

### Advanced Features Testing

#### ✅ 7. Widget Collaboration
```bash
# Test widget communication
1. Create two connected widgets (e.g., map + chart)
2. Interact with one widget (select time range)
3. Verify the other widget updates automatically
4. Test data pipeline between widgets
```

#### ✅ 8. Widget Marketplace
```bash
# Test widget sharing
1. Create a widget template
2. Save it to the marketplace
3. Install a template from marketplace
4. Verify template creates functional widget
```

#### ✅ 9. Data Export & Import
- [ ] Export trajectory data to different formats
- [ ] Import previously exported data
- [ ] Verify data integrity after round-trip

### Security & Performance Tests

#### ✅ 10. Security Verification
- [ ] Confirm no .env file in git (should only see .env.example)
- [ ] Test that widget expressions are safely evaluated (no eval() usage)
- [ ] Verify database operations don't expose sensitive data
- [ ] Check that file uploads are validated properly

#### ✅ 11. Performance Testing
- [ ] Load large CSV files (>100MB) and monitor performance
- [ ] Test with multiple concurrent users (if applicable)
- [ ] Verify memory usage doesn't continuously increase
- [ ] Test real-time data streaming performance

## 🐛 Troubleshooting Guide

### Docker Issues
```bash
# If containers fail to start
docker-compose -f docker-compose-dev.yml down
docker-compose -f docker-compose-dev.yml up --build

# Check container logs
docker logs debugdriveplayback-frontend-1
docker logs debugdriveplayback-backend-1
docker logs debugdriveplayback-python-1
```

### Database Issues
```bash
# Reset database
docker-compose -f docker-compose-dev.yml down -v
docker-compose -f docker-compose-dev.yml up -d
```

### Development Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset Python virtual environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 📊 Expected Test Results

### ✅ Success Indicators
- Application loads without mock data warnings
- Real trajectory data displays on maps
- Widget creation wizard completes successfully
- Storybook loads all component stories
- No console errors related to eval() or security
- Database operations complete without errors

### ❌ Failure Indicators
- Mock data still visible anywhere in the UI
- Widget creation fails or widgets don't persist
- Storybook fails to load or shows errors
- Console shows security warnings or eval() errors
- Database connection failures

## 🔧 Development Tools

### Storybook Commands
```bash
npm run storybook        # Start Storybook dev server
npm run build-storybook  # Build static Storybook
npm run test-storybook   # Run Storybook tests
```

### Testing Commands
```bash
npm run test            # Run unit tests
npm run test:integration # Run integration tests (if configured)
npm run lint            # Run linting
npm run type-check      # TypeScript type checking
```

## 📁 Key Test Files & Locations

### Sample Data
- `data/sample-trips/`: Sample CSV files for testing
- `data/test-scenarios/`: Specific test scenarios

### Component Stories
- `stories/components/`: Individual component tests
- `stories/pages/`: Full page integration tests
- `stories/utils/mock-data.ts`: Mock data for Storybook

### Configuration Files
- `.env.example`: Environment template
- `docker-compose-dev.yml`: Development Docker setup
- `TESTING_STRATEGY.md`: Detailed testing methodology

## 🎯 Priority Test Areas

### High Priority (Test First)
1. **Real Data Loading**: Ensure no mock data appears
2. **Basic Navigation**: Core app functionality works
3. **Widget Creation**: Primary feature works end-to-end
4. **Docker Setup**: Installation process is smooth

### Medium Priority
1. **Advanced Widget Features**: Collaboration and marketplace
2. **Performance**: Large file handling
3. **Error Recovery**: Graceful error handling

### Low Priority (Nice to Have)
1. **Storybook Stories**: All components render correctly
2. **Advanced Data Export**: Multiple format support
3. **Plugin System**: Custom plugin creation

## 💡 Tips for Testing

1. **Start Simple**: Test basic data loading before advanced features
2. **Use Browser DevTools**: Monitor console for errors and warnings
3. **Test Edge Cases**: Try large files, invalid data, network issues
4. **Document Issues**: Note any problems with steps to reproduce
5. **Test Across Browsers**: Chrome, Firefox, Safari if possible

## 📞 Support

If you encounter issues during testing:
1. Check the console for detailed error messages
2. Verify all services are running: `docker ps` or check individual terminals
3. Review the `.env` file configuration
4. Try the troubleshooting steps above
5. Check `TESTING_STRATEGY.md` for detailed testing methodology

---
**Last Updated**: After security fixes and main branch merge
**Status**: Ready for comprehensive testing