import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

// OpenAI Configuration - Using environment variable
const OPENAI_API_KEY = process.env.PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface Symptom {
  id: string;
  name: string;
  category: 'gastrointestinal' | 'respiratory' | 'skin' | 'neurological' | 'general';
  severity: 'mild' | 'moderate' | 'severe';
  icon: string;
}

interface AIHealthAssessment {
  possibleConditions: Array<{
    name: string;
    probability: number;
    description: string;
    severity: string;
    commonDuration?: string;
    waterSource?: string;
  }>;
  riskLevel: 'low' | 'medium' | 'high';
  homeRemedies: string[];
  whenToSeekHelp: string[];
  generalAdvice: string[];
  preventionTips?: string[];
  disclaimer: string;
}

interface SymptomQuestionnaire {
  duration: string;
  severity: string;
  waterExposure: string;
  recentTravel: string;
  additionalInfo: string;
}

interface HealthAssessment {
  selectedSymptoms: string[];
  questionnaire: SymptomQuestionnaire;
  aiAssessment: AIHealthAssessment | null;
  timestamp: Date;
}

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
  { id: 'rash', name: 'Skin Rash', category: 'skin', severity: 'mild', icon: 'allergens.fill' },
  { id: 'joint_pain', name: 'Joint Pain', category: 'general', severity: 'moderate', icon: 'figure.walk' },
  { id: 'chills', name: 'Chills', category: 'general', severity: 'moderate', icon: 'snowflake' },
  { id: 'dizziness', name: 'Dizziness', category: 'neurological', severity: 'moderate', icon: 'brain.head.profile' },
  { id: 'constipation', name: 'Constipation', category: 'gastrointestinal', severity: 'mild', icon: 'exclamationmark.circle' },
  { id: 'bloating', name: 'Bloating', category: 'gastrointestinal', severity: 'mild', icon: 'circle.fill' }
];

export default function AIHealthCheckerScreen() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<SymptomQuestionnaire>({
    duration: '',
    severity: '',
    waterExposure: '',
    recentTravel: '',
    additionalInfo: ''
  });
  const [assessment, setAssessment] = useState<HealthAssessment | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState<HealthAssessment[]>([]);

  useEffect(() => {
    loadAssessmentHistory();
  }, []);

  const loadAssessmentHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('aiAssessmentHistory');
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
      const updatedHistory = [newAssessment, ...assessmentHistory].slice(0, 10);
      await AsyncStorage.setItem('aiAssessmentHistory', JSON.stringify(updatedHistory));
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

  const callOpenAI = async (symptoms: string[], questionnaireData: SymptomQuestionnaire): Promise<AIHealthAssessment> => {
    // Check if API key is available
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key-here') {
      throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
    }

    const symptomNames = symptoms.map(id =>
      SYMPTOMS_LIST.find(s => s.id === id)?.name || id
    );

    const prompt = `You are a specialized medical AI assistant with expertise in water-borne diseases, waterborne pathogens, and water-related health issues.

PATIENT INFORMATION:
- Symptoms: ${symptomNames.join(', ')}
- Duration: ${questionnaireData.duration}
- Severity Level: ${questionnaireData.severity}
- Recent Water Exposure: ${questionnaireData.waterExposure}
- Recent Travel: ${questionnaireData.recentTravel}
- Additional Information: ${questionnaireData.additionalInfo}

CRITICAL FOCUS AREAS:
- Water-borne diseases (Cholera, Typhoid, Hepatitis A/E, Giardiasis, Cryptosporidiosis, Amoebiasis)
- Water contamination-related illnesses (E. coli, Salmonella, Shigella, Campylobacter)
- Dehydration and electrolyte imbalances
- Gastrointestinal infections from contaminated water sources
- Vector-borne diseases related to stagnant water (Dengue, Malaria considerations)

Please provide a comprehensive health assessment in the following JSON format:

{
  "possibleConditions": [
    {
      "name": "Specific Water-borne Disease Name",
      "probability": 85,
      "description": "Detailed description focusing on water contamination source and transmission",
      "severity": "low/medium/high",
      "commonDuration": "typical duration of illness",
      "waterSource": "likely contaminated water source (drinking water, recreational water, etc.)"
    }
  ],
  "riskLevel": "low/medium/high",
  "homeRemedies": [
    "💧 Oral Rehydration Solution (ORS): Mix 1 tsp salt + 2 tbsp sugar in 1 liter clean boiled water",
    "🔥 Boil all drinking water for at least 1 minute before consumption",
    "🍵 Ginger tea or chamomile tea to soothe stomach and reduce nausea",
    "🍌 BRAT diet: Bananas, Rice, Applesauce, Toast for easy digestion",
    "🧂 Electrolyte replacement: Add pinch of salt to clean water or coconut water",
    "🌿 Probiotics from yogurt (if tolerated) to restore gut bacteria"
  ],
  "whenToSeekHelp": [
    "🚨 IMMEDIATE: Signs of severe dehydration (dizziness, dry mouth, no urination for 8+ hours)",
    "⚠️ URGENT: High fever above 39°C (102°F) lasting more than 24 hours",
    "🩸 URGENT: Blood or mucus in stool or vomit",
    "⏰ If symptoms persist or worsen after 48-72 hours of home treatment",
    "🤒 Severe abdominal pain or signs of appendicitis",
    "👶 Special concern for children, elderly, or immunocompromised individuals"
  ],
  "generalAdvice": [
    "🚰 Water Safety: Only drink boiled, bottled, or properly treated water",
    "🧼 Hand Hygiene: Wash hands frequently with soap for 20+ seconds",
    "🍎 Food Safety: Avoid raw foods, street food, and unpeeled fruits",
    "🏠 Rest and avoid strenuous activities to conserve energy for recovery",
    "📊 Monitor symptoms: Keep track of frequency of bowel movements and fluid intake",
    "🌡️ Temperature monitoring: Check fever regularly and record patterns"
  ],
  "preventionTips": [
    "💧 Water purification: Use water purification tablets or UV sterilization",
    "🧊 Avoid ice cubes from unknown water sources",
    "🥗 Eat only thoroughly cooked hot foods",
    "🏊 Avoid swimming in potentially contaminated water bodies"
  ],
  "disclaimer": "This AI assessment focuses on water-related health issues and is for informational purposes only. It cannot replace professional medical diagnosis. Seek immediate medical attention for severe symptoms or if you suspect serious water-borne illness."
}

ASSESSMENT GUIDELINES:
1. Prioritize water-borne and water-contamination related conditions
2. Include probability percentages (0-100) with higher accuracy for water-related diseases
3. Never provide definitive diagnosis - use "may indicate", "could suggest", "possible"
4. Emphasize immediate hydration and water safety measures
5. Include specific home remedies for water-borne illness recovery
6. Provide clear warning signs requiring immediate medical attention
7. Focus on prevention of further water contamination exposure
8. Consider incubation periods and typical progression of water-borne diseases
9. Maximum 4 conditions, prioritized by probability and water-relation
10. Include practical advice for water purification and food safety

Respond only with the JSON object, no additional text.`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful medical AI assistant. Provide health assessments in the exact JSON format requested. Always be responsible and emphasize the need for professional medical consultation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Parse the JSON response
      const assessment = JSON.parse(aiResponse);
      return assessment;

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Enhanced fallback assessment focused on water-borne diseases
      return {
        possibleConditions: [
          {
            name: 'Water-borne Gastrointestinal Infection',
            probability: 75,
            description: 'Possible infection from contaminated water or food, commonly caused by bacteria, viruses, or parasites found in unsafe water sources.',
            severity: 'medium',
            commonDuration: '3-7 days with proper treatment',
            waterSource: 'Contaminated drinking water, recreational water, or food prepared with unsafe water'
          },
          {
            name: 'Acute Gastroenteritis',
            probability: 60,
            description: 'Inflammation of stomach and intestines, often caused by waterborne pathogens like E. coli, Salmonella, or Norovirus.',
            severity: 'medium',
            commonDuration: '2-5 days',
            waterSource: 'Contaminated water supply or cross-contamination'
          }
        ],
        riskLevel: 'medium' as const,
        homeRemedies: [
          '💧 Oral Rehydration Solution (ORS): Mix 1 tsp salt + 2 tbsp sugar in 1 liter boiled water',
          '🔥 Boil all drinking water for at least 1 minute before consumption',
          '🍵 Ginger tea or chamomile tea to soothe stomach and reduce nausea',
          '🍌 BRAT diet: Bananas, Rice, Applesauce, Toast for easy digestion',
          '🧂 Electrolyte replacement: Coconut water or homemade electrolyte solution',
          '🌿 Probiotics from plain yogurt (if tolerated) to restore gut bacteria'
        ],
        whenToSeekHelp: [
          '🚨 IMMEDIATE: Signs of severe dehydration (dizziness, dry mouth, no urination for 8+ hours)',
          '⚠️ URGENT: High fever above 39°C (102°F) lasting more than 24 hours',
          '🩸 URGENT: Blood or mucus in stool or vomit',
          '⏰ If symptoms persist or worsen after 48-72 hours of home treatment',
          '🤒 Severe abdominal pain or signs of complications'
        ],
        generalAdvice: [
          '🚰 Water Safety: Only drink boiled, bottled, or properly treated water',
          '🧼 Hand Hygiene: Wash hands frequently with soap for 20+ seconds',
          '🍎 Food Safety: Avoid raw foods, street food, and unpeeled fruits',
          '🏠 Rest and avoid strenuous activities to conserve energy',
          '📊 Monitor symptoms: Track bowel movements and fluid intake',
          '🌡️ Temperature monitoring: Check fever regularly'
        ],
        preventionTips: [
          '💧 Water purification: Use water purification tablets or boiling',
          '🧊 Avoid ice cubes from unknown water sources',
          '🥗 Eat only thoroughly cooked hot foods',
          '🏊 Avoid swimming in potentially contaminated water bodies'
        ],
        disclaimer: 'This AI assessment focuses on water-related health issues and is for informational purposes only. It cannot replace professional medical diagnosis. Seek immediate medical attention for severe symptoms or if you suspect serious water-borne illness.'
      };
    }
  };

  const proceedToQuestionnaire = () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert('No Symptoms Selected', 'Please select at least one symptom to analyze.');
      return;
    }
    setShowQuestionnaire(true);
  };

  const analyzeSymptoms = async () => {
    if (!questionnaire.duration || !questionnaire.severity) {
      Alert.alert('Incomplete Information', 'Please fill in at least the duration and severity of your symptoms.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const aiAssessment = await callOpenAI(selectedSymptoms, questionnaire);
      
      const newAssessment: HealthAssessment = {
        selectedSymptoms,
        questionnaire,
        aiAssessment,
        timestamp: new Date()
      };

      setAssessment(newAssessment);
      setShowQuestionnaire(false);
      setShowResults(true);
      saveAssessment(newAssessment);
    } catch (error) {
      Alert.alert('Analysis Error', 'Failed to analyze symptoms. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': 
      case 'high': return '#F44336';
      case 'moderate': 
      case 'medium': return '#FF9800';
      case 'mild': 
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const resetAssessment = () => {
    setSelectedSymptoms([]);
    setQuestionnaire({
      duration: '',
      severity: '',
      waterExposure: '',
      recentTravel: '',
      additionalInfo: ''
    });
    setShowQuestionnaire(false);
    setAssessment(null);
    setShowResults(false);
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return '#F44336';
    if (probability >= 40) return '#FF9800';
    return '#4CAF50';
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <IconSymbol name="brain.head.profile" size={32} color="white" />
        <ThemedText type="title" style={styles.headerTitle}>AI Health Assistant</ThemedText>
        <ThemedText type="subtitle" style={styles.headerSubtitle}>
          Intelligent symptom analysis with home care guidance
        </ThemedText>
      </ThemedView>

      {!showResults && !showQuestionnaire ? (
        <>
          {/* Symptom Selection */}
          <ThemedView style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="checklist" size={24} color="#E91E63" />
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Select Your Symptoms
              </ThemedText>
            </View>
            <ThemedText style={styles.instruction}>
              Choose all symptoms you're currently experiencing. The AI will analyze patterns and provide personalized guidance.
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
              onPress={proceedToQuestionnaire}
              disabled={selectedSymptoms.length === 0}
            >
              <IconSymbol name="arrow.right.circle.fill" size={24} color="white" />
              <ThemedText style={styles.analyzeButtonText}>
                Continue to Health Questions
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </>
      ) : showQuestionnaire ? (
        <>
          {/* Health Questionnaire */}
          <ThemedView style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol name="questionmark.circle.fill" size={24} color="#E91E63" />
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                Health Information
              </ThemedText>
            </View>
            <ThemedText style={styles.instruction}>
              Please provide additional information to help our AI give you more accurate analysis.
            </ThemedText>

            {/* Duration */}
            <View style={styles.questionContainer}>
              <ThemedText style={styles.questionLabel}>How long have you been experiencing these symptoms?</ThemedText>
              <View style={styles.optionsContainer}>
                {['Less than 24 hours', '1-3 days', '4-7 days', 'More than a week', 'More than a month'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionButton, questionnaire.duration === option && styles.selectedOption]}
                    onPress={() => setQuestionnaire(prev => ({ ...prev, duration: option }))}
                  >
                    <ThemedText style={[styles.optionText, questionnaire.duration === option && styles.selectedOptionText]}>
                      {option}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Severity */}
            <View style={styles.questionContainer}>
              <ThemedText style={styles.questionLabel}>How would you rate the severity of your symptoms?</ThemedText>
              <View style={styles.optionsContainer}>
                {['Mild (manageable)', 'Moderate (concerning)', 'Severe (very uncomfortable)', 'Critical (unbearable)'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionButton, questionnaire.severity === option && styles.selectedOption]}
                    onPress={() => setQuestionnaire(prev => ({ ...prev, severity: option }))}
                  >
                    <ThemedText style={[styles.optionText, questionnaire.severity === option && styles.selectedOptionText]}>
                      {option}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Water Exposure */}
            <View style={styles.questionContainer}>
              <ThemedText style={styles.questionLabel}>Have you recently consumed water from any of these sources?</ThemedText>
              <View style={styles.optionsContainer}>
                {['Tap water', 'Well water', 'Bottled water', 'River/lake water', 'Street vendor water', 'No unusual water consumption'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionButton, questionnaire.waterExposure === option && styles.selectedOption]}
                    onPress={() => setQuestionnaire(prev => ({ ...prev, waterExposure: option }))}
                  >
                    <ThemedText style={[styles.optionText, questionnaire.waterExposure === option && styles.selectedOptionText]}>
                      {option}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Travel */}
            <View style={styles.questionContainer}>
              <ThemedText style={styles.questionLabel}>Have you traveled recently or eaten outside food?</ThemedText>
              <View style={styles.optionsContainer}>
                {['No recent travel or outside food', 'Traveled within country', 'International travel', 'Ate street food', 'Ate at restaurants', 'Attended events/gatherings'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionButton, questionnaire.recentTravel === option && styles.selectedOption]}
                    onPress={() => setQuestionnaire(prev => ({ ...prev, recentTravel: option }))}
                  >
                    <ThemedText style={[styles.optionText, questionnaire.recentTravel === option && styles.selectedOptionText]}>
                      {option}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.questionnaireButtons}>
              <TouchableOpacity style={styles.backButton} onPress={() => setShowQuestionnaire(false)}>
                <IconSymbol name="arrow.left" size={20} color="#2196F3" />
                <ThemedText style={styles.backButtonText}>Back</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.analyzeButton, (!questionnaire.duration || !questionnaire.severity || isAnalyzing) && styles.disabledButton]}
                onPress={analyzeSymptoms}
                disabled={!questionnaire.duration || !questionnaire.severity || isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <IconSymbol name="brain.head.profile" size={24} color="white" />
                )}
                <ThemedText style={styles.analyzeButtonText}>
                  {isAnalyzing ? 'Analyzing with AI...' : 'Get AI Analysis'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </>
      ) : (
        <>
          {/* AI Assessment Results */}
          <ThemedView style={[styles.card, { borderLeftColor: getSeverityColor(assessment?.aiAssessment?.riskLevel || 'low') }]}>
            <View style={styles.resultHeader}>
              <IconSymbol
                name="brain.head.profile"
                size={32}
                color={getSeverityColor(assessment?.aiAssessment?.riskLevel || 'low')}
              />
              <View style={styles.resultHeaderText}>
                <ThemedText type="defaultSemiBold">AI Analysis Complete</ThemedText>
                <ThemedText style={[styles.riskLevel, { color: getSeverityColor(assessment?.aiAssessment?.riskLevel || 'low') }]}>
                  {assessment?.aiAssessment?.riskLevel.toUpperCase()} RISK LEVEL
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.disclaimer}>
              {assessment?.aiAssessment?.disclaimer || '⚠️ This is an AI-based preliminary assessment. Always consult healthcare professionals for proper diagnosis and treatment.'}
            </ThemedText>
          </ThemedView>

          {/* Possible Conditions */}
          {assessment?.aiAssessment?.possibleConditions && (
            <ThemedView style={styles.card}>
              <View style={styles.cardHeader}>
                <IconSymbol name="heart.text.square" size={24} color="#E91E63" />
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Possible Conditions
                </ThemedText>
              </View>
              
              {assessment.aiAssessment.possibleConditions.map((condition, index) => (
                <View key={index} style={styles.conditionItem}>
                  <View style={styles.conditionHeader}>
                    <ThemedText type="defaultSemiBold">{condition.name}</ThemedText>
                    <View style={styles.probabilityContainer}>
                      <View style={[styles.probabilityBadge, { backgroundColor: getProbabilityColor(condition.probability) }]}>
                        <ThemedText style={styles.probabilityText}>{condition.probability}%</ThemedText>
                      </View>
                      <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(condition.severity) }]}>
                        <ThemedText style={styles.severityText}>{condition.severity}</ThemedText>
                      </View>
                    </View>
                  </View>
                  <ThemedText style={styles.conditionDescription}>{condition.description}</ThemedText>
                  {condition.commonDuration && (
                    <View style={styles.conditionDetail}>
                      <IconSymbol name="clock" size={16} color="#757575" />
                      <ThemedText style={styles.conditionDetailText}>Duration: {condition.commonDuration}</ThemedText>
                    </View>
                  )}
                  {condition.waterSource && (
                    <View style={styles.conditionDetail}>
                      <IconSymbol name="drop.fill" size={16} color="#2196F3" />
                      <ThemedText style={styles.conditionDetailText}>Source: {condition.waterSource}</ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </ThemedView>
          )}

          {/* Home Remedies */}
          {assessment?.aiAssessment?.homeRemedies && (
            <ThemedView style={styles.card}>
              <View style={styles.cardHeader}>
                <IconSymbol name="house.fill" size={24} color="#4CAF50" />
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Home Remedies & Self-Care
                </ThemedText>
              </View>
              
              {assessment.aiAssessment.homeRemedies.map((remedy, index) => (
                <View key={index} style={styles.remedyItem}>
                  <ThemedText style={styles.remedyText}>{remedy}</ThemedText>
                </View>
              ))}
            </ThemedView>
          )}

          {/* When to Seek Help */}
          {assessment?.aiAssessment?.whenToSeekHelp && (
            <ThemedView style={styles.card}>
              <View style={styles.cardHeader}>
                <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#F44336" />
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  When to Seek Medical Help
                </ThemedText>
              </View>
              
              {assessment.aiAssessment.whenToSeekHelp.map((warning, index) => (
                <View key={index} style={styles.warningItem}>
                  <ThemedText style={styles.warningText}>{warning}</ThemedText>
                </View>
              ))}
            </ThemedView>
          )}

          {/* General Advice */}
          {assessment?.aiAssessment?.generalAdvice && (
            <ThemedView style={styles.card}>
              <View style={styles.cardHeader}>
                <IconSymbol name="lightbulb.fill" size={24} color="#2196F3" />
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  General Health Tips
                </ThemedText>
              </View>
              
              {assessment.aiAssessment.generalAdvice.map((advice, index) => (
                <View key={index} style={styles.adviceItem}>
                  <ThemedText style={styles.adviceText}>{advice}</ThemedText>
                </View>
              ))}
            </ThemedView>
          )}

          {/* Prevention Tips */}
          {assessment?.aiAssessment?.preventionTips && (
            <ThemedView style={styles.card}>
              <View style={styles.cardHeader}>
                <IconSymbol name="shield.fill" size={24} color="#4CAF50" />
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                  Prevention & Water Safety
                </ThemedText>
              </View>
              
              {assessment.aiAssessment.preventionTips.map((tip, index) => (
                <View key={index} style={styles.preventionItem}>
                  <ThemedText style={styles.preventionText}>{tip}</ThemedText>
                </View>
              ))}
            </ThemedView>
          )}

          {/* Action Buttons */}
          <ThemedView style={styles.card}>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetAssessment}>
                <IconSymbol name="arrow.counterclockwise" size={20} color="#2196F3" />
                <ThemedText style={styles.secondaryButtonText}>New Assessment</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.primaryButton}>
                <IconSymbol name="phone.fill" size={20} color="white" />
                <ThemedText style={styles.primaryButtonText}>Emergency Call</ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </>
      )}

      {/* Assessment History */}
      {assessmentHistory.length > 0 && (
        <ThemedView style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="clock.fill" size={24} color="#757575" />
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
              Recent AI Assessments
            </ThemedText>
          </View>
          
          {assessmentHistory.slice(0, 3).map((hist, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <View style={[styles.riskIndicator, { backgroundColor: getSeverityColor(hist.aiAssessment?.riskLevel || 'low') }]} />
                <ThemedText style={styles.historyDate}>
                  {hist.timestamp.toLocaleDateString()} at {hist.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              </View>
              <ThemedText style={styles.historySymptoms}>
                {hist.selectedSymptoms.length} symptoms • {hist.aiAssessment?.riskLevel || 'unknown'} risk
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
    padding: 24,
    paddingTop: 64,
    alignItems: 'center',
    backgroundColor: '#E91E63',
    marginBottom: 20,
  },
  headerTitle: {
    color: 'white',
    marginTop: 8,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    marginLeft: 8,
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
  conditionItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  probabilityContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  probabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  probabilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  conditionDescription: {
    color: '#555555',
    lineHeight: 18,
    fontSize: 14,
  },
  remedyItem: {
    marginBottom: 8,
  },
  remedyText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#222222',
    fontWeight: '400',
  },
  warningItem: {
    marginBottom: 8,
  },
  warningText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#D32F2F',
    fontWeight: '500',
  },
  adviceItem: {
    marginBottom: 8,
  },
  adviceText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#222222',
    fontWeight: '400',
  },
  questionContainer: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  optionText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '500',
  },
  questionnaireButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  backButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 8,
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
  conditionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  conditionDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#757575',
    flex: 1,
  },
  preventionItem: {
    marginBottom: 8,
  },
  preventionText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#222222',
    fontWeight: '400',
  },
});