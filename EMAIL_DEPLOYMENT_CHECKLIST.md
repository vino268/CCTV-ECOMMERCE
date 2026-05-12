# Email Sending - Production Deployment Checklist

## Overview
This document provides a step-by-step guide to ensure the contact form email sending works correctly in production deployment.

---

## 1. Local Development Testing

### Test Environment Setup
- [ ] Ensure `.env.local` has email credentials:
  ```
  EMAIL_USER=tnautomation803@gmail.com
  EMAIL_PASS=hagh zjce nlud htxp
  RECEIVER_EMAIL=tnautomation803@gmail.com
  NEXT_PUBLIC_API_URL=http://localhost:5000
  ```

### Test Locally
1. [ ] Start the development server: `npm run dev`
2. [ ] Start the backend server: `node server.js`
3. [ ] Navigate to http://localhost:3000/contact
4. [ ] Submit the contact form with test data:
   - Name: Test User
   - Email: test@example.com
   - Phone: +91-XXXXXXXXXX
   - Subject: Test Email
   - Message: This is a test message
5. [ ] Check console output for debug logs:
   ```
   ====== EMAIL SERVICE DEBUG ======
   EMAIL_USER: tnautomation803@gmail.com
   EMAIL_PASS EXISTS: true
   RECEIVER_EMAIL: tnautomation803@gmail.com
   NODE_ENV: development
   ================================
   Sending contact email...
   Mail options - From: "TN Automation" <tnautomation803@gmail.com>
   Mail options - To: tnautomation803@gmail.com
   Email sent successfully to: tnautomation803@gmail.com
   ```
6. [ ] Verify email received in Gmail inbox
7. [ ] Verify sender name shows as "TN Automation" (not "me")
8. [ ] Verify email includes Date & Time field
9. [ ] Verify frontend shows success toast: "Message sent successfully"

---

## 2. Gmail Configuration

### Gmail Setup Requirements
- [ ] Gmail account: tnautomation803@gmail.com
- [ ] 2-Step Verification is **ENABLED**
- [ ] App Password is generated (not regular password)

### Generate Gmail App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select: Mail & Windows Mail
3. Select: Windows Computer (or appropriate device)
4. [ ] Generate and copy the 16-character app password
5. [ ] Use this password in `EMAIL_PASS` environment variable

### Important
- **DO NOT** use your regular Gmail password
- **DO NOT** hardcode credentials in code
- Only use `process.env.EMAIL_USER` and `process.env.EMAIL_PASS`

---

## 3. Environment Variables Configuration

### Required Environment Variables
```
EMAIL_USER=tnautomation803@gmail.com
EMAIL_PASS=your_16_char_app_password
RECEIVER_EMAIL=tnautomation803@gmail.com
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_API_URL=https://tnautomation.in (or your production domain)
```

### Hosting Platform Setup (Render.com Example)

#### For Next.js Frontend
1. [ ] Go to Render Dashboard > Environment
2. [ ] Add/Update environment variables:
   - `NEXT_PUBLIC_API_URL`: https://your-backend-url.render.com (or your Express backend URL)

#### For Express Backend
1. [ ] Go to Render Dashboard > Environment
2. [ ] Add/Update environment variables:
   ```
   EMAIL_USER=tnautomation803@gmail.com
   EMAIL_PASS=your_16_char_app_password
   RECEIVER_EMAIL=tnautomation803@gmail.com
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```

### Important Notes
- **DO NOT** hardcode email credentials in code
- Use only environment variables
- Double-check app password is copied correctly (16 characters)
- Do not include spaces when setting environment variables

---

## 4. Backend Configuration

### CORS Configuration
- [ ] Verify `server.js` includes all required origins:
  ```javascript
  app.use(cors({
    origin: [
      "http://localhost:3000",
      "https://tnautomation.in",
      "https://www.tnautomation.in",
      "https://cctv-ecommerce.onrender.com"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  ```

### Express Middleware
- [ ] `require("dotenv").config()` is at the top of server.js
- [ ] `cors()` middleware is configured before route handlers
- [ ] `express.json()` middleware is configured

---

## 5. Frontend Configuration

### Next.js API Route
- [ ] Verify `/app/api/send-email/route.js` exists
- [ ] Verify environment variables are accessed via `process.env`
- [ ] Contact form sends data with:
  - `name` (required)
  - `email` (required)
  - `phone` (optional)
  - `subject` (optional)
  - `message` (required)

### Contact Form Component
- [ ] Uses `buildApiUrl('/api/send-email')` to call email endpoint
- [ ] Shows success toast on successful submission
- [ ] Shows error toast on failed submission
- [ ] Clears form after successful submission
- [ ] Submitting button shows "Sending..." state

---

## 6. Production Deployment

### Pre-Deployment Checklist
- [ ] All environment variables are set in hosting platform
- [ ] Email credentials are verified in `.env.production`
- [ ] CORS origins include production domain
- [ ] Backend is deployed and running
- [ ] Frontend is deployed and running
- [ ] Test database connection with health endpoint

### Deployment Steps
1. [ ] Push changes to git repository
2. [ ] Backend deployment (if applicable):
   - Redeploy Express backend on Render
   - Restart the service
   - Verify backend health: https://your-backend-url/api/health
3. [ ] Frontend deployment (if applicable):
   - Redeploy Next.js frontend on Render
   - Verify frontend loads: https://tnautomation.in
4. [ ] Wait 2-3 minutes for services to stabilize

---

## 7. Production Testing

### Test Contact Form in Production
1. [ ] Open https://tnautomation.in/contact
2. [ ] Submit a test form:
   - Name: Test Production User
   - Email: your-test-email@gmail.com
   - Phone: +91-XXXXXXXXXX
   - Subject: Production Test
   - Message: Testing email in production
3. [ ] Verify frontend shows success toast
4. [ ] Check email inbox (tnautomation803@gmail.com or RECEIVER_EMAIL)
5. [ ] Verify email received within 2-5 seconds
6. [ ] Verify sender shows: **TN Automation** (not "me")
7. [ ] Verify email includes all fields:
   - Name
   - Email
   - Phone
   - Subject
   - Message
   - Date & Time with IST timezone

### Test Service Request Form (if applicable)
1. [ ] Open https://tnautomation.in/services
2. [ ] Submit a service request form
3. [ ] Verify email received successfully

---

## 8. Debugging Production Issues

### Check Production Logs
1. [ ] Backend logs on Render:
   - Go to Service > Logs
   - Look for debug output:
     ```
     ====== EMAIL SERVICE DEBUG ======
     EMAIL_USER: tnautomation803@gmail.com
     EMAIL_PASS EXISTS: true
     RECEIVER_EMAIL: tnautomation803@gmail.com
     NODE_ENV: production
     ================================
     ```

### Common Issues & Solutions

#### Issue: "Email service is not configured"
**Solution:**
- [ ] Verify EMAIL_USER is set in environment
- [ ] Verify EMAIL_PASS is set in environment
- [ ] Verify RECEIVER_EMAIL is set in environment
- [ ] Restart the service after adding environment variables
- [ ] Check logs for: `MAIL CONFIG ERROR: Missing required environment variables`

#### Issue: "Failed to send message" (Gmail Authentication Error)
**Solution:**
- [ ] Verify app password is correct (16 characters)
- [ ] Verify Gmail account has 2-Step Verification enabled
- [ ] Check logs for: `Error message: invalid login or 535-5.7.8 Username and password not accepted`
- [ ] Regenerate Gmail app password if password expired

#### Issue: CORS Error in Console
**Solution:**
- [ ] Add production domain to CORS origins in server.js
- [ ] Restart backend service
- [ ] Verify domain matches exactly (https://tnautomation.in vs http://tnautomation.in)

#### Issue: Sender Name Shows "me" Instead of "TN Automation"
**Solution:**
- [ ] Verify `from` field in send-email route:
  ```javascript
  from: `"TN Automation" <${process.env.EMAIL_USER}>`
  ```
- [ ] Restart service if recently changed
- [ ] Clear Gmail cache and refresh

---

## 9. Monitoring & Maintenance

### Regular Checks
- [ ] Weekly: Verify emails are being received
- [ ] Monthly: Check backend logs for errors
- [ ] Monthly: Verify Gmail app password is still valid
- [ ] Quarterly: Update dependencies (npm audit, npm update)

### Email Delivery Monitoring
- [ ] Set up email forwarding to monitor recipient inbox
- [ ] Create alerts for failed form submissions
- [ ] Monitor backend error logs for email failures

---

## 10. Documentation References

### Files Modified
- `/app/api/send-email/route.js` - Email sending endpoint
- `/app/contact/page.tsx` - Contact form component
- `/app/services/page.tsx` - Service request component
- `/server.js` - Express backend configuration
- `.env.local` - Local development environment
- `.env.production` - Production environment

### Key Environment Variables
- `EMAIL_USER` - Gmail account email
- `EMAIL_PASS` - Gmail app password (not regular password)
- `RECEIVER_EMAIL` - Where emails are sent to
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - JWT token secret

---

## 11. Quick Reference: Debug Commands

### Check if email service is running
```bash
curl https://tnautomation.in/api/health
```

### Test email endpoint locally
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+91-9999999999",
    "subject": "Test Subject",
    "message": "Test message"
  }'
```

### Check environment variables in production
- Backend logs will show on startup:
  ```
  EMAIL_USER Exists: true
  EMAIL_PASS EXISTS: true
  ```

---

## 12. Support & Troubleshooting

### Contact Support
- For Gmail issues: Visit https://support.google.com/accounts
- For Render deployment issues: Check Render documentation
- For code issues: Review error logs in backend

### Before Contacting Support
- [ ] Verify all environment variables are set
- [ ] Check backend logs for error messages
- [ ] Test with correct email format
- [ ] Verify app password is 16 characters
- [ ] Ensure Gmail account has 2-Step Verification enabled

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-12 | 1.0 | Initial deployment checklist created |
| | | Added debug logging configuration |
| | | Added production testing procedures |
| | | Added troubleshooting guide |

---

**Last Updated:** May 12, 2026  
**Status:** Ready for Production
