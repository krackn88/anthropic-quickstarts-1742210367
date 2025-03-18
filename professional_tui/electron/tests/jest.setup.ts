import { jest } from '@jest/globals';

// Mock electron
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn()
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn()
  },
  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn(),
    invoke: jest.fn()
  }
}));

// Mock keytar
jest.mock('keytar', () => ({
  getPassword: jest.fn(),
  setPassword: jest.fn(),
  deletePassword: jest.fn()
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
