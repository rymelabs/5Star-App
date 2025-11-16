@echo off
echo Setting up Firebase Storage CORS configuration...
echo.

echo Step 1: Make sure you're logged into Google Cloud
gcloud auth login

echo.
echo Step 2: Set the project
gcloud config set project YOUR_PROJECT_ID

echo.
echo Step 3: Configure CORS for Firebase Storage
gsutil cors set cors.json gs://YOUR_PROJECT_ID.appspot.com

echo.
echo Step 4: Verify CORS configuration
gsutil cors get gs://YOUR_PROJECT_ID.appspot.com

echo.
echo CORS setup complete! You can now test image uploads in your app.
pause