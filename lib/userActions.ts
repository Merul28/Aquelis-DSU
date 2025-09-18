import { DatabaseService } from './database';
import { addRewardNotification } from '@/components/notification-system';

export class UserActions {
  // Submit a report and update user stats
  static async submitReport(userId: string): Promise<void> {
    try {
      // Increment report count
      const updatedProfile = await DatabaseService.incrementReports(userId);
      
      if (updatedProfile) {
        // Award points for submitting a report
        await DatabaseService.addPoints(userId, 25);
        
        // Show notification
        await addRewardNotification(25, 'submitting a water quality report!');
        
        // Check for achievements
        await this.checkReportAchievements(userId, updatedProfile.reportsSubmitted);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  }

  // Complete a health check and update stats
  static async completeHealthCheck(userId: string): Promise<void> {
    try {
      // Award points for health check
      await DatabaseService.addPoints(userId, 15);
      
      // Show notification
      await addRewardNotification(15, 'completing a health assessment!');
    } catch (error) {
      console.error('Error completing health check:', error);
      throw error;
    }
  }

  // Update daily streak
  static async updateDailyStreak(userId: string): Promise<void> {
    try {
      const userProfile = await DatabaseService.getUserProfile(userId);
      if (!userProfile) return;

      // Simple streak logic - in a real app, you'd check last activity date
      const newStreak = userProfile.streak + 1;
      await DatabaseService.updateStreak(userId, newStreak);

      // Award bonus points for streaks
      if (newStreak % 7 === 0) { // Weekly streak bonus
        await DatabaseService.addPoints(userId, 50);
        await addRewardNotification(50, `maintaining a ${newStreak}-day streak!`);
      }

      // Check for streak achievements
      await this.checkStreakAchievements(userId, newStreak);
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  // Check and unlock report-based achievements
  private static async checkReportAchievements(userId: string, reportCount: number): Promise<void> {
    try {
      // First report achievement
      if (reportCount === 1) {
        const isUnlocked = await DatabaseService.isAchievementUnlocked(userId, 'first_report');
        if (!isUnlocked) {
          await DatabaseService.unlockAchievement(userId, 'first_report', 50);
          await addRewardNotification(50, 'unlocking "First Reporter" achievement!');
        }
      }

      // Community hero achievement (10 reports)
      if (reportCount === 10) {
        const isUnlocked = await DatabaseService.isAchievementUnlocked(userId, 'community_hero');
        if (!isUnlocked) {
          await DatabaseService.unlockAchievement(userId, 'community_hero', 200);
          await addRewardNotification(200, 'unlocking "Community Hero" achievement!');
        }
      }
    } catch (error) {
      console.error('Error checking report achievements:', error);
    }
  }

  // Check and unlock streak-based achievements
  private static async checkStreakAchievements(userId: string, streak: number): Promise<void> {
    try {
      // Streak warrior achievement (7-day streak)
      if (streak === 7) {
        const isUnlocked = await DatabaseService.isAchievementUnlocked(userId, 'streak_warrior');
        if (!isUnlocked) {
          await DatabaseService.unlockAchievement(userId, 'streak_warrior', 150);
          await addRewardNotification(150, 'unlocking "Streak Warrior" achievement!');
        }
      }
    } catch (error) {
      console.error('Error checking streak achievements:', error);
    }
  }

  // Check level-based achievements
  static async checkLevelAchievements(userId: string, level: number): Promise<void> {
    try {
      // Water guardian achievement (level 10)
      if (level === 10) {
        const isUnlocked = await DatabaseService.isAchievementUnlocked(userId, 'water_guardian');
        if (!isUnlocked) {
          await DatabaseService.unlockAchievement(userId, 'water_guardian', 500);
          await addRewardNotification(500, 'unlocking "Water Guardian" achievement!');
        }
      }
    } catch (error) {
      console.error('Error checking level achievements:', error);
    }
  }

  // Simulate sensor connection (for testing)
  static async connectSensor(userId: string): Promise<void> {
    try {
      await DatabaseService.addPoints(userId, 10);
      await addRewardNotification(10, 'connecting a sensor!');
    } catch (error) {
      console.error('Error connecting sensor:', error);
      throw error;
    }
  }
}