# Appwrite Setup Guide

## Environment Variables Setup

First, create a `.env.local` file in your frontend directory with these variables:

```bash
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=67f3fd1900127d6ca5eb

# Database Configuration
NEXT_PUBLIC_APPWRITE_DATABASE_ID=67f416e9001c0ce998d7
NEXT_PUBLIC_APPWRITE_COLLECTION_ID=67f41717000e40efcf00
```

⚠️ **Important**: Without these environment variables, you'll get "Missing Appwrite configuration" errors.

## Authentication Configuration

### Enable Account Scope

1. Go to your Appwrite Console: https://cloud.appwrite.io/console
2. Go to your project: `67f3fd1900127d6ca5eb`
3. Go to **Settings** > **Authentication**
4. Under **Scopes**, make sure **Account** is enabled
5. Under **Authentication methods**, enable **Email/Password**:
   - Enable **User registration** (if you want new users to sign up)
   - Enable **Email verification** (optional but recommended)

### Authentication Configuration ⚠️ **UPDATED SOLUTION**

**Note**: Recent Appwrite versions no longer allow manual scope assignment to Guest role. The code has been updated to handle this automatically.

**Required settings in Appwrite Console:**

1. Go to **Settings** > **Authentication**
2. **Enable required authentication methods:**
   - ✅ Email/Password
   - ✅ Anonymous Sessions (this provides the account scope)
3. **Under "Sessions":**
   - ✅ Allow anonymous sessions
4. **Save changes**

**The registration code now creates an anonymous session first to get the necessary permissions.**

## Collection Schema Setup

1. Go to your Appwrite Console: https://cloud.appwrite.io/console
2. Go to your project: `67f3fd1900127d6ca5eb`
3. Go to Databases > `67f416e9001c0ce998d7`
4. Go to Collection > `67f41717000e40efcf00`

### Create Required Attributes

Make sure your collection has the following attributes:

1. **text** (String)
   - Required: Yes
   - Size: 1MB (to accommodate large texts)

2. **title** (String)
   - Required: No
   - Default: "Untitled Quiz"
   - Size: 256

3. **userId** (String)
   - Required: Yes
   - Size: 36
   - Index: Yes (for faster queries)

4. **createdAt** (DateTime)
   - Required: Yes
   - Default: Current Date

5. **questions** (JSON)
   - Required: Yes

### Update Collection Permissions

1. Go to Settings tab of your collection
2. Set the following permissions:
   - **Read**: Users with matching userId attribute value
   - **Create**: Any authenticated user
   - **Update**: Users with matching userId attribute value
   - **Delete**: Users with matching userId attribute value

## Testing

After setting up the schema correctly, your history page should work properly.

## Troubleshooting

### Common Registration Errors:

**Error: "missing scopes" or "user_unauthorized"**
- ✅ **Fix**: Enable Anonymous Sessions in Authentication settings (see Updated Solution above)
- ✅ **Automatic**: Code now creates anonymous session before registration

**Error: "Rate limit exceeded"**
- ✅ **Fix**: Code already handles this with retry logic
- Wait a few minutes and try again

**Error: "Invalid credentials"**
- ✅ **Fix**: Check your APPWRITE_PROJECT_ID in `.env.local`

### Common Database/History Page Errors:

**Error: "Missing Appwrite configuration"**
- ✅ **Fix**: Create `.env.local` file with all required environment variables (see Environment Variables Setup above)
- ✅ **Check**: Make sure APPWRITE_DATABASE_ID and APPWRITE_COLLECTION_ID are set
- ✅ **Restart**: Restart your development server after adding environment variables

### Other Issues:

If you continue to see other errors:
1. Check the browser console for specific error messages
2. Verify that your `.env.local` file has the correct database and collection IDs
3. Make sure the attribute names in your code match exactly with those in Appwrite (case-sensitive)
4. Ensure your Appwrite project ID is correct: `67f3fd1900127d6ca5eb` 