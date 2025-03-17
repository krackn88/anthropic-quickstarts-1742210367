import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import { credentialManager, CredentialManager, Credentials } from './utils/credentialManager';
import { autoUpdater } from 'electron-updater';
import { MessageBoxReturnValue } from 'electron/main';

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1e1e1e'
  });

  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for credential management
ipcMain.handle('get-credentials', async (): Promise<Credentials | null> => {
  return await credentialManager.getCredentials();
});

ipcMain.handle('save-credentials', async (_: IpcMainInvokeEvent, credentials: Credentials): Promise<void> => {
  await credentialManager.saveCredentials(credentials);
});

ipcMain.handle('update-credential', async (_: IpcMainInvokeEvent, key: keyof Credentials, value: string): Promise<void> => {
  await credentialManager.updateCredential(key, value);
});

ipcMain.handle('validate-api-key', (_: IpcMainInvokeEvent, key: string, type: keyof Credentials): boolean => {
  return CredentialManager.validateApiKey(key, type);
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-available');
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded');
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'A new version has been downloaded. Restart the application to apply the updates.',
      buttons: ['Restart', 'Later']
    }).then((buttonIndex: MessageBoxReturnValue) => {
      if (buttonIndex.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }
});

// Error handling
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
});

process.on('unhandledRejection', (error: unknown) => {
  console.error('Unhandled Rejection:', error);
  if (error instanceof Error) {
    dialog.showErrorBox('Error', `An unexpected error occurred: ${error.message}`);
  }
});
