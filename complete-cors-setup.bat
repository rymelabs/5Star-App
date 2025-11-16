@echo off
echo Setting up Google Cloud SDK and CORS configuration...
echo.

echo Step 1: Initialize Google Cloud SDK
call "C:\Google\CloudSDK\google-cloud-sdk\bin\gcloud.cmd" init

echo.
echo Step 2: Authenticate
call "C:\Google\CloudSDK\google-cloud-sdk\bin\gcloud.cmd" auth login

echo.
echo Step 3: Set project
call "C:\Google\CloudSDK\google-cloud-sdk\bin\gcloud.cmd" config set project starsapp-e27d1

echo.
echo Step 4: Install gsutil components
call "C:\Google\CloudSDK\google-cloud-sdk\bin\gcloud.cmd" components install gsutil

echo.
echo Step 5: Set CORS configuration
call "C:\Google\CloudSDK\google-cloud-sdk\bin\gsutil.cmd" cors set cors.json gs://starsapp-e27d1.appspot.com

echo.
echo Step 6: Verify CORS configuration
call "C:\Google\CloudSDK\google-cloud-sdk\bin\gsutil.cmd" cors get gs://starsapp-e27d1.appspot.com

echo.
echo CORS setup complete! You can now test image uploads in your app.
pause