import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import type * as NotificationsType from 'expo-notifications';

const isAndroidExpoGo = Platform.OS === 'android' && isRunningInExpoGo();

const Notifications: typeof NotificationsType | null =
  !isAndroidExpoGo && Platform.OS !== 'web'
    ? (require('expo-notifications') as typeof NotificationsType)
    : null;

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function useNotifications() {
  const notificationListener = useRef<NotificationsType.Subscription | null>(null);
  const responseListener = useRef<NotificationsType.Subscription | null>(null);

  useEffect(() => {
    if (!Notifications || Platform.OS === 'web') {
      if (isAndroidExpoGo) {
        console.warn(
          '[IoPet] Notificações push não são suportadas no Expo Go no Android (SDK 53+). ' +
          'Para testar notificações push, utilize uma Development Build (npx expo run:android ou EAS Build).'
        );
      }
      return;
    }

    const notifs = Notifications;

    async function registerForPushNotificationsAsync() {
      if (Platform.OS === 'android') {
        await notifs.setNotificationChannelAsync('default', {
          name: 'default',
          importance: notifs.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#7A3FFF',
        });
      }

      const { status: existingStatus } = await notifs.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await notifs.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return;
      }
      // Aqui obteríamos o expo push token para enviar para o backend
      // const token = (await notifs.getExpoPushTokenAsync()).data;
      // console.log(token);
    }

    registerForPushNotificationsAsync();

    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current = notifs.addNotificationReceivedListener(notification => {
      // Could trigger a local alert or update queries
    });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current = notifs.addNotificationResponseReceivedListener(response => {
      // Handle tap on notification, e.g., navigate to /alerts
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);
}

