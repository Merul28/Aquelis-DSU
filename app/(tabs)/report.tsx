import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addRewardNotification, addAlertNotification } from '@/components/notification-system';

interface WaterReport {
  id: string;
  type: 'contamination' | 'shortage' | 'infrastructure' | 'quality' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  photos: string[];
  timestamp: Date;
  status: 'pending' | 'verified' | 'resolved' | 'rejected';
  reporterPoints: number;
  upvotes: number;
  downvotes: number;
}

interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  examples: string[];
}

const REPORT_CATEGORIES: ReportCategory[] = [
  {
    id: 'contamination',
    name: 'Water Contamination',
    description: 'Report contaminated or polluted water sources',
    icon: 'drop.triangle.fill',
    color: '#F44336',
    examples: ['Dirty water', 'Chemical smell', 'Oil spills', 'Sewage contamination']
  },
  {
    id: 'shortage',
    name: 'Water Shortage',
    description: 'Report areas with insufficient water supply',
    icon: 'drop.degreesign.slash',
    color: '#FF9800',
    examples: ['No water supply', 'Low pressure', 'Intermittent supply', 'Dry wells']
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure Issues',
    description: 'Report broken pipes, leaks, or damaged facilities',
    icon: 'wrench.and.screwdriver.fill',
    color: '#2196F3',
    examples: ['Broken pipes', 'Water leaks', 'Damaged pumps', 'Faulty meters']
  },
  {
    id: 'quality',
    name: 'Water Quality',
    description: 'Report poor taste, odor, or appearance of water',
    icon: 'nose.fill',
    color: '#9C27B0',
    examples: ['Bad taste', 'Strange odor', 'Cloudy water', 'Unusual color']
  },
  {
    id: 'other',
    name: 'Other Issues',
    description: 'Report other water-related problems',
    icon: 'ellipsis.circle.fill',
    color: '#607D8B',
    examples: ['Billing issues', 'Service complaints', 'General concerns']
  }
];

export default function ReportScreen() {
  const [reports, setReports] = useState<WaterReport[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | null>(null);
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical'
  });
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    loadReports();
    getCurrentLocation();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    setHasPermission(cameraStatus === 'granted' && locationStatus === 'granted');
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadReports = async () => {
    try {
      const savedReports = await AsyncStorage.getItem('waterReports');
      if (savedReports) {
        const parsedReports = JSON.parse(savedReports).map((report: any) => ({
          ...report,
          timestamp: new Date(report.timestamp)
        }));
        setReports(parsedReports);
      } else {
        // Load some sample reports
        const sampleReports: WaterReport[] = [
          {
            id: 'report_001',
            type: 'contamination',
            severity: 'high',
            title: 'Sewage leak near water source',
            description: 'There is a sewage leak contaminating the local water supply. The water has a foul smell and appears dirty.',
            location: {
              latitude: 28.6139,
              longitude: 77.2090,
              address: 'Connaught Place, New Delhi'
            },
            photos: [],
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            status: 'pending',
            reporterPoints: 50,
            upvotes: 12,
            downvotes: 1
          },
          {
            id: 'report_002',
            type: 'shortage',
            severity: 'medium',
            title: 'Water supply disruption',
            description: 'No water supply for the past 3 days in our area. Many families are affected.',
            location: {
              latitude: 28.5355,
              longitude: 77.3910,
              address: 'Noida, Uttar Pradesh'
            },
            photos: [],
            timestamp: new Date(Date.now() - 172800000), // 2 days ago
            status: 'verified',
            reporterPoints: 30,
            upvotes: 8,
            downvotes: 0
          }
        ];
        setReports(sampleReports);
        await AsyncStorage.setItem('waterReports', JSON.stringify(sampleReports));
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const saveReports = async (updatedReports: WaterReport[]) => {
    try {
      await AsyncStorage.setItem('waterReports', JSON.stringify(updatedReports));
      setReports(updatedReports);
    } catch (error) {
      console.error('Error saving reports:', error);
    }
  };

  const startReport = (category: ReportCategory) => {
    setSelectedCategory(category);
    setShowReportModal(true);
    setReportForm({ title: '', description: '', severity: 'medium' });
    setPhotos([]);
  };

  const submitReport = async () => {
    if (!selectedCategory || !reportForm.title.trim() || !reportForm.description.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all required fields.');
      return;
    }

    if (!currentLocation) {
      Alert.alert('Location Required', 'Please enable location services to submit a report.');
      return;
    }

    const newReport: WaterReport = {
      id: `report_${Date.now()}`,
      type: selectedCategory.id as any,
      severity: reportForm.severity,
      title: reportForm.title.trim(),
      description: reportForm.description.trim(),
      location: {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        address: 'Current Location'
      },
      photos,
      timestamp: new Date(),
      status: 'pending',
      reporterPoints: calculatePoints(reportForm.severity),
      upvotes: 0,
      downvotes: 0
    };

    const updatedReports = [newReport, ...reports];
    await saveReports(updatedReports);

    // Award points to user
    await awardPoints(newReport.reporterPoints);

    setShowReportModal(false);
    setSelectedCategory(null);
    
    Alert.alert(
      'Report Submitted!',
      `Thank you for reporting this issue. You earned ${newReport.reporterPoints} points! Local authorities will be notified.`,
      [{ text: 'OK' }]
    );
  };

  const calculatePoints = (severity: string) => {
    switch (severity) {
      case 'critical': return 100;
      case 'high': return 75;
      case 'medium': return 50;
      case 'low': return 25;
      default: return 25;
    }
  };

  const awardPoints = async (points: number) => {
    try {
      const currentStats = await AsyncStorage.getItem('userStats');
      const stats = currentStats ? JSON.parse(currentStats) : { points: 0, reportsSubmitted: 0, level: 1, streak: 0 };
      
      stats.points += points;
      stats.reportsSubmitted += 1;
      stats.level = Math.floor(stats.points / 500) + 1;
      
      await AsyncStorage.setItem('userStats', JSON.stringify(stats));
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const voteOnReport = async (reportId: string, voteType: 'up' | 'down') => {
    const updatedReports = reports.map(report => {
      if (report.id === reportId) {
        return {
          ...report,
          upvotes: voteType === 'up' ? report.upvotes + 1 : report.upvotes,
          downvotes: voteType === 'down' ? report.downvotes + 1 : report.downvotes
        };
      }
      return report;
    });
    
    await saveReports(updatedReports);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#D32F2F';
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#4CAF50';
      case 'resolved': return '#2196F3';
      case 'rejected': return '#F44336';
      case 'pending': return '#FF9800';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return 'checkmark.circle.fill';
      case 'resolved': return 'checkmark.seal.fill';
      case 'rejected': return 'xmark.circle.fill';
      case 'pending': return 'clock.fill';
      default: return 'questionmark.circle.fill';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Report Water Issues</ThemedText>
        <ThemedText type="subtitle">Help improve water quality in your community</ThemedText>
      </ThemedView>

      {/* Quick Report Categories */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          What would you like to report?
        </ThemedText>
        
        <View style={styles.categoriesGrid}>
          {REPORT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[styles.categoryButton, { borderColor: category.color }]}
              onPress={() => startReport(category)}
            >
              <IconSymbol name={category.icon as any} size={32} color={category.color} />
              <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
              <ThemedText style={styles.categoryDescription}>{category.description}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>

      {/* Recent Reports */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Recent Community Reports
        </ThemedText>
        
        {reports.slice(0, 5).map((report) => (
          <View key={report.id} style={styles.reportItem}>
            <View style={styles.reportHeader}>
              <View style={styles.reportInfo}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>
                  {report.title}
                </ThemedText>
                <View style={styles.reportMeta}>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(report.severity) }]}>
                    <ThemedText style={styles.severityText}>{report.severity}</ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) }]}>
                    <IconSymbol name={getStatusIcon(report.status) as any} size={12} color="white" />
                    <ThemedText style={styles.statusText}>{report.status}</ThemedText>
                  </View>
                </View>
              </View>
            </View>
            
            <ThemedText style={styles.reportDescription} numberOfLines={2}>
              {report.description}
            </ThemedText>
            
            <View style={styles.reportFooter}>
              <ThemedText style={styles.reportTime}>
                {report.timestamp.toLocaleDateString()} • {report.location.address}
              </ThemedText>
              
              <View style={styles.voteButtons}>
                <TouchableOpacity 
                  style={styles.voteButton}
                  onPress={() => voteOnReport(report.id, 'up')}
                >
                  <IconSymbol name="hand.thumbsup.fill" size={16} color="#4CAF50" />
                  <ThemedText style={styles.voteCount}>{report.upvotes}</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.voteButton}
                  onPress={() => voteOnReport(report.id, 'down')}
                >
                  <IconSymbol name="hand.thumbsdown.fill" size={16} color="#F44336" />
                  <ThemedText style={styles.voteCount}>{report.downvotes}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        
        {reports.length === 0 && (
          <View style={styles.noReportsContainer}>
            <IconSymbol name="exclamationmark.triangle" size={48} color="#ccc" />
            <ThemedText style={styles.noReportsText}>No reports yet</ThemedText>
            <ThemedText style={styles.noReportsSubtext}>Be the first to report a water issue in your area</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Report Form Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReportModal(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowReportModal(false)}
            >
              <IconSymbol name="xmark" size={24} color="#666" />
            </TouchableOpacity>
            <ThemedText type="title">Report {selectedCategory?.name}</ThemedText>
          </View>

          <View style={styles.modalContent}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Title *</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Brief description of the issue"
                value={reportForm.title}
                onChangeText={(text) => setReportForm(prev => ({ ...prev, title: text }))}
                maxLength={100}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Description *</ThemedText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Provide detailed information about the water issue..."
                value={reportForm.description}
                onChangeText={(text) => setReportForm(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            {/* Severity Selection */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Severity Level</ThemedText>
              <View style={styles.severityOptions}>
                {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.severityOption,
                      reportForm.severity === level && styles.selectedSeverity,
                      { borderColor: getSeverityColor(level) }
                    ]}
                    onPress={() => setReportForm(prev => ({ ...prev, severity: level }))}
                  >
                    <ThemedText style={[
                      styles.severityOptionText,
                      reportForm.severity === level && { color: 'white' }
                    ]}>
                      {level.toUpperCase()}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location Info */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Location</ThemedText>
              <View style={styles.locationInfo}>
                <IconSymbol name="location.fill" size={20} color="#2196F3" />
                <ThemedText style={styles.locationText}>
                  {currentLocation ? 'Current location will be used' : 'Getting location...'}
                </ThemedText>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton} onPress={submitReport}>
              <IconSymbol name="paperplane.fill" size={20} color="white" />
              <ThemedText style={styles.submitButtonText}>Submit Report</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
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
    alignItems: 'center',
    backgroundColor: '#FF5722',
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    color: '#333',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  reportItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportInfo: {
    flex: 1,
  },
  reportMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  severityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  reportDescription: {
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTime: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteCount: {
    fontSize: 12,
    color: '#666',
  },
  noReportsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noReportsText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16,
  },
  noReportsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
    marginRight: 16,
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  severityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  severityOption: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  selectedSeverity: {
    backgroundColor: '#FF5722',
  },
  severityOptionText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    gap: 8,
  },
  locationText: {
    color: '#2196F3',
    fontSize: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5722',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});