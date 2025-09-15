import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Alert, TextInput, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProblemArea {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  type: 'contamination' | 'shortage' | 'infrastructure' | 'quality' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportCount: number;
  verifiedCount: number;
  radius: number; // in meters
  isVerified: boolean;
  lastUpdated: Date;
  reports: string[]; // report IDs
}

interface AuthorityVerification {
  areaId: string;
  secretKey: string;
  officialName: string;
  department: string;
  timestamp: Date;
}

const AUTHORITY_SECRET_KEYS = [
  'WATER_DEPT_2024_SECURE',
  'MUNICIPAL_AUTH_KEY_2024',
  'HEALTH_DEPT_VERIFY_2024'
];

export default function MapScreen() {
  const [problemAreas, setProblemAreas] = useState<ProblemArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<ProblemArea | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    secretKey: '',
    officialName: '',
    department: ''
  });
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    getCurrentLocation();
    loadProblemAreas();
    generateProblemAreasFromReports();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your position on the map.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadProblemAreas = async () => {
    try {
      const savedAreas = await AsyncStorage.getItem('problemAreas');
      if (savedAreas) {
        const parsedAreas = JSON.parse(savedAreas).map((area: any) => ({
          ...area,
          lastUpdated: new Date(area.lastUpdated)
        }));
        setProblemAreas(parsedAreas);
      }
    } catch (error) {
      console.error('Error loading problem areas:', error);
    }
  };

  const generateProblemAreasFromReports = async () => {
    try {
      const savedReports = await AsyncStorage.getItem('waterReports');
      if (!savedReports) return;

      const reports = JSON.parse(savedReports);
      const areaMap = new Map<string, ProblemArea>();

      // Group reports by proximity (within 500m)
      reports.forEach((report: any) => {
        const key = `${Math.round(report.location.latitude * 1000)}_${Math.round(report.location.longitude * 1000)}`;
        
        if (areaMap.has(key)) {
          const area = areaMap.get(key)!;
          area.reportCount += 1;
          area.reports.push(report.id);
          if (report.status === 'verified') {
            area.verifiedCount += 1;
          }
          // Increase radius based on report count
          area.radius = Math.min(200 + (area.reportCount * 50), 1000);
        } else {
          const newArea: ProblemArea = {
            id: `area_${key}`,
            latitude: report.location.latitude,
            longitude: report.location.longitude,
            title: `${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Issues`,
            description: `Multiple reports of ${report.type} in this area`,
            type: report.type,
            severity: report.severity,
            reportCount: 1,
            verifiedCount: report.status === 'verified' ? 1 : 0,
            radius: 200,
            isVerified: false,
            lastUpdated: new Date(report.timestamp),
            reports: [report.id]
          };
          areaMap.set(key, newArea);
        }
      });

      const areas = Array.from(areaMap.values());
      setProblemAreas(areas);
      await AsyncStorage.setItem('problemAreas', JSON.stringify(areas));
    } catch (error) {
      console.error('Error generating problem areas:', error);
    }
  };

  const getSeverityColor = (severity: string, isVerified: boolean) => {
    const alpha = isVerified ? 1 : 0.6;
    switch (severity) {
      case 'critical': return `rgba(211, 47, 47, ${alpha})`;
      case 'high': return `rgba(244, 67, 54, ${alpha})`;
      case 'medium': return `rgba(255, 152, 0, ${alpha})`;
      case 'low': return `rgba(76, 175, 80, ${alpha})`;
      default: return `rgba(117, 117, 117, ${alpha})`;
    }
  };

  const openVerificationModal = (area: ProblemArea) => {
    setSelectedArea(area);
    setShowVerificationModal(true);
    setVerificationForm({ secretKey: '', officialName: '', department: '' });
  };

  const verifyArea = async () => {
    if (!selectedArea) return;

    if (!verificationForm.secretKey.trim() || !verificationForm.officialName.trim() || !verificationForm.department.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all fields.');
      return;
    }

    if (!AUTHORITY_SECRET_KEYS.includes(verificationForm.secretKey.trim())) {
      Alert.alert('Invalid Secret Key', 'The provided secret key is not valid. Please contact your system administrator.');
      return;
    }

    // Verify the area
    const updatedAreas = problemAreas.map(area => {
      if (area.id === selectedArea.id) {
        return {
          ...area,
          isVerified: true,
          lastUpdated: new Date()
        };
      }
      return area;
    });

    setProblemAreas(updatedAreas);
    await AsyncStorage.setItem('problemAreas', JSON.stringify(updatedAreas));

    // Save verification record
    const verification: AuthorityVerification = {
      areaId: selectedArea.id,
      secretKey: verificationForm.secretKey,
      officialName: verificationForm.officialName,
      department: verificationForm.department,
      timestamp: new Date()
    };

    const savedVerifications = await AsyncStorage.getItem('verifications');
    const verifications = savedVerifications ? JSON.parse(savedVerifications) : [];
    verifications.push(verification);
    await AsyncStorage.setItem('verifications', JSON.stringify(verifications));

    // Award points to users who reported in this area
    await awardReporterPoints(selectedArea);

    setShowVerificationModal(false);
    setSelectedArea(null);

    Alert.alert(
      'Area Verified!',
      `Thank you ${verificationForm.officialName} from ${verificationForm.department}. This problem area has been officially verified and users who reported issues here have been rewarded.`
    );
  };

  const awardReporterPoints = async (area: ProblemArea) => {
    try {
      // Award bonus points to users who reported in verified areas
      const bonusPoints = 25;
      const currentStats = await AsyncStorage.getItem('userStats');
      const stats = currentStats ? JSON.parse(currentStats) : { points: 0, reportsSubmitted: 0, level: 1, streak: 0 };
      
      // Check if user has reports in this area (simplified - in real app would check user ID)
      stats.points += bonusPoints;
      stats.level = Math.floor(stats.points / 500) + 1;
      
      await AsyncStorage.setItem('userStats', JSON.stringify(stats));
    } catch (error) {
      console.error('Error awarding reporter points:', error);
    }
  };

  const getAreaStatusText = (area: ProblemArea) => {
    if (area.isVerified) {
      return `✅ Verified by authorities (${area.reportCount} reports)`;
    }
    return `⏳ Pending verification (${area.reportCount} reports, ${area.verifiedCount} verified)`;
  };

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Problem Areas Map</ThemedText>
        <ThemedText type="subtitle">Water quality issues in your area</ThemedText>
      </ThemedView>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <IconSymbol name="map" size={64} color="#ccc" />
        <ThemedText style={styles.mapPlaceholderText}>
          Interactive Map View
        </ThemedText>
        <ThemedText style={styles.mapPlaceholderSubtext}>
          {userLocation 
            ? `Your location: ${userLocation.coords.latitude.toFixed(4)}, ${userLocation.coords.longitude.toFixed(4)}`
            : 'Getting your location...'
          }
        </ThemedText>
      </View>

      {/* Problem Areas List */}
      <ScrollView style={styles.problemAreasList}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Reported Problem Areas
        </ThemedText>
        
        {problemAreas.map((area) => (
          <TouchableOpacity
            key={area.id}
            style={[styles.areaItem, { borderLeftColor: getSeverityColor(area.severity, area.isVerified) }]}
            onPress={() => openVerificationModal(area)}
          >
            <View style={styles.areaHeader}>
              <ThemedText type="defaultSemiBold" style={{ color: '#333' }}>{area.title}</ThemedText>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(area.severity, area.isVerified) }]}>
                <ThemedText style={styles.severityText}>{area.severity}</ThemedText>
              </View>
            </View>
            
            <ThemedText style={[styles.areaDescription, { color: '#666' }]}>{area.description}</ThemedText>
            <ThemedText style={styles.areaStatus}>{getAreaStatusText(area)}</ThemedText>
            
            <View style={styles.areaFooter}>
              <ThemedText style={[styles.areaLocation, { color: '#666' }]}>
                📍 {area.latitude.toFixed(4)}, {area.longitude.toFixed(4)}
              </ThemedText>
              <ThemedText style={[styles.areaRadius, { color: '#666' }]}>
                Radius: {area.radius}m
              </ThemedText>
            </View>
          </TouchableOpacity>
        ))}
        
        {problemAreas.length === 0 && (
          <View style={styles.noAreasContainer}>
            <IconSymbol name="checkmark.circle" size={48} color="#4CAF50" />
            <ThemedText style={styles.noAreasText}>No problem areas reported</ThemedText>
            <ThemedText style={styles.noAreasSubtext}>
              Your area appears to be safe! Keep monitoring water quality.
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <ThemedText style={styles.legendTitle}>Severity Levels</ThemedText>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getSeverityColor('critical', true) }]} />
            <ThemedText style={styles.legendText}>Critical</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getSeverityColor('high', true) }]} />
            <ThemedText style={styles.legendText}>High</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getSeverityColor('medium', true) }]} />
            <ThemedText style={styles.legendText}>Medium</ThemedText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getSeverityColor('low', true) }]} />
            <ThemedText style={styles.legendText}>Low</ThemedText>
          </View>
        </View>
      </View>

      {/* Authority Verification Modal */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowVerificationModal(false)}
            >
              <IconSymbol name="xmark" size={24} color="#666" />
            </TouchableOpacity>
            <ThemedText type="title">Authority Verification</ThemedText>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.warningBox}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FF9800" />
              <ThemedText style={styles.warningText}>
                This verification is for authorized local authorities only. 
                Unauthorized use may result in legal action.
              </ThemedText>
            </View>

            {selectedArea && (
              <View style={styles.areaInfo}>
                <ThemedText style={styles.areaInfoTitle}>Area Details:</ThemedText>
                <ThemedText style={{ color: '#333' }}>• {selectedArea.title}</ThemedText>
                <ThemedText style={{ color: '#333' }}>• {selectedArea.reportCount} reports received</ThemedText>
                <ThemedText style={{ color: '#333' }}>• {selectedArea.verifiedCount} reports already verified</ThemedText>
                <ThemedText style={{ color: '#333' }}>• Severity: {selectedArea.severity.toUpperCase()}</ThemedText>
                <ThemedText style={{ color: '#333' }}>• Location: {selectedArea.latitude.toFixed(4)}, {selectedArea.longitude.toFixed(4)}</ThemedText>
              </View>
            )}

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Secret Key *</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Enter authority secret key"
                value={verificationForm.secretKey}
                onChangeText={(text) => setVerificationForm(prev => ({ ...prev, secretKey: text }))}
                secureTextEntry
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Official Name *</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="Your full name"
                value={verificationForm.officialName}
                onChangeText={(text) => setVerificationForm(prev => ({ ...prev, officialName: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Department *</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Water Department, Municipal Corporation"
                value={verificationForm.department}
                onChangeText={(text) => setVerificationForm(prev => ({ ...prev, department: text }))}
              />
            </View>

            <TouchableOpacity style={styles.verifyButton} onPress={verifyArea}>
              <IconSymbol name="checkmark.seal.fill" size={20} color="white" />
              <ThemedText style={styles.verifyButtonText}>Verify Problem Area</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
    backgroundColor: '#4CAF50',
    marginBottom: 0,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  problemAreasList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  areaItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  areaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  areaDescription: {
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  areaStatus: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  areaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  areaLocation: {
    fontSize: 12,
    color: '#666',
  },
  areaRadius: {
    fontSize: 12,
    color: '#666',
  },
  noAreasContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noAreasText: {
    fontSize: 18,
    color: '#4CAF50',
    marginTop: 16,
    fontWeight: 'bold',
  },
  noAreasSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  legend: {
    backgroundColor: 'white',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#333',
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: '#856404',
    fontSize: 14,
    lineHeight: 18,
  },
  areaInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  areaInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
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
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});