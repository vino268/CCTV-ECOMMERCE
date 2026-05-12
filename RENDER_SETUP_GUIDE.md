# Render Hosting - Environment Variables Setup

## Render Dashboard Steps

### For Express Backend (Node.js Service)

#### Location:
1. Go to Render Dashboard: https://dashboard.render.com
2. Select your backend service
3. Go to **Settings** tab
4. Scroll to **Environment** section

#### Add Environment Variables:
Add each variable exactly as shown:

```
EMAIL_USER
tnautomation803@gmail.com

EMAIL_PASS
hagh zjce nlud htxp

RECEIVER_EMAIL
tnautomation803@gmail.com

MONGODB_URI
mongodb+srv://vinothelango2110_db_user:Vinoth2026@vinoth.g6th8dt.mongodb.net/tn_automation?retryWrites=true&w=majority&appName=Vinoth

JWT_SECRET
vinoth_secret_key

NODE_ENV
production
```

#### After Adding Variables:
1. Click **Save**
2. Service will automatically redeploy
3. Wait 2-3 minutes for redeployment to complete
4. Check logs for: `====== EMAIL SERVICE DEBUG ======`

---

### For Next.js Frontend (Static Site or Node.js)

#### Location:
1. Go to Render Dashboard
2. Select your frontend service
3. Go to **Settings** tab
4. Scroll to **Environment** section

#### Add Environment Variables:
```
NEXT_PUBLIC_API_URL
https://your-backend-url.render.com

(Or replace with actual backend URL if not on Render)
```

#### After Adding Variables:
1. Click **Save**
2. Service will automatically redeploy
3. Wait 1-2 minutes for redeployment

---

## Verification Checklist

### After Deployment:

- [ ] Backend service shows "live" status (green)
- [ ] Frontend service shows "live" status (green)
- [ ] Backend logs show startup debug output:
  ```
  ====== EMAIL SERVICE DEBUG ======
  EMAIL_USER: tnautomation803@gmail.com
  EMAIL_PASS EXISTS: true
  RECEIVER_EMAIL: tnautomation803@gmail.com
  NODE_ENV: production
  ================================
  ```

### Test Production Email:

1. Open https://tnautomation.in/contact
2. Submit test form
3. Check logs in Render dashboard for:
   ```
   Sending contact email...
   Email sent successfully to: tnautomation803@gmail.com
   ```
4. Verify email received in inbox
5. Check sender displays as "TN Automation"

---

## Important Notes

### Do NOT Use Quotes in Environment Variables
**Wrong:**
```
EMAIL_USER
"tnautomation803@gmail.com"
```

**Correct:**
```
EMAIL_USER
tnautomation803@gmail.com
```

### Preserve Exact Spacing in App Password
Gmail app passwords have specific formatting:
```
EMAIL_PASS
hagh zjce nlud htxp
```
- Keep the spaces exactly as provided
- Don't remove or add spaces
- Copy from Google account settings

### Re-deployment After Env Changes
- Render automatically redeploys after environment changes
- Wait 2-3 minutes for backend
- Wait 1-2 minutes for frontend
- Service must show "live" status before testing

---

## Common Render Issues

### Issue: Environment Variables Not Applied
**Solution:**
1. Verify variables are saved (click Save button)
2. Check "Recent Deploys" shows new deployment in progress
3. Wait full 2-3 minutes for backend to redeploy
4. Refresh dashboard if still showing "Building"

### Issue: Backend Service in "Build Failed" Status
**Check logs for:**
1. Missing dependencies (run `npm install`)
2. Syntax errors in code
3. Environment variable issues

### Issue: "Failed to send message" After Deployment
**Debug steps:**
1. Check backend logs in Render: Logs tab
2. Look for: `MAIL CONFIG ERROR: Missing required environment variables`
3. Verify all email environment variables are added
4. Click "Manual Deploy" if variables were just added
5. Wait for redeployment to complete

---

## Viewing Logs in Render

### To Check Email Sending Logs:

1. Go to Render Dashboard
2. Select backend service
3. Click **Logs** tab
4. Filter by typing: "EMAIL SERVICE" or "Email sent successfully"
5. Watch in real-time as emails are sent

### Expected Log Output:
```
====== EMAIL SERVICE DEBUG ======
EMAIL_USER: tnautomation803@gmail.com
EMAIL_PASS EXISTS: true
RECEIVER_EMAIL: tnautomation803@gmail.com
NODE_ENV: production
================================
Sending contact email...
Mail options - From: "TN Automation" <tnautomation803@gmail.com>
Mail options - To: tnautomation803@gmail.com
Mail options - Subject: Contact Enquiry: Test Subject
Email sent successfully to: tnautomation803@gmail.com
```

---

## Quick Troubleshooting on Render

### Step 1: Verify Environment Variables
```
Settings > Environment section
Confirm all EMAIL_* variables are present
```

### Step 2: Check Deployment Status
```
Dashboard > Recent Deploys
Verify both backend and frontend show "Live"
```

### Step 3: Monitor Logs
```
Logs tab > Watch in real-time
Submit test form and look for debug output
```

### Step 4: Manual Redeploy (if needed)
```
Dashboard > Manual Deploy button
Wait 2-3 minutes for redeployment
```

---

## After Everything is Set Up

1. ✅ Environment variables added to Render
2. ✅ Services redeployed and showing "Live"
3. ✅ Test form submitted from https://tnautomation.in/contact
4. ✅ Email received with "TN Automation" sender
5. ✅ Logs show successful email sending

**Status**: Production deployment complete! 🎉

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Render Environment Variables**: https://render.com/docs/environment-variables
- **Monitor Service Logs**: https://render.com/docs/monitoring

---

**Last Updated**: May 12, 2026
