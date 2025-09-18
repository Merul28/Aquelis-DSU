import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { UserActions } from '@/lib/userActions';

export const TestDatabaseActions: React.FC = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();

  const handleTestAction = async (action: string) => {
    if (!user) {
      Alert.alert('Error', 'Please login first');
      return;
    }

    try {
      switch (action) {
        case 'addPoints':
          await UserActions.connectSensor(user.$id);
          break;
        case 'submitReport':
          await UserActions.submitReport(user.$id);
          break;
        case 'healthCheck':
          await UserActions.completeHealthCheck(user.$id);
          break;
        case 'updateStreak':
          await UserActions.updateDailyStreak(user.$id);
          break;
      }
      
      // Refresh user profile to see updated data
      await refreshUserProfile();
      
      Alert.alert('Success', 'Action completed! Check your stats.');
    } catch (error) {
      console.error('Test action error:', error);
      Alert.alert('Error', 'Action failed. Make sure database is set up correctly.');
    }
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Please login to test database actions</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.title}>
        Test Database Actions
      </ThemedText>
      
      <View style={styles.statsContainer}>
        <ThemedText>Points: {userProfile?.points || 0}</ThemedText>
        <ThemedText>Level: {userProfile?.level || 1}</ThemedText>
        <ThemedText>Reports: {userProfile?.reportsSubmitted || 0}</ThemedText>
        <ThemedText>Streak: {userProfile?.streak || 0}</ThemedText>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => handleTestAction('addPoints')}
        >
          <IconSymbol name="plus.circle.fill" size={20} color="#4CAF50" />
          <ThemedText style={styles.buttonText}>Add 10 Points</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => handleTestAction('submitReport')}
        >
          <IconSymbol name="flag.fill" size={20} color="#2196F3" />
          <ThemedText style={styles.buttonText}>Submit Report (+25pts)</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => handleTestAction('healthCheck')}
        >
          <IconSymbol name="heart.fill" size={20} color="#E91E63" />
          <ThemedText style={styles.buttonText}>Health Check (+15pts)</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => handleTestAction('updateStreak')}
        >
          <IconSymbol name="flame.fill" size={20} color="#FF5722" />
          <ThemedText style={styles.buttonText}>Update Streak</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonsContainer: {
    gap: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    color: '#333',
  },
});