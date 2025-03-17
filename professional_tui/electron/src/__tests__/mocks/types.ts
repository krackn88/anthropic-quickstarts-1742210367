import { BrowserWindow, IpcMainEvent } from 'electron';

export interface MockBrowserWindowWebContents {
  openDevTools(): void;
  send(channel: string, ...args: any[]): void;
}

export interface MockBrowserWindowInstance {
  loadURL(url: string): Promise<void>;
  loadFile(path: string): Promise<void>;
  webContents: MockBrowserWindowWebContents;
  on(event: string, listener: (...args: any[]) => void): void;
  show(): void;
}

export interface MockBrowserWindowStatic {
  new (): MockBrowserWindowInstance;
  getAllWindows(): BrowserWindow[];
}

export interface MockApp {
  whenReady(): Promise<void>;
  on(event: string, listener: (...args: any[]) => void): void;
  quit(): void;
  getPath(name: string): string;
}

export interface MockIpcMain {
  handle(channel: string, listener: (event: IpcMainEvent, ...args: any[]) => any): void;
}

export interface MockDialog {
  showMessageBox(options: any): Promise<{ response: number; checkboxChecked: boolean }>;
  showErrorBox(title: string, content: string): void;
}

export interface MockElectron {
  app: MockApp;
  BrowserWindow: MockBrowserWindowStatic;
  ipcMain: MockIpcMain;
  dialog: MockDialog;
}
