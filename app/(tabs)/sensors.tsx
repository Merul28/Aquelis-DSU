import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SensorsScreen() {
  const dummySensors = [
    { id: 1, name: 'pH Sensor', value: '7.2', unit: 'pH', status: 'normal' },
    { id: 2, name: 'Turbidity Sensor', value: '2.1', unit: 'NTU', status: 'normal' },
    { id: 3, name: 'Temperature Sensor', value: '24.5', unit: '°C', status: 'normal' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Water Quality Sensors</ThemedText>
        <ThemedText style={styles.headerSubtitle}>Real-time monitoring</ThemedText>
      </ThemedView>

      {/* Add Sensor Button */}
      <ThemedView style={styles.card}>
        <TouchableOpacity style={styles.addSensorButton}>
          <IconSymbol name="plus.circle.fill" size={32} color="#2196F3" />
          <ThemedText style={styles.addSensorText}>Add New Sensor</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Connected Sensors */}
      <ThemedView style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Connected Sensors</ThemedText>
        
        {dummySensors.map((sensor) => (
          <View key={sensor.id} style={styles.sensorItem}>
            <View style={styles.sensorInfo}>
              <IconSymbol name="sensor.fill" size={24} color={getStatusColor(sensor.status)} />
              <View style={styles.sensorDetails}>
                <ThemedText style={styles.sensorName}>{sensor.name}</ThemedText>
                <ThemedText style={styles.sensorValue}>
                  {sensor.value} {sensor.unit}
                </ThemedText>
              </View>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(sensor.status) }]} />
            </View>
          </View>
        ))}
      </ThemedView>

      {/* Recent Readings */}
      <ThemedView style={styles.card}>
        <ThemedText style={styles.sectionTitle}>Recent Readings</ThemedText>
        
        <View style={styles.readingItem}>
          <ThemedText style={styles.readingText}>pH: 7.2 (Normal)</ThemedText>
          <ThemedText style={styles.readingTime}>2 minutes ago</ThemedText>
        </View>
        
        <View style={styles.readingItem}>
          <ThemedText style={styles.readingText}>Turbidity: 2.1 NTU (Normal)</ThemedText>
          <ThemedText style={styles.readingTime}>5 minutes ago</ThemedText>
        </View>
        
        <View style={styles.readingItem}>
          <ThemedText style={styles.readingText}>Temperature: 24.5°C (Normal)</ThemedText>
          <ThemedText style={styles.readingTime}>8 minutes ago</ThemedText>
        </View>
      </ThemedView>
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
  headerTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addSensorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  addSensorText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2196F3',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  sensorItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  sensorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sensorDetails: {
    marginLeft: 12,
    flex: 1,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sensorValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  readingText: {
    fontSize: 14,
    color: '#333',
  },
  readingTime: {
    fontSize: 12,
    color: '#666',
  },
});