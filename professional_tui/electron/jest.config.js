/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json'
      }
    ]
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  setupFiles: ['<rootDir>/src/__tests__/setMaxListeners.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testEnvironmentOptions: {
    url: 'http://localhost/'
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/__tests__/',
  ],
  // Increase timeout for slower tests
  testTimeout: 10000,
  // Handle test environment better
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
