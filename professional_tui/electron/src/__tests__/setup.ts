import { Credentials } from '../utils/credentialManager';
import { jest, beforeEach } from '@jest/globals';
import { MessageBoxReturnValue } from 'electron';

declare global {
  var mockCredentials: Credentials;
}

// Initialize mock data
global.mockCredentials = {
  claudeApiKey: 'sk-ant-api03-valid-test-key-48chars-long-string-test-ok',
  githubPat: 'github_pat_valid_test_key_123456789abcdef',
  huggingfaceWriteKey: 'hf_valid_test_write_key_123456789abcdef',
  huggingfaceReadKey: 'hf_valid_test_read_key_123456789abcdef',
  vastaiApiKey: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
};

// Mock Electron
const mockBrowserWindow = {
  loadURL: jest.fn().mockResolvedValue(undefined),
  loadFile: jest.fn().mockResolvedValue(undefined),
  webContents: {
    openDevTools: jest.fn(),
    send: jest.fn(),
  },
};

const mockBrowserWindowConstructor = jest.fn(() => mockBrowserWindow);
mockBrowserWindowConstructor.getAllWindows = jest.fn().mockReturnValue([]);

const mockMessageBoxResponse: MessageBoxReturnValue = {
  response: 0,
  checkboxChecked: false,
};

jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    quit: jest.fn(),
    getPath: jest.fn().mockReturnValue('/mock/path'),
  },
  BrowserWindow: mockBrowserWindowConstructor,
  ipcMain: {
    handle: jest.fn(),
  },
  dialog: {
    showMessageBox: jest.fn().mockResolvedValue(mockMessageBoxResponse),
    showErrorBox: jest.fn(),
  },
}));

// Mock electron-updater
jest.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdatesAndNotify: jest.fn(),
    on: jest.fn(),
    quitAndInstall: jest.fn(),
  },
}));

// Mock keytar
jest.mock('keytar', () => ({
  __esModule: true,
  default: {
    setPassword: jest.fn(),
    getPassword: jest.fn(),
    deletePassword: jest.fn(),
  },
}));

// Mock axios
jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({ data: {} })),
  isAxiosError: (error: unknown): error is { isAxiosError: true } => {
    return typeof error === 'object' && error !== null && 'isAxiosError' in error;
  },
}));

// Mock credentialManager
const mockCredentialManager = {
  getCredentials: jest.fn().mockResolvedValue(global.mockCredentials),
  saveCredentials: jest.fn(),
  updateCredential: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
  hasAllCredentials: jest.fn().mockResolvedValue(true),
  validateApiKey: jest.fn().mockImplementation((key: string, type: string) => {
    switch (type) {
      case 'claudeApiKey':
        return /^sk-ant-api\d{2}-[a-zA-Z0-9_-]{48}$/.test(key);
      case 'githubPat':
        return /^github_pat_[a-zA-Z0-9_]{22,}$/.test(key);
      case 'huggingfaceWriteKey':
      case 'huggingfaceReadKey':
        return /^hf_[a-zA-Z0-9]{32,}$/.test(key);
      case 'vastaiApiKey':
        return /^[a-f0-9]{64}$/.test(key);
      default:
        return false;
    }
  }),
};

jest.mock('../utils/credentialManager', () => ({
  __esModule: true,
  credentialManager: mockCredentialManager,
  CredentialManager: {
    validateApiKey: mockCredentialManager.validateApiKey,
  },
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
