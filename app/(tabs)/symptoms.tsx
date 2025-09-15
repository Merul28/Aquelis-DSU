import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Symptom {
  id: string;
  name: string;
  category: 'gastrointestinal' | 'respiratory' | 'skin' | 'neurological' | 'general';
  severity: 'mild' | 'moderate' | 'severe';
  icon: string;
}

interface Disease {
  id: string;
  name: string;
  description: string;
  symptoms: string[];
  causes: string[];
  precautions: string[];
  treatment: string[];
  severity: 'low' | 'medium' | 'high';
  contagious: boolean;
}

interface HealthAssessment {
  selectedSymptoms: string[];
  possibleDiseases: Disease[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  timestamp: Date;
}

const WATER_BORNE_DISEASES: Disease[] = [
  {
    id: 'cholera',
    name: 'Cholera',
    description: 'An acute diarrheal infection caused by ingesting food or water contaminated with the bacterium Vibrio cholerae.',
    symptoms: ['severe_diarrhea', 'vomiting', 'dehydration', 'muscle_cramps', 'rapid_heartbeat'],
    causes: ['contaminated_water', 'poor_sanitation', 'infected_food'],
    precautions: [
      'Drink only boiled or bottled water',
      'Eat hot, freshly cooked food',
      'Avoid raw vegetables and fruits',
      'Practice good hand hygiene',
      'Use proper sanitation facilities'
    ],
    treatment: [
      'Immediate rehydration with ORS',
      'Seek medical attention immediately',
      'Antibiotics if prescribed by doctor',
      'Maintain fluid balance'
    ],
    severity: 'high',
    contagious: true
  },
  {
    id: 'typhoid',
    name: 'Typhoid Fever',
    description: 'A bacterial infection caused by Salmonella typhi, spread through contaminated food and water.',
    symptoms: ['high_fever', 'headache', 'stomach_pain', 'weakness', 'loss_appetite', 'rash'],
    causes: ['contaminated_water', 'poor_hygiene', 'infected_food'],
    precautions: [
      'Get vaccinated if traveling to high-risk areas',
      'Drink safe water only',
      'Eat properly cooked food',
      'Wash hands frequently',
      'Avoid street food'
    ],
    treatment: [
      'Antibiotic treatment as prescribed',
      'Rest and adequate fluid intake',
      'Paracetamol for fever',
      'Medical supervision required'
    ],
    severity: 'high',
    contagious: true
  },
  {
    id: 'hepatitis_a',
    name: 'Hepatitis A',
    description: 'A viral liver infection spread through contaminated food and water.',
    symptoms: ['fatigue', 'nausea', 'stomach_pain', 'loss_appetite', 'jaundice', 'dark_urine'],
    causes: ['contaminated_water', 'poor_sanitation', 'infected_food'],
    precautions: [
      'Get hepatitis A vaccine',
      'Practice good hygiene',
      'Drink safe water',
      'Avoid raw or undercooked food',
      'Wash hands regularly'
    ],
    treatment: [
      'Rest and supportive care',
      'Avoid alcohol and certain medications',
      'Maintain good nutrition',
      'Monitor liver function'
    ],
    severity: 'medium',
    contagious: true
  },
  {
    id: 'diarrhea',
    name: 'Acute Diarrhea',
    description: 'Loose, watery stools often caused by contaminated water or food.',
    symptoms: ['loose_stools', 'stomach_cramps', 'nausea', 'dehydration', 'fever'],
    causes: ['contaminated_water', 'bacterial_infection', 'viral_infection', 'parasites'],
    precautions: [
      'Drink clean, safe water',
      'Practice good hand hygiene',
      'Eat freshly cooked food',
      'Avoid raw foods',
      'Use proper sanitation'
    ],
    treatment: [
      'Stay hydrated with ORS',
      'Rest and bland diet',
      'Avoid dairy and fatty foods',
      'Seek medical help if severe'
    ],
    severity: 'low',
    contagious: false
  },
  {
    id: 'giardiasis',
    name: 'Giardiasis',
    description: 'A parasitic infection of the small intestine caused by Giardia lamblia.',
    symptoms: ['diarrhea', 'gas', 'stomach_cramps', 'nausea', 'dehydration'],
    causes: ['contaminated_water', 'poor_sanitation', 'infected_person'],
    precautions: [
      'Drink treated or boiled water',
      'Practice good hygiene',
      'Avoid swallowing water while swimming',
      'Wash hands frequently'
    ],
    treatment: [
      'Antiparasitic medication',
      'Stay hydrated',
      'Follow prescribed treatment course',
      'Monitor symptoms'
    ],
    severity: 'medium',
    contagious: true
  }
];

const SYMPTOMS_LIST: Symptom[] = [
  { id: 'severe_diarrhea', name: 'Severe Diarrhea', category: 'gastrointestinal', severity: 'severe', icon: 'exclamationmark.triangle.fill' },
  { id: 'vomiting', name: 'Vomiting', category: 'gastrointestinal', severity: 'moderate', icon: 'xmark.circle.fill' },
  { id: 'nausea', name: 'Nausea', category: 'gastrointestinal', severity: 'mild', icon: 'minus.circle.fill' },
  { id: 'stomach_pain', name: 'Stomach Pain', category: 'gastrointestinal', severity: 'moderate', icon: 'exclamationmark.circle.fill' },
  { id: 'stomach_cramps', name: 'Stomach Cramps', category: 'gastrointestinal', severity: 'moderate', icon: 'exclamationmark.circle.fill' },
  { id: 'high_fever', name: 'High Fever (>38.5°C)', category: 'general', severity: 'severe', icon: 'thermometer.medium' },
  { id: 'fever', name: 'Fever', category: 'general', severity: 'moderate', icon: 'thermometer.medium' },
  { id: 'headache', name: 'Headache', category: 'neurological', severity: 'mild', icon: 'brain.head.profile' },
  { id: 'fatigue', name: 'Fatigue', category: 'general', severity: 'mild', icon: 'battery.25percent' },
  { id: 'weakness', name: 'Weakness', category: 'general', severity: 'moderate', icon: 'battery.0percent' },
  { id: 'dehydration', name: 'Dehydration', category: 'general', severity: 'severe', icon: 'drop.fill' },
  { id: 'muscle_cramps', name: 'Muscle Cramps', category: 'general', severity: 'moderate', icon: 'figure.walk' },
  { id: 'rapid_heartbeat', name: 'Rapid Heartbeat', category: 'general', severity: 'severe', icon: 'heart.fill' },
  { id: 'loss_appetite', name: 'Loss of Appetite', category: 'general', severity: 'mild', icon: 'minus.circle' },
  { id: 'jaundice', name: 'Jaundice (Yellow skin/eyes)', category: 'general', severity: 'severe', icon: 'eye.fill' },
  { id: 'dark_urine', name: 'Dark Urine', category: 'general', severity: 'moderate', icon: 'drop.fill' },
  { id: 'loose_stools', name: 'Loose Stools', category: 'gastrointestinal', severity: 'mild', icon: 'exclamationmark.circle' },
  { id: 'gas', name: 'Excessive Gas', category: 'gastrointestinal', severity: 'mild', icon: 'wind' },
  { id: 'rash', name: 'Skin Rash', category: 'skin', severity: 'mild', icon: 'allergens.fill' }
];

export default function SymptomsScreen() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<HealthAssessment | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState<HealthAssessment[]>([]);

  useEffect(() => {
    loadAssessmentHistory();
  }, []);

  const loadAssessmentHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('assessmentHistory');
      if (history) {
        const parsedHistory = JSON.parse(history).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setAssessmentHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading assessment history:', error);
    }
  };

  const saveAssessment = async (newAssessment: HealthAssessment) => {
    try {
      const updatedHistory = [newAssessment, ...assessmentHistory].slice(0, 10); // Keep last 10
      await AsyncStorage.setItem('assessmentHistory', JSON.stringify(updatedHistory));
      setAssessmentHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving assessment:', error);
    }
  };

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId) 
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const analyzeSymptoms = () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('No Symptoms Selected', 'Please select at least one symptom to analyze.');
      return;
    }

    // AI-like analysis logic
    const possibleDiseases = WATER_BORNE_DISEASES.filter(disease => {
      const matchingSymptoms = disease.symptoms.filter(symptom => 
        selectedSymptoms.includes(symptom)
      );
      return matchingSymptoms.length > 0;
    }).map(disease => ({
      ...disease,
      matchScore: disease.symptoms.filter(symptom => 
        selectedSymptoms.includes(symptom)
      ).length / disease.symptoms.length
    })).sort((a, b) => b.matchScore - a.matchScore);

    // Determine risk level
    const severityScores = selectedSymptoms.map(symptomId => {
      const symptom = SYMPTOMS_LIST.find(s => s.id === symptomId);
      return symptom?.severity === 'severe' ? 3 : symptom?.severity === 'moderate' ? 2 : 1;
    });
    
    const avgSeverity = severityScores.reduce((a, b) => a + b, 0) / severityScores.length;
    const riskLevel = avgSeverity >= 2.5 ? 'high' : avgSeverity >= 1.5 ? 'medium' : 'low';

    // Generate recommendations
    const recommendations = generateRecommendations(selectedSymptoms, riskLevel, possibleDiseases);

    const newAssessment: HealthAssessment = {
      selectedSymptoms,
      possibleDiseases: possibleDiseases.slice(0, 3), // Top 3 matches
      riskLevel,
      recommendations,
      timestamp: new Date()
    };

    setAssessment(newAssessment);
    setShowResults(true);
    saveAssessment(newAssessment);
  };

  const generateRecommendations = (symptoms: string[], risk: string, diseases: any[]) => {
    const recommendations = [];

    if (risk === 'high') {
      recommendations.push('🚨 Seek immediate medical attention');
      recommendations.push('💧 Stay hydrated with ORS or clean water');
      recommendations.push('🏥 Consider visiting emergency room if symptoms worsen');
    } else if (risk === 'medium') {
      recommendations.push('👨‍⚕️ Consult a healthcare provider within 24 hours');
      recommendations.push('💧 Increase fluid intake');
      recommendations.push('🍽️ Eat bland, easily digestible foods');
    } else {
      recommendations.push('👀 Monitor symptoms closely');
      recommendations.push('💧 Stay hydrated');
      recommendations.push('🏠 Rest and avoid strenuous activities');
    }

    if (symptoms.includes('severe_diarrhea') || symptoms.includes('vomiting')) {
      recommendations.push('🧂 Use oral rehydration solution (ORS)');
      recommendations.push('🚫 Avoid dairy and fatty foods');
    }

    if (symptoms.includes('high_fever')) {
      recommendations.push('🌡️ Monitor temperature regularly');
      recommendations.push('💊 Use fever reducers as directed');
    }

    recommendations.push('🧼 Practice good hand hygiene');
    recommendations.push('💧 Drink only safe, treated water');

    return recommendations;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return '#F44336';
      case 'moderate': return '#FF9800';
      case 'mild': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const resetAssessment = () => {
    setSelectedSymptoms([]);
    setAssessment(null);
    setShowResults(false);
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">AI Health Checker</ThemedText>
        <ThemedText type="subtitle">Water-borne disease symptom analysis</ThemedText>
      </ThemedView>

      {!showResults ? (
        <>
          {/* Symptom Selection */}
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Select Your Symptoms
            </ThemedText>
            <ThemedText style={styles.instruction}>
              Tap on the symptoms you are currently experiencing:
            </ThemedText>

            <View style={styles.symptomsGrid}>
              {SYMPTOMS_LIST.map((symptom) => (
                <TouchableOpacity
                  key={symptom.id}
                  style={[
                    styles.symptomButton,
                    selectedSymptoms.includes(symptom.id) && styles.selectedSymptom,
                    { borderColor: getSeverityColor(symptom.severity) }
                  ]}
                  onPress={() => toggleSymptom(symptom.id)}
                >
                  <IconSymbol
                    name={symptom.icon as any}
                    size={20}
                    color={selectedSymptoms.includes(symptom.id) ? 'white' : getSeverityColor(symptom.severity)}
                  />
                  <ThemedText style={[
                    styles.symptomText,
                    selectedSymptoms.includes(symptom.id) && styles.selectedSymptomText
                  ]}>
                    {symptom.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.selectedCount}>
              <ThemedText style={styles.countText}>
                {selectedSymptoms.length} symptoms selected
              </ThemedText>
            </View>
          </ThemedView>

          {/* Analyze Button */}
          <ThemedView style={styles.card}>
            <TouchableOpacity 
              style={[styles.analyzeButton, selectedSymptoms.length === 0 && styles.disabledButton]}
              onPress={analyzeSymptoms}
              disabled={selectedSymptoms.length === 0}
            >
              <IconSymbol name="brain.head.profile" size={24} color="white" />
              <ThemedText style={styles.analyzeButtonText}>Analyze Symptoms</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </>
      ) : (
        <>
          {/* Assessment Results */}
          <ThemedView style={[styles.card, { borderLeftColor: getRiskColor(assessment?.riskLevel || 'low') }]}>
            <View style={styles.resultHeader}>
              <IconSymbol
                name="brain.head.profile"
                size={32}
                color={getRiskColor(assessment?.riskLevel || 'low')}
              />
              <View style={styles.resultHeaderText}>
                <ThemedText type="defaultSemiBold">Assessment Complete</ThemedText>
                <ThemedText style={[styles.riskLevel, { color: getRiskColor(assessment?.riskLevel || 'low') }]}>
                  {assessment?.riskLevel.toUpperCase()} RISK
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.disclaimer}>
              ⚠️ This is an AI-based preliminary assessment. Always consult healthcare professionals for proper diagnosis and treatment.
            </ThemedText>
          </ThemedView>

          {/* Possible Conditions */}
          {assessment?.possibleDiseases && assessment.possibleDiseases.length > 0 && (
            <ThemedView style={styles.card}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Possible Conditions
              </ThemedText>
              
              {assessment.possibleDiseases.map((disease, index) => (
                <View key={disease.id} style={styles.diseaseItem}>
                  <View style={styles.diseaseHeader}>
                    <ThemedText type="defaultSemiBold">{disease.name}</ThemedText>
                    <View style={[styles.severityBadge, { backgroundColor: getRiskColor(disease.severity) }]}>
                      <ThemedText style={styles.severityText}>{disease.severity}</ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.diseaseDescription}>{disease.description}</ThemedText>
                </View>
              ))}
            </ThemedView>
          )}

          {/* Recommendations */}
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Recommendations
            </ThemedText>
            
            {assessment?.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <ThemedText style={styles.recommendationText}>{recommendation}</ThemedText>
              </View>
            ))}
          </ThemedView>

          {/* Action Buttons */}
          <ThemedView style={styles.card}>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetAssessment}>
                <IconSymbol name="arrow.counterclockwise" size={20} color="#2196F3" />
                <ThemedText style={styles.secondaryButtonText}>New Assessment</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.primaryButton}>
                <IconSymbol name="phone.fill" size={20} color="white" />
                <ThemedText style={styles.primaryButtonText}>Call Doctor</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </>
      )}

      {/* Assessment History */}
      {assessmentHistory.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Recent Assessments
          </ThemedText>
          
          {assessmentHistory.slice(0, 3).map((hist, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <View style={[styles.riskIndicator, { backgroundColor: getRiskColor(hist.riskLevel) }]} />
                <ThemedText style={styles.historyDate}>
                  {hist.timestamp.toLocaleDateString()} at {hist.timestamp.toLocaleTimeString()}
                </ThemedText>
              </View>
              <ThemedText style={styles.historySymptoms}>
                {hist.selectedSymptoms.length} symptoms • {hist.riskLevel} risk
              </ThemedText>
            </View>
          ))}
        </ThemedView>
      )}
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
    backgroundColor: '#E91E63',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#E91E63',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#333',
  },
  instruction: {
    color: '#757575',
    marginBottom: 16,
    lineHeight: 20,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    minWidth: '48%',
  },
  selectedSymptom: {
    backgroundColor: '#2196F3',
  },
  symptomText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    color: '#333',
  },
  selectedSymptomText: {
    color: 'white',
  },
  selectedCount: {
    alignItems: 'center',
    marginTop: 16,
  },
  countText: {
    color: '#757575',
    fontSize: 14,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    padding: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    color: '#856404',
    fontSize: 14,
    lineHeight: 18,
  },
  diseaseItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  diseaseHeader: {
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
  diseaseDescription: {
    color: '#757575',
    lineHeight: 18,
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    padding: 12,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  secondaryButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  historyItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  riskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  historySymptoms: {
    fontSize: 12,
    color: '#757575',
  },
});