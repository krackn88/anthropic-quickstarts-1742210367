import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { credentialManager, CredentialManager, Credentials } from './utils/credentialManager';
import { autoUpdater } from 'electron-updater';
import { MessageBoxReturnValue } from 'electron/main';

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    backgroundColor: '#1e1e1e'
  });

  // Load the correct file based on environment
  if (process.env.NODE_ENV === 'development' || process.argv.includes('--dev')) {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, look for the renderer files in different locations
    let rendererPath = path.join(__dirname, '../renderer/index.html');
    
    // If not found, try looking in the app resources
    if (!fs.existsSync(rendererPath)) {
      rendererPath = path.join(process.resourcesPath, 'renderer/index.html');
    }
    
    // Log the path being loaded (helps with debugging)
    console.log('Loading renderer from:', rendererPath);
    
    try {
      await mainWindow.loadFile(rendererPath);
    } catch (err) {
      console.error('Failed to load renderer:', err);
      dialog.showErrorBox('Error', `Failed to load application UI: ${err}`);
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
}

// App lifecycle handlers
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

// Storage Management
const storageManager = {
  data: new Map<string, string>(),
  
  async get(key: string): Promise<string | null> {
    return this.data.get(key) || null;
  },
  
  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value);
  },
  
  async remove(key: string): Promise<void> {
    this.data.delete(key);
  }
};

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

// IPC handlers for storage management
ipcMain.handle('storage-get', async (_: IpcMainInvokeEvent, key: string): Promise<string | null> => {
  return storageManager.get(key);
});

ipcMain.handle('storage-set', async (_: IpcMainInvokeEvent, key: string, value: string): Promise<void> => {
  await storageManager.set(key, value);
});

ipcMain.handle('storage-remove', async (_: IpcMainInvokeEvent, key: string): Promise<void> => {
  await storageManager.remove(key);
});

// IPC handlers for file management
ipcMain.handle('save-file', async (_: IpcMainInvokeEvent, content: string, fileName: string, fileType: string): Promise<string | null> => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save File',
    defaultPath: `${fileName}.${fileType}`,
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (!canceled && filePath) {
    fs.writeFileSync(filePath, content);
    return filePath;
  }
  
  return null;
});

ipcMain.handle('open-file', async (): Promise<string | null> => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
    title: 'Open File',
    properties: ['openFile']
  });
  
  if (!canceled && filePaths.length > 0) {
    return filePaths[0];
  }
  
  return null;
});

ipcMain.handle('read-file', async (_: IpcMainInvokeEvent, filePath: string): Promise<string> => {
  return fs.readFileSync(filePath, 'utf-8');
});

// IPC handlers for system integration
ipcMain.handle('open-external', async (_: IpcMainInvokeEvent, url: string): Promise<void> => {
  await shell.openExternal(url);
});

ipcMain.handle('show-save-dialog', async (_: IpcMainInvokeEvent, options: Electron.SaveDialogOptions): Promise<string | null> => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow!, options);
  return canceled ? null : filePath || null;
});

ipcMain.handle('show-open-dialog', async (_: IpcMainInvokeEvent, options: Electron.OpenDialogOptions): Promise<string[] | null> => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, options);
  return canceled ? null : filePaths;
});

// IPC handlers for auto-updater
ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// Pro Features handlers
ipcMain.handle('check-license', async (_: IpcMainInvokeEvent, licenseKey: string): Promise<boolean> => {
  // Implement your license checking logic here
  // This is just a placeholder implementation
  return licenseKey === 'CLINE-PRO-1234-5678-9012';
});

ipcMain.handle('activate-pro', async (_: IpcMainInvokeEvent, email: string, licenseKey: string): Promise<boolean> => {
  // Implement your license activation logic here
  // This is just a placeholder implementation
  return email.includes('@') && licenseKey === 'CLINE-PRO-1234-5678-9012';
});

ipcMain.handle('get-pro-features', async (): Promise<string[]> => {
  // Return pro features
  return [
    'Multiple LLM Providers',
    'Custom Instructions',
    'Advanced Prompt Templates',
    'Priority Support',
    'Team Collaboration',
    'Self-Improvement System'
  ];
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded');
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
});
