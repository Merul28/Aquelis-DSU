import React, { useState, useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { NotificationSystem, addRewardNotification } from '@/components/notification-system';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Add welcome notification on app start
    const addWelcomeNotification = async () => {
      await addRewardNotification(25, 'joining Aquelis 2.0! Welcome to the community.');
    };
    
    // Delay to ensure AsyncStorage is ready
    setTimeout(addWelcomeNotification, 1000);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      
      <NotificationSystem
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </ThemeProvider>
  );
}
