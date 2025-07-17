#!/usr/bin/env node

/**
 * Comprehensive Test Runner Script
 * Runs all tests (unit + e2e) and generates consolidated reports
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.bright}${colors.blue}Running: ${description}${colors.reset}`);
  log(`Command: ${command}`, colors.cyan);
  
  try {
    const output = execSync(command, { 
      stdio: 'pipe', 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    log(`✅ ${description} completed successfully`, colors.green);
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} failed`, colors.red);
    log(`Error: ${error.message}`, colors.red);
    return { success: false, error: error.message, output: error.stdout };
  }
}

function createReportDirectory() {
  const reportDir = join(process.cwd(), 'test-reports');
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
    log(`Created test reports directory: ${reportDir}`, colors.green);
  }
  return reportDir;
}

function generateTestSummary(results) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results
  };

  const reportDir = createReportDirectory();
  const summaryPath = join(reportDir, 'test-summary.json');
  
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  log(`\nTest summary saved to: ${summaryPath}`, colors.green);
  
  return summary;
}

function printTestSummary(summary) {
  log(`\n${colors.bright}${colors.magenta}=== TEST EXECUTION SUMMARY ===${colors.reset}`);
  log(`Total Test Suites: ${summary.totalTests}`);
  log(`Passed: ${summary.passed}`, colors.green);
  log(`Failed: ${summary.failed}`, summary.failed > 0 ? colors.red : colors.green);
  log(`Success Rate: ${((summary.passed / summary.totalTests) * 100).toFixed(1)}%`);
  
  if (summary.failed > 0) {
    log(`\n${colors.bright}${colors.red}Failed Tests:${colors.reset}`);
    summary.results.filter(r => !r.success).forEach(result => {
      log(`  ❌ ${result.description}`, colors.red);
    });
  }
}

async function main() {
  const startTime = Date.now();
  
  log(`${colors.bright}${colors.magenta}Debug Player Framework - Comprehensive Test Runner${colors.reset}`);
  log(`${colors.bright}Starting test execution at: ${new Date().toLocaleString()}${colors.reset}`);
  
  const testResults = [];
  const reportDir = createReportDirectory();

  // 1. Run Unit Tests with Coverage
  log(`\n${colors.bright}${colors.yellow}=== UNIT TESTS (Jest) ===${colors.reset}`);
  const unitTestResult = runCommand(
    'npx jest --coverage --coverageDirectory=test-reports/coverage --testPathPatterns="__tests__" --passWithNoTests',
    'Unit Tests with Coverage'
  );
  testResults.push({
    type: 'unit',
    description: 'Jest Unit Tests',
    success: unitTestResult.success,
    output: unitTestResult.output,
    error: unitTestResult.error
  });

  // 2. Run E2E Tests
  log(`\n${colors.bright}${colors.yellow}=== E2E TESTS (Playwright) ===${colors.reset}`);
  const e2eTestResult = runCommand(
    'npx playwright test --reporter=html --output test-reports/e2e-results',
    'End-to-End Tests'
  );
  testResults.push({
    type: 'e2e',
    description: 'Playwright E2E Tests',
    success: e2eTestResult.success,
    output: e2eTestResult.output,
    error: e2eTestResult.error
  });

  // 3. TypeScript Type Checking
  log(`\n${colors.bright}${colors.yellow}=== TYPE CHECKING ===${colors.reset}`);
  const typeCheckResult = runCommand(
    'npx tsc --noEmit',
    'TypeScript Type Checking'
  );
  testResults.push({
    type: 'types',
    description: 'TypeScript Type Checking',
    success: typeCheckResult.success,
    output: typeCheckResult.output,
    error: typeCheckResult.error
  });

  // 4. Generate Test Summary
  const summary = generateTestSummary(testResults);
  printTestSummary(summary);

  // 5. Generate HTML Report Index
  const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Player Framework - Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .success { border-left: 4px solid #28a745; }
        .failure { border-left: 4px solid #dc3545; }
        .warning { border-left: 4px solid #ffc107; }
        .links { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .link-card { background: #e9ecef; padding: 20px; border-radius: 5px; text-align: center; }
        .link-card a { text-decoration: none; color: #007bff; font-weight: bold; }
        .link-card a:hover { text-decoration: underline; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .test-result.success { background: #d4edda; color: #155724; }
        .test-result.failure { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Debug Player Framework - Test Results</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
            <p>Duration: ${((Date.now() - startTime) / 1000).toFixed(2)}s</p>
        </div>
        
        <div class="summary">
            <div class="metric ${summary.failed === 0 ? 'success' : 'failure'}">
                <h3>Overall Status</h3>
                <p>${summary.failed === 0 ? '✅ PASS' : '❌ FAIL'}</p>
            </div>
            <div class="metric">
                <h3>Total Tests</h3>
                <p>${summary.totalTests}</p>
            </div>
            <div class="metric success">
                <h3>Passed</h3>
                <p>${summary.passed}</p>
            </div>
            <div class="metric ${summary.failed > 0 ? 'failure' : 'success'}">
                <h3>Failed</h3>
                <p>${summary.failed}</p>
            </div>
            <div class="metric">
                <h3>Success Rate</h3>
                <p>${((summary.passed / summary.totalTests) * 100).toFixed(1)}%</p>
            </div>
        </div>

        <div class="links">
            <div class="link-card">
                <h3>📊 Unit Test Coverage</h3>
                <p>Jest test results and code coverage metrics</p>
                <a href="./coverage/index.html">View Coverage Report</a>
            </div>
            <div class="link-card">
                <h3>🖥️ E2E Test Results</h3>
                <p>Playwright test results and screenshots</p>
                <a href="./e2e-results/index.html">View E2E Report</a>
            </div>
            <div class="link-card">
                <h3>📄 Test Summary</h3>
                <p>JSON summary of all test results</p>
                <a href="./test-summary.json">View JSON Summary</a>
            </div>
        </div>

        <div style="margin-top: 30px;">
            <h3>Test Results Details</h3>
            ${testResults.map(result => `
                <div class="test-result ${result.success ? 'success' : 'failure'}">
                    <strong>${result.success ? '✅' : '❌'} ${result.description}</strong>
                    <p>Type: ${result.type}</p>
                    ${result.error ? `<p>Error: ${result.error}</p>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

  writeFileSync(join(reportDir, 'index.html'), htmlReport);
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  log(`\n${colors.bright}${colors.magenta}=== TEST EXECUTION COMPLETE ===${colors.reset}`);
  log(`Total execution time: ${duration.toFixed(2)}s`);
  log(`\nTest reports generated in: ${reportDir}`);
  log(`Open ${join(reportDir, 'index.html')} in browser to view detailed results`);
  
  // Exit with error code if any tests failed
  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch(error => {
  log(`\n${colors.bright}${colors.red}Test runner failed: ${error.message}${colors.reset}`);
  process.exit(1);
});