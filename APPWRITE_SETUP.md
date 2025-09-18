# Appwrite Database Setup Guide

## 🚀 Complete Setup Instructions

### Step 1: Create Database
1. Go to your Appwrite Console: https://cloud.appwrite.io/console/project-68cc2559003367fd775e
2. Navigate to **Databases** in the left sidebar
3. Click **"Create Database"**
4. Enter Database ID: `main`
5. Enter Name: `Main Database`
6. Click **Create**

### Step 2: Create Collections

#### Collection 1: Users Profile Data
1. Click **"Create Collection"**
2. **Collection ID**: `users`
3. **Name**: `Users`
4. Click **Create**

**Add these attributes to the `users` collection:**

| Attribute Key | Type | Size | Required | Default | Array |
|---------------|------|------|----------|---------|-------|
| `name` | String | 255 | ✅ Yes | - | ❌ No |
| `email` | String | 255 | ✅ Yes | - | ❌ No |
| `userId` | String | 255 | ✅ Yes | - | ❌ No |
| `points` | Integer | - | ❌ No | 0 | ❌ No |
| `level` | Integer | - | ❌ No | 1 | ❌ No |
| `reportsSubmitted` | Integer | - | ❌ No | 0 | ❌ No |
| `streak` | Integer | - | ❌ No | 0 | ❌ No |
| `totalEarned` | Integer | - | ❌ No | 0 | ❌ No |
| `createdAt` | DateTime | - | ✅ Yes | - | ❌ No |
| `updatedAt` | DateTime | - | ✅ Yes | - | ❌ No |

#### Collection 2: User Achievements
1. Click **"Create Collection"**
2. **Collection ID**: `user_achievements`
3. **Name**: `User Achievements`
4. Click **Create**

**Add these attributes to the `user_achievements` collection:**

| Attribute Key | Type | Size | Required | Default | Array |
|---------------|------|------|----------|---------|-------|
| `userId` | String | 255 | ✅ Yes | - | ❌ No |
| `achievementId` | String | 255 | ✅ Yes | - | ❌ No |
| `unlockedAt` | DateTime | - | ✅ Yes | - | ❌ No |
| `points` | Integer | - | ✅ Yes | - | ❌ No |

### Step 3: Set Collection Permissions

#### For `users` collection:
1. Go to **Settings** tab in the collection
2. Click **Permissions**
3. Add these permissions:
   - **Create**: `users` (Any authenticated user)
   - **Read**: `users` (Any authenticated user)
   - **Update**: `users` (Any authenticated user)
   - **Delete**: `users` (Any authenticated user)

#### For `user_achievements` collection:
1. Go to **Settings** tab in the collection
2. Click **Permissions**
3. Add these permissions:
   - **Create**: `users` (Any authenticated user)
   - **Read**: `users` (Any authenticated user)
   - **Update**: `users` (Any authenticated user)
   - **Delete**: `users` (Any authenticated user)

### Step 4: Create Indexes (Optional but Recommended)

#### For `users` collection:
1. Go to **Indexes** tab
2. Create index:
   - **Key**: `userId_index`
   - **Type**: `key`
   - **Attributes**: `userId` (ASC)

#### For `user_achievements` collection:
1. Go to **Indexes** tab
2. Create indexes:
   - **Key**: `userId_index`
   - **Type**: `key`
   - **Attributes**: `userId` (ASC)
   
   - **Key**: `achievement_index`
   - **Type**: `key`
   - **Attributes**: `userId` (ASC), `achievementId` (ASC)

## 🔧 What This Setup Enables

### User Registration Flow:
1. User signs up with email/password in Appwrite Auth
2. App automatically creates a profile record in `users` collection
3. User starts with 0 points, level 1, and no achievements

### User Data Storage:
- **Authentication**: Handled by Appwrite Auth (built-in)
- **Profile Data**: Stored in `users` collection (points, level, reports, etc.)
- **Achievements**: Stored in `user_achievements` collection with timestamps

### Features Enabled:
- ✅ Secure user authentication
- ✅ Points and leveling system
- ✅ Achievement tracking with timestamps
- ✅ Report submission counting
- ✅ Streak tracking
- ✅ Reward redemption (point deduction)
- ✅ Leaderboard functionality
- ✅ User profile management

## 🧪 Testing the Setup

After completing the database setup:

1. **Run your app**: The authentication system will now store data in Appwrite
2. **Sign up**: Creates both auth user and database profile
3. **Login**: Retrieves user data from database
4. **Check Console**: View created records in Appwrite console
5. **Test Features**: Points, achievements, and user data persist across sessions

## 🔍 Troubleshooting

### Common Issues:
1. **Permission Errors**: Ensure collections have proper user permissions
2. **Attribute Errors**: Double-check attribute names and types match exactly
3. **Connection Issues**: Verify your `.env` file has correct Appwrite credentials

### Verification Steps:
1. Check Appwrite console for created collections
2. Verify all attributes are created with correct types
3. Confirm permissions are set to `users` for all operations
4. Test user registration creates database records

## 📱 App Features Now Available

With this database setup, your app now supports:
- **Persistent User Profiles**: Data survives app restarts
- **Real-time Points System**: Points stored in cloud database
- **Achievement System**: Unlocked achievements with timestamps
- **Progress Tracking**: Reports, streaks, and levels
- **Reward System**: Point-based reward redemption
- **Multi-device Sync**: User data syncs across devices

Your authentication system is now fully integrated with Appwrite database! 🎉