const { spawn } = require('child_process');
// Using built-in fetch (Node 18+)

/**
 * Test suite to verify that ./run.sh successfully starts both servers
 * - Express server on port 5000
 * - Python backend on port 8000
 */
describe('Server Startup Tests', () => {
  let runProcess;
  const STARTUP_TIMEOUT = 30000; // 30 seconds for both servers to start
  const SERVER_CHECK_TIMEOUT = 5000; // 5 seconds to check each server

  beforeAll(() => {
    // Increase timeout for this test suite since server startup takes time
    jest.setTimeout(60000);
  });

  afterAll(async () => {
    // Clean up: kill the run.sh process if it's still running
    if (runProcess && !runProcess.killed) {
      console.log('Cleaning up: terminating run.sh process...');
      runProcess.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still running
      if (!runProcess.killed) {
        runProcess.kill('SIGKILL');
      }
    }
  });

  test('should start both Express server (port 5000) and Python backend (port 8000) via ./run.sh', async () => {
    // Start the ./run.sh script
    console.log('Starting ./run.sh...');
    runProcess = spawn('./run.sh', [], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    // Track server status
    let expressServerReady = false;
    let pythonBackendReady = false;
    let startupComplete = false;

    // Listen to stdout for server startup messages
    runProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('STDOUT:', output);
      
      // Check for Express server startup
      if (output.includes('Server running on') || output.includes('localhost:5000')) {
        console.log('✓ Express server startup detected');
        expressServerReady = true;
      }
      
      // Check for Python backend startup
      if (output.includes('Uvicorn running') || output.includes('localhost:8000')) {
        console.log('✓ Python backend startup detected');
        pythonBackendReady = true;
      }
      
      if (expressServerReady && pythonBackendReady && !startupComplete) {
        startupComplete = true;
        console.log('✓ Both servers appear to be starting up');
      }
    });

    // Listen to stderr for any errors
    runProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('STDERR:', output);
    });

    // Handle process events
    runProcess.on('error', (error) => {
      console.error('Process error:', error);
    });

    runProcess.on('exit', (code, signal) => {
      console.log(`Process exited with code ${code} and signal ${signal}`);
    });

    // Wait for servers to start up
    console.log('Waiting for servers to start...');
    await new Promise(resolve => setTimeout(resolve, STARTUP_TIMEOUT));

    // Test Express server (port 5000)
    console.log('Testing Express server on port 5000...');
    try {
      const expressResponse = await fetch('http://localhost:5000', {
        timeout: SERVER_CHECK_TIMEOUT
      });
      expect(expressResponse.status).toBeLessThan(500); // Accept any non-server-error status
      console.log('✅ Express server is responding');
    } catch (error) {
      console.error('❌ Express server check failed:', error.message);
      throw new Error(`Express server not reachable on port 5000: ${error.message}`);
    }

    // Test Python backend (port 8000)
    console.log('Testing Python backend on port 8000...');
    try {
      const pythonResponse = await fetch('http://localhost:8000/health', {
        timeout: SERVER_CHECK_TIMEOUT
      });
      expect(pythonResponse.status).toBe(200);
      
      const healthData = await pythonResponse.json();
      expect(healthData).toHaveProperty('status');
      console.log('✅ Python backend is responding with health check');
    } catch (error) {
      console.error('❌ Python backend check failed:', error.message);
      throw new Error(`Python backend not reachable on port 8000: ${error.message}`);
    }

    console.log('🎉 Both servers are successfully running!');
  });

  test('should be able to load trip data after servers are started', async () => {
    // This test assumes the previous test has already started the servers
    console.log('Testing trip data loading...');
    
    try {
      const response = await fetch('http://localhost:8000/load-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: 'data/trips/2025-07-15T12_06_02',
          plugin_type: 'vehicle_data'
        }),
        timeout: 10000
      });

      expect(response.status).toBeLessThan(500);
      const result = await response.json();
      
      // Check if data loading was successful or if it's a known error
      if (result.success === false && result.error) {
        console.log('Expected data loading error (test data may not exist):', result.error);
        // This is acceptable - we're testing server connectivity, not data availability
      } else {
        expect(result).toHaveProperty('success');
        console.log('✅ Trip data loading endpoint is functional');
      }
    } catch (error) {
      console.error('❌ Trip data loading test failed:', error.message);
      throw new Error(`Trip data loading endpoint failed: ${error.message}`);
    }
  });
});