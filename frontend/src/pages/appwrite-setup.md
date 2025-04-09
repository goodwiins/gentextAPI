# Appwrite Setup Guide

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

If you continue to see errors:
1. Check the browser console for specific error messages
2. Verify that your `.env.local` file has the correct database and collection IDs
3. Make sure the attribute names in your code match exactly with those in Appwrite (case-sensitive) 