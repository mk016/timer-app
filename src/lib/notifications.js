import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

// When the app is in the foreground the in-app "Time's up" screen + chime
// already notify the user, so suppress the system banner/sound to avoid
// double alerts. In the background the system shows the notification normally.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function setupAndroidChannel() {
  try {
    await Notifications.setNotificationChannelAsync('timer', {
      name: 'Timer',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#5EEAD4',
    });
  } catch {
    // no-op on unsupported platforms
  }
}

export async function requestNotificationPermission() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleEndNotification(seconds, label, body) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: label || "Time's up",
        body: body || 'Your timer has finished.',
        sound: 'default',
      },
      // `type` is required: without it expo-notifications treats this as a channel-only
      // trigger and fires the notification immediately instead of after `seconds`.
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.round(seconds)),
        channelId: 'timer',
      },
    });
  } catch {
    // no-op
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // no-op
  }
}

export function buzzComplete() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {
    // no-op
  }
}

export function buzzImpact(style = Haptics.ImpactFeedbackStyle.Medium) {
  try {
    Haptics.impactAsync(style).catch(() => {});
  } catch {
    // no-op
  }
}
