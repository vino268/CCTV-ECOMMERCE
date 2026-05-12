# Local Email Testing Guide

## Quick Start - Test Email in 5 Minutes

### Prerequisites
- Node.js installed
- Project dependencies installed (`npm install`)
- `.env.local` file configured with email credentials

### Step 1: Verify Environment Variables
Check `.env.local`:
```
EMAIL_USER=tnautomation803@gmail.com
EMAIL_PASS=hagh zjce nlud htxp
RECEIVER_EMAIL=tnautomation803@gmail.com
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Step 2: Start Backend Server
```bash
# Terminal 1 - Start Express backend
node server.js
```

Expected output:
```
====== EMAIL SERVICE DEBUG ======
EMAIL_USER: tnautomation803@gmail.com
EMAIL_PASS EXISTS: true
RECEIVER_EMAIL: tnautomation803@gmail.com
NODE_ENV: development
================================
Mongo URI Exists: true
JWT Exists: true
```

### Step 3: Start Frontend Server
```bash
# Terminal 2 - Start Next.js development server
npm run dev
```

Expected output:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
```

### Step 4: Test Contact Form
1. Open http://localhost:3000/contact
2. Fill in the form:
   ```
   Name: Test User
   Email: test@example.com
   Phone: +91-9999999999
   Subject: Test Contact
   Message: This is a test message from localhost
   ```
3. Click "Send Message"
4. Check backend console for logs:
   ```
   Sending contact email...
   Mail options - From: "TN Automation" <tnautomation803@gmail.com>
   Mail options - To: tnautomation803@gmail.com
   Email sent successfully to: tnautomation803@gmail.com
   ```
5. Check frontend: Should show green success message "Message sent successfully"
6. Check email inbox (tnautomation803@gmail.com): Email should arrive in 1-2 seconds

---

## Verify Email Details

### Check Sender Name
- [ ] Email should show from: **TN Automation <tnautomation803@gmail.com>**
- [ ] NOT: "me" or "tnautomation803@gmail.com" alone

### Check Email Content
- [ ] Name: Test User
- [ ] Email: test@example.com
- [ ] Phone: +91-9999999999
- [ ] Subject: Test Contact
- [ ] Message: This is a test message from localhost
- [ ] Received at: [Current date & time] IST

### Check Toast Message
- [ ] Frontend shows green/success toast
- [ ] Message: "Message sent successfully"
- [ ] Form fields are cleared

---

## Troubleshooting Local Issues

### Issue: "Failed to send message" Toast
**Check backend logs for:**
```
====== MAIL ERROR ======
Error message: [specific error]
```

**If you see: "invalid login or 535-5.7.8 Username and password not accepted"**
- App password is wrong or expired
- Need to regenerate at: https://myaccount.google.com/apppasswords
- Make sure 2-Step Verification is enabled

### Issue: No Toast Appears
**Check browser console (F12) for:**
- Network errors
- CORS errors
- JavaScript errors

**Solution:**
- Verify backend is running: `curl http://localhost:5000/api/health`
- Check CORS configuration in server.js

### Issue: Form Submits But No Email Received
**Steps:**
1. Check backend logs show "Email sent successfully"
2. Check Gmail Sent folder - email should be there
3. Wait 3-5 seconds and refresh inbox
4. Check Gmail spam folder
5. Verify RECEIVER_EMAIL in .env.local is correct

---

## Using cURL to Test (Advanced)

### Test Email Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+91-9999999999",
    "subject": "Test Subject",
    "message": "Testing email sending"
  }'
```

### Expected Success Response
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

### Expected Error Response (if config missing)
```json
{
  "success": false,
  "message": "Email service is not configured"
}
```

---

## Debug Tips

### Enable Verbose Logging
Add to backend server.js (temporarily):
```javascript
console.log("Environment at startup:");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
console.log("RECEIVER_EMAIL:", process.env.RECEIVER_EMAIL);
```

### Monitor Email Sending in Real-Time
1. Keep backend terminal open and visible
2. Look for lines starting with:
   ```
   Sending contact email...
   Mail options -
   Email sent successfully to:
   ```

### Check Gmail Account Security
1. Go to https://myaccount.google.com/security
2. Look for "Less secure app access" alerts
3. Grant access if prompted
4. Review connected apps for "Node.js app" or similar

---

## Testing Service Request Form

### Steps:
1. Open http://localhost:3000/services
2. Find the "Request Service" section
3. Fill in:
   ```
   Name: Test Service
   Phone: +91-9999999999
   Select Service: [Choose one from dropdown]
   Message: Test service request message
   ```
4. Click submit
5. Verify email is received
6. Check email subject shows: "Service Request: [Service Name]"

---

## After Successful Local Testing

### Before Production:
- [ ] Tested contact form locally - email received
- [ ] Verified sender name is "TN Automation"
- [ ] Verified all email fields are present
- [ ] Tested service request form locally
- [ ] Verified frontend shows success toast
- [ ] Checked backend logs show "Email sent successfully"

### Ready for Production:
- [ ] All environment variables configured in hosting platform
- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Test one email in production domain
- [ ] Monitor logs for first few submissions

---

## Common Testing Scenarios

### Scenario 1: User Submits Valid Contact Form
```
Expected:
✓ Email received in inbox
✓ Frontend shows success toast
✓ Form is cleared
✓ Backend logs show success
```

### Scenario 2: User Submits with Missing Fields
```
Expected:
✓ Frontend validation prevents submission
✓ Or backend returns 400 error with message
✓ Error toast shown to user
```

### Scenario 3: Email Service Misconfigured
```
Expected:
✓ Backend logs show: "MAIL CONFIG ERROR: Missing required environment variables"
✓ Error response to frontend
✓ Frontend shows error toast
✓ Form is not cleared
```

---

## Performance Notes

### Email Sending Time
- **Development**: 0.5-2 seconds
- **Production**: 1-3 seconds
- Gmail may delay delivery, so allow 5 seconds before checking

### Form Submission Time
- Frontend should show "Sending..." button state
- Should complete and show response within 5 seconds
- If takes longer, check backend logs for issues

---

## Next Steps After Local Testing

1. Deploy changes to git repository
2. Deploy backend to hosting platform
3. Deploy frontend to hosting platform
4. Add environment variables to hosting platform
5. Restart services
6. Test in production (see EMAIL_DEPLOYMENT_CHECKLIST.md)

---

**Happy Testing!** 🚀
