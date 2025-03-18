import { contextBridge, ipcRenderer } from 'electron';
import { Credentials } from './utils/credentialManager';
import { NotificationType, NotificationChannel, NotificationConfig } from './utils/notification_manager';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // Credential Management
    getCredentials: (): Promise<Credentials | null> => ipcRenderer.invoke('get-credentials'),
    saveCredentials: (credentials: Credentials): Promise<void> => ipcRenderer.invoke('save-credentials', credentials),
    updateCredential: (key: keyof Credentials, value: string): Promise<void> => ipcRenderer.invoke('update-credential', key, value),
    validateApiKey: (key: string, type: keyof Credentials): Promise<boolean> => ipcRenderer.invoke('validate-api-key', key, type),
    
    // Storage Management
    getItem: (key: string): Promise<string | null> => ipcRenderer.invoke('storage-get', key),
    setItem: (key: string, value: string): Promise<void> => ipcRenderer.invoke('storage-set', key, value),
    removeItem: (key: string): Promise<void> => ipcRenderer.invoke('storage-remove', key),
    listCachedModels: () => ipcRenderer.invoke('list-cached-models'),
    getCacheStats: () => ipcRenderer.invoke('get-cache-stats'),
    
    // File Management
    saveFile: (content: string, fileName: string, fileType: string): Promise<string | null> => 
      ipcRenderer.invoke('save-file', content, fileName, fileType),
    openFile: (): Promise<string | null> => ipcRenderer.invoke('open-file'),
    readFile: (filePath: string): Promise<string> => ipcRenderer.invoke('read-file', filePath),
    
    // Auto Updater
    onUpdateAvailable: (callback: () => void) => {
      const subscription = (_event: Electron.IpcRendererEvent) => callback();
      ipcRenderer.on('update-available', subscription);
      return () => ipcRenderer.removeListener('update-available', subscription);
    },
    onUpdateDownloaded: (callback: () => void) => {
      const subscription = (_event: Electron.IpcRendererEvent) => callback();
      ipcRenderer.on('update-downloaded', subscription);
      return () => ipcRenderer.removeListener('update-downloaded', subscription);
    },
    installUpdate: () => ipcRenderer.invoke('install-update'),
    
    // System Integration
    openExternal: (url: string): Promise<void> => ipcRenderer.invoke('open-external', url),
    showSaveDialog: (options: any): Promise<string | null> => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options: any): Promise<string[] | null> => ipcRenderer.invoke('show-open-dialog', options),
    
    // Pro Features
    checkLicense: (licenseKey: string): Promise<boolean> => ipcRenderer.invoke('check-license', licenseKey),
    activatePro: (email: string, licenseKey: string): Promise<boolean> => ipcRenderer.invoke('activate-pro', email, licenseKey),
    getProFeatures: (): Promise<string[]> => ipcRenderer.invoke('get-pro-features'),

    // Notification Management
    sendNotification: (config: NotificationConfig) => ipcRenderer.send('send-notification', config),
    
    // Enums for better type safety
    ModelType: {
      CLAUDE: 'claude',
      GPT: 'gpt',
      LLAMA: 'llama',
    },
    FileType: {
      JSON: 'json',
      MARKDOWN: 'md',
      TEXT: 'txt',
      HTML: 'html',
    }
  }
);

// Expose enums for type safety in renderer
contextBridge.exposeInMainWorld('electronEnums', {
  NotificationType,
  NotificationChannel
});
