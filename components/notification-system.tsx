import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface NotificationSystemProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [slideAnim] = useState(new Animated.Value(-width));

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: -width,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadNotifications = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications).map((notif: any) => ({
          ...notif,
          timestamp: new Date(notif.timestamp)
        }));
        setNotifications(parsed);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error updating notification:', error);
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    try {
      await AsyncStorage.removeItem('notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark.circle.fill';
      case 'warning': return 'exclamationmark.triangle.fill';
      case 'error': return 'xmark.circle.fill';
      case 'info': return 'info.circle.fill';
      default: return 'bell.fill';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'info': return '#2196F3';
      default: return '#757575';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateX: slideAnim }] }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol name="bell.fill" size={24} color="#2196F3" />
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>
            Notifications
          </ThemedText>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{unreadCount}</ThemedText>
            </View>
          )}
        </View>
        
        <View style={styles.headerActions}>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={styles.clearButton}>
              <ThemedText style={styles.clearButtonText}>Clear All</ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeButtonEnhanced}>
            <IconSymbol name="xmark" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="bell.slash" size={48} color="#ccc" />
            <ThemedText style={styles.emptyText}>No notifications</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              You'll see alerts and updates here
            </ThemedText>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.read && styles.unreadNotification
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={styles.notificationIcon}>
                <IconSymbol 
                  name={getNotificationIcon(notification.type) as any} 
                  size={20} 
                  color={getNotificationColor(notification.type)} 
                />
              </View>
              
              <View style={styles.notificationContent}>
                <ThemedText type="defaultSemiBold" style={styles.notificationTitle}>
                  {notification.title}
                </ThemedText>
                <ThemedText style={styles.notificationMessage}>
                  {notification.message}
                </ThemedText>
                <ThemedText style={styles.notificationTime}>
                  {notification.timestamp.toLocaleString()}
                </ThemedText>
              </View>
              
              {!notification.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </View>
    </Animated.View>
  );
};

// Utility function to add notifications
export const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  try {
    const savedNotifications = await AsyncStorage.getItem('notifications');
    const existingNotifications = savedNotifications ? JSON.parse(savedNotifications) : [];
    
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date(),
      read: false
    };
    
    const updatedNotifications = [newNotification, ...existingNotifications].slice(0, 50); // Keep last 50
    await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    return newNotification;
  } catch (error) {
    console.error('Error adding notification:', error);
    return null;
  }
};

// Utility function to add reward notifications
export const addRewardNotification = async (points: number, reason: string) => {
  return addNotification({
    type: 'success',
    title: '🎉 Points Earned!',
    message: `You earned ${points} points for ${reason}`,
  });
};

// Utility function to add alert notifications
export const addAlertNotification = async (title: string, message: string, type: 'warning' | 'error' = 'warning') => {
  return addNotification({
    type,
    title,
    message,
  });
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
  },
  badge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
  },
  clearButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonEnhanced: {
    padding: 12,
    backgroundColor: '#F44336',
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  unreadNotification: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  notificationIcon: {
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
    marginTop: 8,
  },
});