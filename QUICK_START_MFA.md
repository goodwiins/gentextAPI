# Quick Start: SMS MFA Testing

## ⚡ 5-Minute Setup

### 1. Start Development Server
```bash
cd frontend
npm run dev
```

### 2. Configure Appwrite Console

#### Enable Phone Authentication
1. Go to [Appwrite Console](https://cloud.appwrite.io)
2. Select your project
3. Navigate to **Auth → Settings**
4. Enable **Phone** authentication method
5. Click **Save**

#### Create Mock Phone Number (FREE Testing)
1. In Appwrite Console: **Auth → Security**
2. Scroll to **Mock phone numbers**
3. Click **Generate number**
4. Save the mock number and OTP code displayed
   - Example: `+1234567890` with OTP `123456`

### 3. Test MFA

#### Open Test Page
Navigate to: `http://localhost:3000/test-mfa`

#### Quick Test Flow
1. **Enter Password:** Your account password
2. **Phone Setup Tab:**
   - Phone: `+1234567890` (your mock number)
   - Click "Send Verification Code"
   - Enter OTP: `123456` (your mock OTP)
   - Click "Verify Phone"
3. **MFA Settings Tab:**
   - Click "Enable SMS MFA"
   - Generate recovery codes (optional)
4. **Test Login:**
   - Go to `/login`
   - Enter email/password
   - Enter OTP when prompted
   - Complete login ✅

---

## 🎯 Testing Options

### Option 1: Mock Numbers (FREE - Recommended)
- **Cost:** $0
- **Setup:** 2 minutes in Appwrite Console
- **Use:** Development, testing, CI/CD
- **How:** Use generated mock number + fixed OTP

### Option 2: Twilio Provider (Real SMS)
Only needed for production testing:

1. Sign up at [twilio.com](https://www.twilio.com)
2. Get credentials:
   - Account SID
   - Auth Token
   - Phone Number
3. Configure in Appwrite Console:
   - **Auth → Settings → Messaging**
   - Create SMS provider (Twilio)
   - Add credentials

---

## 📱 Test Pages

| Page | URL | Purpose |
|------|-----|---------|
| **MFA Test Page** | `/test-mfa` | Complete testing suite |
| **Login Page** | `/login` | Test MFA login flow |
| **Settings** | TBD | Manage MFA settings |

---

## ✅ Quick Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Phone auth enabled in Appwrite
- [ ] Mock number created in Appwrite
- [ ] Test page opens: `/test-mfa`
- [ ] Phone verified with mock number
- [ ] SMS MFA enabled
- [ ] Login with MFA tested

---

## 🐛 Common Issues

**"Phone authentication not enabled"**
→ Enable in Appwrite Console: Auth → Settings → Phone

**"No mock numbers found"**
→ Generate in Appwrite Console: Auth → Security → Mock phone numbers

**"Invalid OTP"**
→ Use the exact OTP shown in Appwrite Console for your mock number

**"Build errors"**
→ Run: `npm install` then `npm run dev`

---

## 📚 Full Documentation

See [SMS_MFA_TESTING_GUIDE.md](./SMS_MFA_TESTING_GUIDE.md) for:
- Complete testing strategies
- Cost optimization
- Twilio setup
- Production deployment
- Troubleshooting

---

## 🎉 You're Ready!

Start testing at: **http://localhost:3000/test-mfa**

**No SMS charges for mock number testing!** ✅
