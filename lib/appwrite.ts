import { Client, Account, Databases, Storage } from 'appwrite';

// Get environment variables
const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Export client for additional configurations if needed
export { client };

// Database and collection IDs (create these in Appwrite console)
export const DATABASE_ID = 'main';
export const USERS_COLLECTION_ID = 'users';
export const USER_ACHIEVEMENTS_COLLECTION_ID = 'user_achievements';

// User data interface
export interface UserProfile {
  $id?: string;
  name: string;
  email: string;
  userId: string;
  points: number;
  level: number;
  reportsSubmitted: number;
  streak: number;
  totalEarned: number;
  createdAt: string;
  updatedAt: string;
}

// User achievement interface
export interface UserAchievement {
  $id?: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
  points: number;
}