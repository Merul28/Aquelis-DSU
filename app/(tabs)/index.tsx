import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationSystem, addAlertNotification } from '@/components/notification-system';
import { useAuth } from '@/contexts/AuthContext';
import { UserActions } from '@/lib/userActions';
import { router } from 'expo-router';
import { TestDatabaseActions } from '@/components/TestDatabaseActions';

interface UserStats {
  points: number;
  reportsSubmitted: number;
  level: number;
  streak: number;
}

interface WaterQualityData {
  ph: number;
  turbidity: number;
  temperature: number;
  status: 'safe' | 'warning' | 'danger';
  lastUpdated: string;
}

export default function HomeScreen() {
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    points: 0,
    reportsSubmitted: 0,
    level: 1,
    streak: 0
  });
  
  const [waterQuality, setWaterQuality] = useState<WaterQualityData>({
    ph: 7.4,
    turbidity: 2.1,
    temperature: 24.5,
    status: 'safe',
    lastUpdated: new Date().toLocaleString()
  });

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadUserData();
    getCurrentLocation();
    const cleanup = simulateWaterQualityData();
    
    return cleanup;
  }, []);

  // Update user stats when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setUserStats({
        points: userProfile.points,
        reportsSubmitted: userProfile.reportsSubmitted,
        level: userProfile.level,
        streak: userProfile.streak
      });
    }
  }, [userProfile]);

  const loadUserData = async () => {
    try {
      // If we have userProfile from database, use that as primary source
      if (userProfile) {
        setUserStats({
          points: userProfile.points,
          reportsSubmitted: userProfile.reportsSubmitted,
          level: userProfile.level,
          streak: userProfile.streak
        });
      } else {
        // Fallback to AsyncStorage for backward compatibility
        const userData = await AsyncStorage.getItem('userStats');
        if (userData) {
          setUserStats(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleQuickAction = async (action: string) => {
    if (!user) return;

    try {
      switch (action) {
        case 'sensors':
          await UserActions.connectSensor(user.$id);
          await refreshUserProfile();
          router.push('/(tabs)/sensors');
          break;
        case 'health':
          await UserActions.completeHealthCheck(user.$id);
          await refreshUserProfile();
          router.push('/(tabs)/symptoms');
          break;
        case 'report':
          await UserActions.submitReport(user.$id);
          await refreshUserProfile();
          router.push('/(tabs)/report');
          break;
        case 'map':
          router.push('/(tabs)/map');
          break;
      }
    } catch (error) {
      console.error('Error handling quick action:', error);
      Alert.alert('Error', 'Failed to complete action. Please try again.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show water quality data in your area.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const simulateWaterQualityData = () => {
    // Simulate real-time water quality data updates
    const interval = setInterval(() => {
      const ph = 6.5 + Math.random() * 2; // pH between 6.5-8.5
      const turbidity = Math.random() * 5; // Turbidity 0-5 NTU
      const temperature = 20 + Math.random() * 15; // Temperature 20-35°C
      
      let status: 'safe' | 'warning' | 'danger' = 'safe';
      if (ph < 6.5 || ph > 8.5 || turbidity > 4) {
        status = 'danger';
        // Add alert notification for dangerous water quality
        addAlertNotification(
          '⚠️ Water Quality Alert',
          `Dangerous water quality detected! pH: ${ph.toFixed(1)}, Turbidity: ${turbidity.toFixed(1)} NTU. Please avoid consumption.`,
          'error'
        );
      } else if (ph < 7 || ph > 8 || turbidity > 2) {
        status = 'warning';
        // Add warning notification
        addAlertNotification(
          '⚠️ Water Quality Warning',
          `Water quality parameters are outside normal range. pH: ${ph.toFixed(1)}, Turbidity: ${turbidity.toFixed(1)} NTU.`,
          'warning'
        );
      }

      setWaterQuality({
        ph: parseFloat(ph.toFixed(1)),
        turbidity: parseFloat(turbidity.toFixed(1)),
        temperature: parseFloat(temperature.toFixed(1)),
        status,
        lastUpdated: new Date().toLocaleString()
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'danger': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return 'checkmark.circle.fill';
      case 'warning': return 'exclamationmark.triangle.fill';
      case 'danger': return 'xmark.circle.fill';
      default: return 'questionmark.circle.fill';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText type="title" style={styles.title}>Aquelis 2.0</ThemedText>
            <ThemedText type="subtitle" style={styles.subtitle}>Water Quality & Health Monitor</ThemedText>
            {user && (
              <ThemedText style={styles.welcomeText}>Welcome, {user.name}!</ThemedText>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => setShowNotifications(true)}
            >
              <IconSymbol name="bell.fill" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ThemedView>

      {/* Water Quality Status Card */}
      <ThemedView style={[styles.card, { borderLeftColor: getStatusColor(waterQuality.status) }]}>
        <View style={styles.cardHeader}>
          <IconSymbol 
            name={getStatusIcon(waterQuality.status)} 
            size={32} 
            color={getStatusColor(waterQuality.status)} 
          />
          <View style={styles.cardHeaderText}>
            <ThemedText type="defaultSemiBold" style={{ color: '#333' }}>Water Quality Status</ThemedText>
            <ThemedText style={[styles.statusText, { color: getStatusColor(waterQuality.status) }]}>
              {waterQuality.status.toUpperCase()}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.metricsContainer}>
          <View style={styles.metric}>
            <ThemedText type="defaultSemiBold" style={{ color: '#333' }}>pH Level</ThemedText>
            <ThemedText style={styles.metricValue}>{waterQuality.ph}</ThemedText>
          </View>
          <View style={styles.metric}>
            <ThemedText type="defaultSemiBold" style={{ color: '#333' }}>Turbidity</ThemedText>
            <ThemedText style={styles.metricValue}>{waterQuality.turbidity} NTU</ThemedText>
          </View>
          <View style={styles.metric}>
            <ThemedText type="defaultSemiBold" style={{ color: '#333' }}>Temperature</ThemedText>
            <ThemedText style={styles.metricValue}>{waterQuality.temperature}°C</ThemedText>
          </View>
        </View>
        
        <ThemedText style={styles.lastUpdated}>
          Last updated: {waterQuality.lastUpdated}
        </ThemedText>
      </ThemedView>

      {/* User Stats Card */}
      <ThemedView style={styles.card}>
        <View style={styles.cardHeader}>
          <IconSymbol name="star.fill" size={32} color="#FFD700" />
          <View style={styles.cardHeaderText}>
            <ThemedText type="defaultSemiBold" style={{ color: '#333' }}>Your Progress</ThemedText>
            <ThemedText style={styles.levelText}>Level {userStats.level}</ThemedText>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{userStats.points}</ThemedText>
            <ThemedText style={styles.statLabel}>Points</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{userStats.reportsSubmitted}</ThemedText>
            <ThemedText style={styles.statLabel}>Reports</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{userStats.streak}</ThemedText>
            <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: '#333' }]}>Quick Actions</ThemedText>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('sensors')}
          >
            <IconSymbol name="sensor.fill" size={24} color="#2196F3" />
            <ThemedText style={styles.actionText}>Check Sensors</ThemedText>
            <ThemedText style={styles.actionSubtext}>+10 points</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('health')}
          >
            <IconSymbol name="heart.fill" size={24} color="#E91E63" />
            <ThemedText style={styles.actionText}>Health Check</ThemedText>
            <ThemedText style={styles.actionSubtext}>+15 points</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('report')}
          >
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FF5722" />
            <ThemedText style={styles.actionText}>Report Issue</ThemedText>
            <ThemedText style={styles.actionSubtext}>+25 points</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleQuickAction('map')}
          >
            <IconSymbol name="map.fill" size={24} color="#4CAF50" />
            <ThemedText style={styles.actionText}>View Map</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Health Tips */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={[styles.sectionTitle, { color: '#333' }]}>Daily Health Tip</ThemedText>
        <View style={styles.tipContainer}>
          <IconSymbol name="lightbulb.fill" size={24} color="#FFC107" />
          <ThemedText style={styles.tipText}>
            Boil water for at least 1 minute to kill harmful bacteria and viruses. 
            This is especially important when water quality is uncertain.
          </ThemedText>
        </View>
      </ThemedView>

      {/* Notification System */}
      <NotificationSystem
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#2196F3',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  welcomeText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  levelText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
  actionSubtext: {
    fontSize: 10,
    textAlign: 'center',
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: '500',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
    color: '#333',
  },
});
