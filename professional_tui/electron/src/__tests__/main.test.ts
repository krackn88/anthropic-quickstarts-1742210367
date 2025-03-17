import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { credentialManager, CredentialManager } from '../utils/credentialManager';
import { EventEmitter } from 'events';
import { IpcMainEvent } from 'electron';
import { MockBrowserWindowInstance } from './mocks/types';

// Import mocks
import { mockElectron, app as mockApp, dialog as mockDialog, ipcMain as mockIpcMain } from './mocks/electron';

let mainWindow: MockBrowserWindowInstance;

// Create mock process emitter
class MockProcess extends EventEmitter {
  private _listeners: { [key: string]: Function[] } = {};

  listeners(event: string | symbol): Function[] {
    return this._listeners[event as string] || [];
  }

  addListener(event: string | symbol, listener: Function): this {
    if (!this._listeners[event as string]) {
      this._listeners[event as string] = [];
    }
    this._listeners[event as string].push(listener);
    return super.addListener(event, listener);
  }

  removeAllListeners(event?: string | symbol): this {
    if (event) {
      delete this._listeners[event as string];
    } else {
      this._listeners = {};
    }
    return super.removeAllListeners(event);
  }
}

const mockProcessEmitter = new MockProcess();

// Mock modules
jest.mock('electron', () => mockElectron);

const mockAutoUpdater = {
  checkForUpdatesAndNotify: jest.fn(),
  on: jest.fn(),
  quitAndInstall: jest.fn(),
} as const;

jest.mock('electron-updater', () => ({
  autoUpdater: mockAutoUpdater,
}));

// Import after mocks
import { autoUpdater } from 'electron-updater';

describe('Main Process', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mainWindow = new (mockElectron.BrowserWindow as any)();
    mockProcessEmitter.removeAllListeners();
  });

  describe('Window Creation', () => {
    test('creates window with correct settings', () => {
      expect(mockElectron.BrowserWindow).toHaveBeenCalledWith(expect.objectContaining({
        width: 1200,
        height: 800,
        webPreferences: expect.objectContaining({
          nodeIntegration: true,
          contextIsolation: false,
        }),
      }));
    });

    test('loads correct URL based on environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      expect(mainWindow.loadURL).toHaveBeenCalledWith('http://localhost:3000');
      expect(mainWindow.webContents.openDevTools).toHaveBeenCalled();

      process.env.NODE_ENV = 'production';
      (mainWindow.loadURL as jest.Mock).mockClear();
      mainWindow.loadFile('index.html');
      expect(mainWindow.loadFile).toHaveBeenCalledWith('index.html');
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('App Lifecycle', () => {
    test('sets up app event handlers', () => {
      expect(mockApp.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function));
      expect(mockApp.on).toHaveBeenCalledWith('activate', expect.any(Function));
    });

    test('quits on window-all-closed for non-darwin platforms', () => {
      const [, handler] = ((mockApp.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'window-all-closed'
      ) || []) as [string, () => void];
      const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
      handler?.();
      expect(mockApp.quit).toHaveBeenCalled();
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform);
      }
    });

    test('creates new window on activate when no windows exist', () => {
      const [, handler] = ((mockApp.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'activate'
      ) || []) as [string, () => void];
      (mockElectron.BrowserWindow.getAllWindows as jest.Mock).mockReturnValue([]);
      handler?.();
      expect(mockElectron.BrowserWindow).toHaveBeenCalled();
    });
  });

  describe('IPC Handlers', () => {
    test('handles get-credentials', async () => {
      const [, handler] = ((mockIpcMain.handle as jest.Mock).mock.calls.find(
        ([channel]) => channel === 'get-credentials'
      ) || []) as [string, (event: IpcMainEvent) => Promise<void>];
      if (!handler) throw new Error('Handler not found');
      await handler({} as IpcMainEvent);
      expect(credentialManager.getCredentials).toHaveBeenCalled();
    });

    test('handles save-credentials', async () => {
      const [, handler] = ((mockIpcMain.handle as jest.Mock).mock.calls.find(
        ([channel]) => channel === 'save-credentials'
      ) || []) as [string, (event: IpcMainEvent, credentials: any) => Promise<void>];
      if (!handler) throw new Error('Handler not found');
      const credentials = { claudeApiKey: 'test-key' };
      await handler({} as IpcMainEvent, credentials);
      expect(credentialManager.saveCredentials).toHaveBeenCalledWith(credentials);
    });

    test('handles update-credential', async () => {
      const [, handler] = ((mockIpcMain.handle as jest.Mock).mock.calls.find(
        ([channel]) => channel === 'update-credential'
      ) || []) as [string, (event: IpcMainEvent, key: string, value: string) => Promise<void>];
      if (!handler) throw new Error('Handler not found');
      await handler({} as IpcMainEvent, 'claudeApiKey', 'test-value');
      expect(credentialManager.updateCredential).toHaveBeenCalledWith('claudeApiKey', 'test-value');
    });

    test('handles validate-api-key', () => {
      const [, handler] = ((mockIpcMain.handle as jest.Mock).mock.calls.find(
        ([channel]) => channel === 'validate-api-key'
      ) || []) as [string, (event: IpcMainEvent, key: string, type: string) => void];
      if (!handler) throw new Error('Handler not found');
      handler({} as IpcMainEvent, 'test-key', 'claudeApiKey');
      expect(CredentialManager.validateApiKey).toHaveBeenCalledWith('test-key', 'claudeApiKey');
    });
  });

  describe('Auto Updater', () => {
    test('checks for updates on launch', () => {
      expect(mockAutoUpdater.checkForUpdatesAndNotify).toHaveBeenCalled();
    });

    test('handles update-available event', () => {
      const [, handler] = ((mockAutoUpdater.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'update-available'
      ) || []) as [string, () => void];
      if (!handler) throw new Error('Handler not found');
      handler();
      expect(mainWindow.webContents.send).toHaveBeenCalledWith('update-available');
    });

    test('handles update-downloaded event', async () => {
      const [, handler] = ((mockAutoUpdater.on as jest.Mock).mock.calls.find(
        ([event]) => event === 'update-downloaded'
      ) || []) as [string, () => Promise<void>];
      if (!handler) throw new Error('Handler not found');
      (mockDialog.showMessageBox as jest.Mock).mockImplementationOnce(() => Promise.resolve({ response: 0 }));
      await handler();
      expect(mainWindow.webContents.send).toHaveBeenCalledWith('update-downloaded');
      expect(mockDialog.showMessageBox).toHaveBeenCalledWith({
        type: 'info',
        title: 'Update Ready',
        message: 'A new version has been downloaded. Restart the application to apply the updates.',
        buttons: ['Restart', 'Later'],
      });
      expect(mockAutoUpdater.quitAndInstall).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles uncaught exceptions', () => {
      const error = new Error('Test error');
      mockProcessEmitter.emit('uncaughtException', error);
      expect(mockDialog.showErrorBox).toHaveBeenCalledWith(
        'Error',
        `An unexpected error occurred: ${error.message}`
      );
    });

    test('handles unhandled rejections', () => {
      const error = new Error('Test error');
      mockProcessEmitter.emit('unhandledRejection', error);
      expect(mockDialog.showErrorBox).toHaveBeenCalledWith(
        'Error',
        `An unexpected error occurred: ${error.message}`
      );
    });
  });
});
