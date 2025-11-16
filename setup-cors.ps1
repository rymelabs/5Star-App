# Firebase Storage CORS Setup Script
Write-Host "Setting up Firebase Storage CORS configuration..." -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Make sure you're logged into Google Cloud" -ForegroundColor Yellow
gcloud auth login

Write-Host ""
Write-Host "Step 2: Set the project" -ForegroundColor Yellow
gcloud config set project starsapp-e27d1

Write-Host ""
Write-Host "Step 3: Configure CORS for Firebase Storage" -ForegroundColor Yellow
gsutil cors set cors.json gs://starsapp-e27d1.appspot.com

Write-Host ""
Write-Host "Step 4: Verify CORS configuration" -ForegroundColor Yellow
gsutil cors get gs://starsapp-e27d1.appspot.com

Write-Host ""
Write-Host "CORS setup complete! You can now test image uploads in your app." -ForegroundColor Green
Read-Host "Press Enter to exit"