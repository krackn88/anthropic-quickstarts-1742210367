import { NotificationManager, NotificationType, NotificationChannel } from '../utils/notification_manager';

describe('NotificationManager', () => {
  let notificationManager: NotificationManager;

  beforeEach(() => {
    notificationManager = new NotificationManager();
  });

  it('should create a notification manager instance', () => {
    expect(notificationManager).toBeTruthy();
  });

  it('should have correct notification types', () => {
    expect(NotificationType.INFO).toBe('info');
    expect(NotificationType.WARNING).toBe('warning');
    expect(NotificationType.ERROR).toBe('error');
    expect(NotificationType.SUCCESS).toBe('success');
  });

  it('should have correct notification channels', () => {
    expect(NotificationChannel.UI_TOAST).toBe('ui_toast');
    expect(NotificationChannel.SYSTEM_TRAY).toBe('system_tray');
    expect(NotificationChannel.DESKTOP).toBe('desktop');
  });
});
