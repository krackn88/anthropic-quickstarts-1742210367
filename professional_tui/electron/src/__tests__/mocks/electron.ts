import { jest } from '@jest/globals';
import { MessageBoxReturnValue } from 'electron';
import { MockElectron, MockBrowserWindowInstance, MockBrowserWindowStatic } from './types';

type PromiseFunc<T> = (...args: any[]) => Promise<T>;
type VoidFunc = (...args: any[]) => void;

// Create mock browser window instance
const createMockBrowserWindow = (): MockBrowserWindowInstance => ({
  loadURL: jest.fn().mockImplementation(() => Promise.resolve()) as jest.MockedFunction<(url: string) => Promise<void>>,
  loadFile: jest.fn().mockImplementation(() => Promise.resolve()) as jest.MockedFunction<(path: string) => Promise<void>>,
  webContents: {
    openDevTools: jest.fn() as jest.MockedFunction<() => void>,
    send: jest.fn() as jest.MockedFunction<(channel: string, ...args: any[]) => void>,
  },
  on: jest.fn() as jest.MockedFunction<(event: string, listener: (...args: any[]) => void) => void>,
  show: jest.fn() as jest.MockedFunction<() => void>,
});

// Create mock browser window constructor
const BrowserWindowClass = jest.fn().mockImplementation(createMockBrowserWindow);
Object.assign(BrowserWindowClass, {
  getAllWindows: jest.fn().mockReturnValue([]),
});

const mockBrowserWindow = BrowserWindowClass as unknown as MockBrowserWindowStatic;

const mockMessageBoxResponse: MessageBoxReturnValue = {
  response: 0,
  checkboxChecked: false,
};

// Create mock app
const mockApp = {
  whenReady: jest.fn().mockImplementation(() => Promise.resolve()) as jest.MockedFunction<() => Promise<void>>,
  on: jest.fn() as jest.MockedFunction<(event: string, listener: (...args: any[]) => void) => void>,
  quit: jest.fn() as jest.MockedFunction<() => void>,
  getPath: jest.fn().mockReturnValue('/mock/path') as jest.MockedFunction<(name: string) => string>,
};

// Create mock IPC main
const mockIpcMain = {
  handle: jest.fn() as jest.MockedFunction<(channel: string, listener: (...args: any[]) => any) => void>,
};

// Create mock dialog
const mockDialog = {
  showMessageBox: jest.fn().mockImplementation(() => Promise.resolve(mockMessageBoxResponse)) as jest.MockedFunction<(options: any) => Promise<MessageBoxReturnValue>>,
  showErrorBox: jest.fn() as jest.MockedFunction<(title: string, content: string) => void>,
};

// Create mock electron
export const mockElectron: MockElectron = {
  app: mockApp,
  BrowserWindow: mockBrowserWindow,
  ipcMain: mockIpcMain,
  dialog: mockDialog,
};

// Export individual mocks for direct access in tests
export const { app, ipcMain, dialog } = mockElectron;
