/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/client/src', '<rootDir>/tests/unit'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        skipLibCheck: true,
        noImplicitAny: false,
        moduleResolution: 'node',
        allowJs: true,
        isolatedModules: true,
      },
    }],
    '^.+\\.(js|jsx)$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@assets/(.*)$': '<rootDir>/attached_assets/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'client/src/**/*.{ts,tsx}',
    '!client/src/**/*.d.ts',
    '!client/src/main.tsx',
    '!client/src/vite-env.d.ts',
    '!client/src/components/ui/**',
  ],
  coverageDirectory: 'test-reports/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  testEnvironmentOptions: {
    url: 'http://localhost:5000'
  },
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$))"
  ],
};