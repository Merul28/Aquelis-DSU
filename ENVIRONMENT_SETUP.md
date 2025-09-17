# Environment Setup Guide

## OpenAI API Configuration

To use the AI-powered symptom analysis feature, you need to set up your OpenAI API key:

### Step 1: Get Your OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your account or create a new one
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy the generated key (starts with `sk-proj-`)

### Step 2: Configure Environment Variables
1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and replace the placeholder:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   ```

3. Save the file

### Step 3: Verify Setup
- The `.env` file is already included in `.gitignore` for security
- Your API key will not be committed to version control
- The app will show an error if the API key is missing or invalid

## Security Notes
- Never commit your actual API key to version control
- Keep your `.env` file local and secure
- The `.env.example` file provides a template for other developers

## Features Enabled
With proper API key setup, you'll have access to:
- AI-powered symptom analysis
- Water-borne disease specialization
- Comprehensive health questionnaire
- Personalized health recommendations
- Home remedy suggestions
- Medical consultation guidance