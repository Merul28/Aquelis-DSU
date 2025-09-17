
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStats {
  points: number;
  reportsSubmitted: number;
  level: number;
  streak: number;
  totalEarned: number;
  badges: string[];
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedDate?: Date;
  category: 'reporting' | 'health' | 'community' | 'verification' | 'special';
}

interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'vouchers' | 'services' | 'products' | 'donations';
  icon: string;
  available: boolean;
  claimed: boolean;
  expiryDate?: Date;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  level: number;
  reportsSubmitted: number;
  rank: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_report',
    name: 'First Reporter',
    description: 'Submit your first water quality report',
    icon: 'flag.fill',
    points: 50,
    unlocked: false,
    category: 'reporting'
  },
  {
    id: 'health_checker',
    name: 'Health Conscious',
    description: 'Complete 5 health symptom checks',
    icon: 'heart.fill',
    points: 75,
    unlocked: false,
    category: 'health'
  },
  {
    id: 'sensor_master',
    name: 'Sensor Master',
    description: 'Connect and monitor 3 different sensors',
    icon: 'sensor.fill',
    points: 100,
    unlocked: false,
    category: 'reporting'
  },
  {
    id: 'community_hero',
    name: 'Community Hero',
    description: 'Submit 10 verified reports',
    icon: 'person.3.fill',
    points: 200,
    unlocked: false,
    category: 'community'
  },
  {
    id: 'streak_warrior',
    name: 'Streak Warrior',
    description: 'Maintain a 7-day activity streak',
    icon: 'flame.fill',
    points: 150,
    unlocked: false,
    category: 'special'
  },
  {
    id: 'water_guardian',
    name: 'Water Guardian',
    description: 'Reach level 10',
    icon: 'shield.fill',
    points: 500,
    unlocked: false,
    category: 'special'
  }
];

const REWARDS: Reward[] = [
  {
    id: 'water_filter',
    name: 'Water Filter Discount',
    description: '20% off on water purification systems',
    cost: 500,
    category: 'products',
    icon: 'drop.triangle.fill',
    available: true,
    claimed: false
  },
  {
    id: 'health_checkup',
    name: 'Free Health Checkup',
    description: 'Complimentary health screening at partner clinics',
    cost: 750,
    category: 'services',
    icon: 'stethoscope',
    available: true,
    claimed: false
  },
  {
    id: 'grocery_voucher',
    name: 'Grocery Voucher',
    description: '₹200 voucher for organic groceries',
    cost: 400,
    category: 'vouchers',
    icon: 'bag.fill',
    available: true,
    claimed: false
  },
  {
    id: 'tree_plantation',
    name: 'Plant a Tree',
    description: 'Sponsor tree plantation in your community',
    cost: 300,
    category: 'donations',
    icon: 'leaf.fill',
    available: true,
    claimed: false
  },
  {
    id: 'water_testing',
    name: 'Water Testing Kit',
    description: 'Professional water quality testing kit',
    cost: 600,
    category: 'products',
    icon: 'testtube.2',
    available: true,
    claimed: false
  },
  {
    id: 'premium_access',
    name: 'Premium Features',
    description: '3 months of premium app features',
    cost: 1000,
    category: 'services',
    icon: 'star.fill',
    available: true,
    claimed: false
  }
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'Rahul Kumar', points: 2450, level: 5, reportsSubmitted: 23, rank: 1 },
  { id: '2', name: 'Priya Sharma', points: 2100, level: 4, reportsSubmitted: 19, rank: 2 },
  { id: '3', name: 'Amit Singh', points: 1850, level: 4, reportsSubmitted: 17, rank: 3 },
  { id: '4', name: 'Sneha Patel', points: 1600, level: 3, reportsSubmitted: 15, rank: 4 },
  { id: '5', name: 'You', points: 0, level: 1, reportsSubmitted: 0, rank: 5 }
];

export default function RewardsScreen() {
  const [userStats, setUserStats] = useState<UserStats>({
    points: 0,
    reportsSubmitted: 0,
    level: 1,
    streak: 0,
    totalEarned: 0,
    badges: [],
    achievements: ACHIEVEMENTS
  });
  const [rewards, setRewards] = useState<Reward[]>(REWARDS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements' | 'rewards' | 'leaderboard'>('overview');
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  useEffect(() => {
    loadUserStats();
    checkForNewAchievements();
  }, []);

  const loadUserStats = async () => {
    try {
      const savedStats = await AsyncStorage.getItem('userStats');
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        setUserStats(prev => ({
          ...prev,
          ...stats,
          achievements: ACHIEVEMENTS.map(achievement => ({
            ...achievement,
            unlocked: stats.achievements?.find((a: any) => a.id === achievement.id)?.unlocked || false,
            unlockedDate: stats.achievements?.find((a: any) => a.id === achievement.id)?.unlockedDate
          }))
        }));
        
        // Update leaderboard with user's actual stats
        setLeaderboard(prev => prev.map(entry => 
          entry.name === 'You' 
            ? { ...entry, points: stats.points, level: stats.level, reportsSubmitted: stats.reportsSubmitted }
            : entry
        ));
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const checkForNewAchievements = async () => {
    try {
      const savedStats = await AsyncStorage.getItem('userStats');
      if (!savedStats) return;

      const stats = JSON.parse(savedStats);
      const newAchievements: Achievement[] = [];

      // Check each achievement condition
      ACHIEVEMENTS.forEach(achievement => {
        const isAlreadyUnlocked = stats.achievements?.find((a: any) => a.id === achievement.id)?.unlocked;
        if (isAlreadyUnlocked) return;

        let shouldUnlock = false;

        switch (achievement.id) {
          case 'first_report':
            shouldUnlock = stats.reportsSubmitted >= 1;
            break;
          case 'health_checker':
            // Check health assessments (simplified)
            shouldUnlock = stats.healthChecks >= 5;
            break;
          case 'sensor_master':
            shouldUnlock = stats.sensorsConnected >= 3;
            break;
          case 'community_hero':
            shouldUnlock = stats.verifiedReports >= 10;
            break;
          case 'streak_warrior':
            shouldUnlock = stats.streak >= 7;
            break;
          case 'water_guardian':
            shouldUnlock = stats.level >= 10;
            break;
        }

        if (shouldUnlock) {
          newAchievements.push({
            ...achievement,
            unlocked: true,
            unlockedDate: new Date()
          });
        }
      });

      if (newAchievements.length > 0) {
        // Award points for achievements
        const bonusPoints = newAchievements.reduce((total, achievement) => total + achievement.points, 0);
        const updatedStats = {
          ...stats,
          points: stats.points + bonusPoints,
          totalEarned: stats.totalEarned + bonusPoints,
          achievements: ACHIEVEMENTS.map(achievement => {
            const newAchievement = newAchievements.find(na => na.id === achievement.id);
            return newAchievement || achievement;
          })
        };

        await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
        setUserStats(prev => ({ ...prev, ...updatedStats }));

        // Show achievement notification
        Alert.alert(
          '🎉 Achievement Unlocked!',
          `You earned ${bonusPoints} points for unlocking ${newAchievements.length} achievement(s)!`
        );
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const claimReward = async (reward: Reward) => {
    if (userStats.points < reward.cost) {
      Alert.alert('Insufficient Points', `You need ${reward.cost - userStats.points} more points to claim this reward.`);
      return;
    }

    Alert.alert(
      'Claim Reward',
      `Are you sure you want to claim "${reward.name}" for ${reward.cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            try {
              // Deduct points
              const updatedStats = {
                ...userStats,
                points: userStats.points - reward.cost
              };

              // Mark reward as claimed
              const updatedRewards = rewards.map(r => 
                r.id === reward.id ? { ...r, claimed: true } : r
              );

              await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
              setUserStats(updatedStats);
              setRewards(updatedRewards);
              setShowRewardModal(false);

              Alert.alert(
                'Reward Claimed!',
                `You have successfully claimed "${reward.name}". Check your email for redemption details.`
              );
            } catch (error) {
              console.error('Error claiming reward:', error);
              Alert.alert('Error', 'Failed to claim reward. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getLevelProgress = () => {
    const currentLevelPoints = (userStats.level - 1) * 500;
    const nextLevelPoints = userStats.level * 500;
    const progress = (userStats.points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints);
    return Math.max(0, Math.min(1, progress));
  };

  const getNextLevelPoints = () => {
    const nextLevelPoints = userStats.level * 500;
    return nextLevelPoints - userStats.points;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reporting': return '#2196F3';
      case 'health': return '#E91E63';
      case 'community': return '#4CAF50';
      case 'verification': return '#FF9800';
      case 'special': return '#9C27B0';
      default: return '#757575';
    }
  };

  const renderOverview = () => (
    <ScrollView>
      {/* User Stats Card */}
      <ThemedView style={styles.card}>
        <View style={styles.statsHeader}>
          <View style={styles.levelBadge}>
            <IconSymbol name="star.fill" size={24} color="#FFD700" />
            <ThemedText style={styles.levelText}>Level {userStats.level}</ThemedText>
          </View>
          <View style={styles.pointsContainer}>
            <ThemedText style={styles.pointsValue}>{userStats.points}</ThemedText>
            <ThemedText style={styles.pointsLabel}>Points</ThemedText>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getLevelProgress() * 100}%` }]} />
          </View>
          <ThemedText style={styles.progressText}>
            {getNextLevelPoints()} points to next level
          </ThemedText>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <IconSymbol name="flag.fill" size={20} color="#2196F3" />
            <ThemedText style={styles.statValue}>{userStats.reportsSubmitted}</ThemedText>
            <ThemedText style={styles.statLabel}>Reports</ThemedText>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name="flame.fill" size={20} color="#FF5722" />
            <ThemedText style={styles.statValue}>{userStats.streak}</ThemedText>
            <ThemedText style={styles.statLabel}>Day Streak</ThemedText>
          </View>
          <View style={styles.statItem}>
            <IconSymbol name="trophy.fill" size={20} color="#FFD700" />
            <ThemedText style={styles.statValue}>
              {userStats.achievements.filter(a => a.unlocked).length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Achievements</ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* Recent Achievements */}
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Recent Achievements
        </ThemedText>
        
        {userStats.achievements.filter(a => a.unlocked).slice(0, 3).map((achievement) => (
          <View key={achievement.id} style={styles.achievementItem}>
            <IconSymbol name={achievement.icon as any} size={24} color={getCategoryColor(achievement.category)} />
            <View style={styles.achievementInfo}>
              <ThemedText type="defaultSemiBold">{achievement.name}</ThemedText>
              <ThemedText style={styles.achievementDescription}>{achievement.description}</ThemedText>
            </View>
            <View style={styles.achievementPoints}>
              <ThemedText style={styles.pointsEarned}>+{achievement.points}</ThemedText>
            </View>
          </View>
        ))}
        
        {userStats.achievements.filter(a => a.unlocked).length === 0 && (
          <ThemedText style={styles.noDataText}>
            Complete activities to unlock achievements!
          </ThemedText>
        )}
      </ThemedView>
    </ScrollView>
  );

  const renderAchievements = () => (
    <ScrollView>
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          All Achievements
        </ThemedText>
        
        {userStats.achievements.map((achievement) => (
          <View key={achievement.id} style={[
            styles.achievementItem,
            !achievement.unlocked && styles.lockedAchievement
          ]}>
            <IconSymbol 
              name={achievement.icon as any} 
              size={24} 
              color={achievement.unlocked ? getCategoryColor(achievement.category) : '#ccc'} 
            />
            <View style={styles.achievementInfo}>
              <ThemedText type="defaultSemiBold" style={[
                !achievement.unlocked && styles.lockedText
              ]}>
                {achievement.name}
              </ThemedText>
              <ThemedText style={[
                styles.achievementDescription,
                !achievement.unlocked && styles.lockedText
              ]}>
                {achievement.description}
              </ThemedText>
            </View>
            <View style={styles.achievementPoints}>
              <ThemedText style={[
                styles.pointsEarned,
                !achievement.unlocked && styles.lockedText
              ]}>
                {achievement.unlocked ? `+${achievement.points}` : `${achievement.points} pts`}
              </ThemedText>
            </View>
          </View>
        ))}
      </ThemedView>
    </ScrollView>
  );

  const renderRewards = () => (
    <ScrollView>
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Available Rewards
        </ThemedText>
        
        <View style={styles.rewardsGrid}>
          {rewards.filter(r => r.available && !r.claimed).map((reward) => (
            <TouchableOpacity
              key={reward.id}
              style={[
                styles.rewardCard,
                userStats.points < reward.cost && styles.unaffordableReward
              ]}
              onPress={() => {
                setSelectedReward(reward);
                setShowRewardModal(true);
              }}
            >
              <IconSymbol 
                name={reward.icon as any} 
                size={32} 
                color={userStats.points >= reward.cost ? '#2196F3' : '#ccc'} 
              />
              <ThemedText style={[
                styles.rewardName,
                userStats.points < reward.cost && styles.unaffordableText
              ]}>
                {reward.name}
              </ThemedText>
              <ThemedText style={[
                styles.rewardDescription,
                userStats.points < reward.cost && styles.unaffordableText
              ]}>
                {reward.description}
              </ThemedText>
              <View style={styles.rewardCost}>
                <IconSymbol name="star.fill" size={16} color="#FFD700" />
                <ThemedText style={styles.costText}>{reward.cost}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>
    </ScrollView>
  );

  const renderLeaderboard = () => (
    <ScrollView>
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
          Community Leaderboard
        </ThemedText>
        
        {leaderboard.map((entry) => (
          <View key={entry.id} style={[
            styles.leaderboardItem,
            entry.name === 'You' && styles.userEntry
          ]}>
            <View style={styles.rankContainer}>
              <ThemedText style={[
                styles.rankText,
                entry.rank <= 3 && styles.topRank
              ]}>
                #{entry.rank}
              </ThemedText>
            </View>
            
            <View style={styles.leaderboardInfo}>
              <ThemedText type="defaultSemiBold">{entry.name}</ThemedText>
              <ThemedText style={styles.leaderboardStats}>
                Level {entry.level} • {entry.reportsSubmitted} reports
              </ThemedText>
            </View>
            
            <View style={styles.leaderboardPoints}>
              <ThemedText style={styles.leaderboardPointsText}>{entry.points}</ThemedText>
              <ThemedText style={styles.pointsLabel}>points</ThemedText>
            </View>
          </View>
        ))}
      </ThemedView>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Rewards & Achievements</ThemedText>
        <ThemedText type="subtitle">Earn points and unlock rewards</ThemedText>
      </ThemedView>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', icon: 'house.fill' },
          { key: 'achievements', label: 'Achievements', icon: 'trophy.fill' },
          { key: 'rewards', label: 'Rewards', icon: 'gift.fill' },
          { key: 'leaderboard', label: 'Leaderboard', icon: 'list.number' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <IconSymbol 
              name={tab.icon as any} 
              size={16} 
              color={selectedTab === tab.key ? '#2196F3' : '#666'} 
            />
            <ThemedText style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'achievements' && renderAchievements()}
        {selectedTab === 'rewards' && renderRewards()}
        {selectedTab === 'leaderboard' && renderLeaderboard()}
      </View>

      {/* Reward Details Modal */}
      <Modal
        visible={showRewardModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRewardModal(false)}
      >
        {selectedReward && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowRewardModal(false)}
              >
                <IconSymbol name="xmark" size={24} color="#666" />
              </TouchableOpacity>
              <ThemedText type="title">Reward Details</ThemedText>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.rewardDetails}>
                <IconSymbol name={selectedReward.icon as any} size={64} color="#2196F3" />
                <ThemedText type="title" style={styles.rewardModalName}>
                  {selectedReward.name}
                </ThemedText>
                <ThemedText style={styles.rewardModalDescription}>
                  {selectedReward.description}
                </ThemedText>
                
                <View style={styles.costContainer}>
                  <IconSymbol name="star.fill" size={24} color="#FFD700" />
                  <ThemedText style={styles.costValue}>{selectedReward.cost} Points</ThemedText>
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.claimButton,
                  userStats.points < selectedReward.cost && styles.disabledButton
                ]}
                onPress={() => claimReward(selectedReward)}
                disabled={userStats.points < selectedReward.cost}
              >
                <ThemedText style={styles.claimButtonText}>
                  {userStats.points >= selectedReward.cost ? 'Claim Reward' : 'Insufficient Points'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#FFD700',
    marginBottom: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    paddingTop: 16,
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
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  levelText: {
    color: '#856404',
    fontWeight: 'bold',
  },
  pointsContainer: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#333',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  lockedAchievement: {
    opacity: 0.6,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  achievementPoints: {
    alignItems: 'center',
  },
  pointsEarned: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  lockedText: {
    color: '#ccc',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rewardCard: {
    width: '48%',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unaffordableReward: {
    opacity: 0.6,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    color: '#333',
  },
  rewardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  costText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  unaffordableText: {
    color: '#ccc',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  userEntry: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  topRank: {
    color: '#FFD700',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  leaderboardPoints: {
    alignItems: 'center',
  },
  leaderboardPointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
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
  rewardDetails: {
    alignItems: 'center',
    marginBottom: 30,
  },
  rewardModalName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    color: '#333',
  },
  rewardModalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  costValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  claimButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  claimButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
