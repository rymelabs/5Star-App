# Phone Authentication Setup

## Required Firebase Console Configuration

To enable phone authentication, you need to:

1. **Enable Phone Authentication in Firebase Console:**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Phone" as a sign-in method
   - Add your domain to the authorized domains list

2. **reCAPTCHA Configuration:**
   - Phone authentication requires reCAPTCHA verification
   - Make sure your domain is authorized in Firebase console
   - For localhost development, Firebase should automatically allow it

3. **Common Issues:**
   - **Error: "Failed to send verification code"**
     - Check if phone authentication is enabled in Firebase console
     - Verify the phone number format includes country code (+1234567890)
     - Check browser console for more specific error messages
   
   - **reCAPTCHA Errors:**
     - Make sure the reCAPTCHA container exists in DOM
     - Clear old reCAPTCHA verifiers before creating new ones
     - Check if domain is authorized

4. **Phone Number Format:**
   - Must include country code: +1234567890
   - Use E.164 format
   - No spaces or special characters except +

## Testing
For development, you can add test phone numbers in Firebase Console:
- Go to Authentication → Sign-in method → Phone
- Add test phone numbers with verification codes
- Example: +1234567890 with code 123456

## Production Requirements
- Valid SSL certificate
- Domain must be added to authorized domains
- Consider SMS costs and rate limits