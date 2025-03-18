import { Notification } from 'electron';
import * as path from 'path';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export enum NotificationChannel {
  SYSTEM = 'system',
  API = 'api',
  MODEL = 'model',
  UPDATE = 'update',
  LICENSE = 'license'
}

export interface NotificationConfig {
  title: string;
  body: string;
  type: NotificationType;
  channel?: NotificationChannel;
  duration?: number;
  actions?: string[];
}

export class NotificationManager {
  /**
   * Send a notification to the user
   * @param config The notification configuration
   */
  static sendNotification(config: NotificationConfig): void {
    const notification = new Notification({
      title: config.title,
      body: config.body,
      silent: false,
      timeoutType: 'default',
      actions: config.actions?.map(action => ({ type: 'button', text: action })) || []
    });
    
    notification.show();
    
    // Auto-close the notification after a specified duration
    if (config.duration) {
      setTimeout(() => {
        notification.close();
      }, config.duration);
    }
  }
  
  /**
   * Send an info notification
   * @param title The notification title
   * @param message The notification message
   * @param channel The notification channel
   */
  static info(title: string, message: string, channel: NotificationChannel = NotificationChannel.SYSTEM): void {
    this.sendNotification({
      title,
      body: message,
      type: NotificationType.INFO,
      channel,
      duration: 5000
    });
  }
  
  /**
   * Send a success notification
   * @param title The notification title
   * @param message The notification message
   * @param channel The notification channel
   */
  static success(title: string, message: string, channel: NotificationChannel = NotificationChannel.SYSTEM): void {
    this.sendNotification({
      title,
      body: message,
      type: NotificationType.SUCCESS,
      channel,
      duration: 5000
    });
  }
  
  /**
   * Send a warning notification
   * @param title The notification title
   * @param message The notification message
   * @param channel The notification channel
   */
  static warning(title: string, message: string, channel: NotificationChannel = NotificationChannel.SYSTEM): void {
    this.sendNotification({
      title,
      body: message,
      type: NotificationType.WARNING,
      channel,
      duration: 8000
    });
  }
  
  /**
   * Send an error notification
   * @param title The notification title
   * @param message The notification message
   * @param channel The notification channel
   */
  static error(title: string, message: string, channel: NotificationChannel = NotificationChannel.SYSTEM): void {
    this.sendNotification({
      title,
      body: message,
      type: NotificationType.ERROR,
      channel,
      duration: 10000
    });
  }
}

// Setup IPC handlers for notifications in main process
export const setupNotificationHandlers = (ipcMain: Electron.IpcMain): void => {
  ipcMain.on('send-notification', (_, config: NotificationConfig) => {
    NotificationManager.sendNotification(config);
  });
};

export default NotificationManager;
