// jest.config.js
export default {
    transform: {
      '^.+\\.jsx?$': 'babel-jest', // Transpile JS/JSX files with Babel
    },
    testEnvironment: 'jsdom', // Simulate browser environment
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
      '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js', // Mock image imports
    },
    setupFiles: ['<rootDir>/jest.setup.js'], // For TextEncoder/TextDecoder
    setupFilesAfterEnv: [
      '@testing-library/jest-dom', // Load jest-dom matchers
    ],
  };