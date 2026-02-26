# Firebase Storage Setup for Image Uploads

## 🚨 CORS Error Fix Required

If you're getting CORS errors when uploading images, follow these steps:

### Step 1: Enable Firebase Storage

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`YOUR_PROJECT_ID`)
3. In the left sidebar, click on **"Storage"**
4. Click **"Get Started"** to enable Firebase Storage
5. Choose a location for your storage bucket (any region is fine)
6. Click **"Done"**

### Step 2: Install Google Cloud SDK

**Download and Install:**
1. Download from: https://cloud.google.com/sdk/docs/install
2. Run the installer (GoogleCloudSDKInstaller.exe)
3. Choose default installation options

**Or use the automated script:**
- Run `complete-cors-setup.bat` in your project folder
- This will install everything and configure CORS automatically

### Step 3: Configure CORS Manually

If the automated script doesn't work, follow these manual steps:

1. **Open Command Prompt or PowerShell as Administrator**
2. **Initialize Google Cloud SDK:**
   ```
   "C:\Google\CloudSDK\google-cloud-sdk\bin\gcloud.cmd" init
   ```
3. **Authenticate:**
   ```
   "C:\Google\CloudSDK\google-cloud-sdk\bin\gcloud.cmd" auth login
   ```
4. **Set project:**
   ```
   "C:\Google\CloudSDK\google-cloud-sdk\bin\gcloud.cmd" config set project YOUR_PROJECT_ID
   ```
5. **Install gsutil:**
   ```
   "C:\Google\CloudSDK\google-cloud-sdk\bin\gcloud.cmd" components install gsutil
   ```
6. **Set CORS configuration:**
   ```
   "C:\Google\CloudSDK\google-cloud-sdk\bin\gsutil.cmd" cors set cors.json gs://YOUR_PROJECT_ID.appspot.com
   ```
7. **Verify:**
   ```
   "C:\Google\CloudSDK\google-cloud-sdk\bin\gsutil.cmd" cors get gs://YOUR_PROJECT_ID.appspot.com
   ```

### Step 4: Deploy Storage Rules

After enabling Firebase Storage, deploy the security rules:

```bash
firebase deploy --only storage
```

## Alternative: Manual CORS Setup

If you can't use gsutil, you can set CORS manually:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Storage** → **Buckets**
3. Find your bucket: `YOUR_PROJECT_ID.appspot.com`
4. Use the REST API or contact Google Cloud support for CORS configuration

## Testing Image Upload

After completing the setup:

1. **Clear browser cache** and reload the app
2. Go to **Admin → Teams**
3. Click **"Add Team"**
4. Click **"Upload File"** tab
5. Select an image file from your computer
6. Fill in other team details
7. Click **"Add Team"**

The image should upload successfully and display in the team list.

## Troubleshooting

### CORS Errors Persist
- Ensure you're using the correct bucket name: `gs://YOUR_PROJECT_ID.appspot.com`
- Try refreshing the CORS configuration
- Check that your Firebase project ID matches

### Storage Not Enabled
- Verify Firebase Storage is enabled in Firebase Console
- Check that the bucket exists in Google Cloud Console

### Permission Errors
- Ensure you're logged in as an admin user
- Check that storage rules are deployed correctly

### SDK Installation Issues
- Make sure you run the installer as Administrator
- Try reinstalling the Google Cloud SDK
- Check that all paths are correct in the commands
   ```

### Step 3: Deploy Storage Rules

After enabling Firebase Storage, deploy the security rules:

```bash
firebase deploy --only storage
```

## Alternative: Manual CORS Setup

If you can't use gsutil, you can set CORS manually:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Storage** → **Buckets**
3. Click your bucket: `YOUR_PROJECT_ID.appspot.com`
4. Open the **Configuration** tab (not Permissions)
5. Scroll to the **CORS** section → click **Edit** → paste the `cors.json` content → **Save**

## Testing Image Upload

After completing the setup:

1. **Clear browser cache** and reload the app
2. Go to **Admin → Teams**
3. Click **"Add Team"**
4. Click **"Upload File"** tab
5. Select an image file from your computer
6. Fill in other team details
7. Click **"Add Team"**

The image should upload successfully and display in the team list.

## Troubleshooting

### CORS Errors Persist
- Ensure you're using the correct bucket name
- Try refreshing the CORS configuration
- Check that your Firebase project ID matches

### Storage Not Enabled
- Verify Firebase Storage is enabled in Firebase Console
- Check that the bucket exists in Google Cloud Console

### Permission Errors
- Ensure you're logged in as an admin user
- Check that storage rules are deployed correctly