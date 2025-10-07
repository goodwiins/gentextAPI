# Quickstart: MFA Settings Integration Test

**Feature**: SMS Multi-Factor Authentication - Settings Page Integration
**Date**: 2025-01-03
**Purpose**: Validate MFA settings page integration with complete user flow

## Prerequisites

✅ **Before Running This Quickstart**:
1. Development server running (`npm run dev` in frontend/)
2. Appwrite project configured with phone authentication enabled
3. Mock phone numbers configured in Appwrite Console (for free testing)
4. User account created and can login
5. Settings page integration complete (after implementation)

## Test Environment Setup

### 1. Configure Mock Phone Number (FREE Testing)

```bash
# In Appwrite Console:
# 1. Navigate to your project
# 2. Go to Auth → Security
# 3. Click "Generate number" in Mock phone numbers section
# 4. Note the mock number and OTP code
# Example: +1234567890 with OTP 123456
```

### 2. Start Development Server

```bash
cd frontend
npm run dev
# Server starts at http://localhost:3000
```

### 3. Login to Application

1. Open browser to `http://localhost:3000/login`
2. Login with existing credentials
3. Should redirect to homepage

## User Story Validation

### Story: Enable MFA from Settings Page

**As a user**, I want to enable SMS-based two-factor authentication from my settings page, so that my account has additional security.

---

## Test Flow

### Step 1: Navigate to Settings

**Action**:
1. Click user menu or navigate to settings
2. Go to `http://localhost:3000/setting`

**Expected Result**:
- ✅ Settings page loads successfully
- ✅ Multiple tabs visible (Profile, Notifications, Appearance, Language, Privacy, **Security**)
- ✅ Default tab (Profile) is active

**Validation**:
```typescript
// Check settings page loads
assert(document.title.includes('Settings'))

// Check Security tab exists
const securityTab = document.querySelector('[value="security"]')
assert(securityTab !== null)
```

---

### Step 2: Open Security Tab

**Action**:
1. Click the "Security" tab

**Expected Result**:
- ✅ Security tab activates
- ✅ Security content displays
- ✅ Phone verification card visible
- ✅ MFA settings card visible

**Validation**:
```typescript
// Check Security tab is active
const activeTab = document.querySelector('[data-state="active"]')
assert(activeTab.textContent.includes('Security'))

// Check phone setup component visible
const phoneSetup = document.querySelector('[class*="phone-setup"]')
assert(phoneSetup !== null)
```

---

### Step 3: Add Phone Number

**Action**:
1. In "Phone Verification" card
2. Enter phone number: `+1234567890` (mock number)
3. Enter your account password
4. Click "Send Verification Code"

**Expected Result**:
- ✅ Loading indicator shows
- ✅ "Verification code sent" toast notification
- ✅ OTP input field appears
- ✅ Message shows "Code sent to +1234567890"

**Validation**:
```typescript
// Check phone form submitted
const phoneInput = document.querySelector('input[type="tel"]')
assert(phoneInput.value === '+1234567890')

// Check OTP input appears
await waitFor(() => {
  const otpInput = document.querySelector('input[maxlength="6"]')
  assert(otpInput !== null)
})

// Check success toast
assert(document.body.textContent.includes('Verification code sent'))
```

---

### Step 4: Verify Phone

**Action**:
1. Enter OTP code: `123456` (mock OTP from Appwrite Console)
2. Click "Verify Phone"

**Expected Result**:
- ✅ Loading indicator shows
- ✅ "Phone verified successfully!" toast notification
- ✅ Phone verification card updates or hides
- ✅ MFA settings card becomes active/available

**Validation**:
```typescript
// Check OTP entered
const otpInput = document.querySelector('input[maxlength="6"]')
assert(otpInput.value === '123456')

// Check verification success
await waitFor(() => {
  assert(document.body.textContent.includes('Phone verified'))
})

// Check MFA settings available
const mfaSettings = document.querySelector('[class*="mfa-settings"]')
assert(mfaSettings !== null)
```

---

### Step 5: Enable SMS MFA

**Action**:
1. In "Two-Factor Authentication" card
2. Verify MFA status shows "Disabled" or "Inactive"
3. Click "Enable SMS MFA" button

**Expected Result**:
- ✅ Loading indicator shows
- ✅ "SMS MFA enabled successfully!" toast notification
- ✅ MFA status badge changes to "Active" or "Enabled"
- ✅ Recovery codes option becomes available

**Validation**:
```typescript
// Check enable button clicked
const enableButton = document.querySelector('button:contains("Enable")')
assert(enableButton !== null)

// Check MFA enabled
await waitFor(() => {
  const statusBadge = document.querySelector('[class*="badge"]')
  assert(statusBadge.textContent.includes('Active') ||
         statusBadge.textContent.includes('Enabled'))
})

// Check success toast
assert(document.body.textContent.includes('MFA enabled'))
```

---

### Step 6: Generate Recovery Codes

**Action**:
1. In "Recovery Codes" card
2. Click "Generate Recovery Codes" button
3. Review displayed codes
4. Click "Copy Codes" button

**Expected Result**:
- ✅ Loading indicator shows
- ✅ Recovery codes generated and displayed (8-10 codes)
- ✅ Each code is unique alphanumeric string
- ✅ Warning message about storing codes securely
- ✅ "Recovery codes copied to clipboard!" toast notification
- ✅ Download button available

**Validation**:
```typescript
// Check recovery codes displayed
await waitFor(() => {
  const codes = document.querySelectorAll('[class*="recovery-code"]')
  assert(codes.length >= 8)
})

// Check copy functionality
const copyButton = document.querySelector('button:contains("Copy")')
assert(copyButton !== null)

// Check warning message
assert(document.body.textContent.includes('secure place'))
```

---

### Step 7: Verify MFA Status Persistence

**Action**:
1. Switch to "Profile" tab
2. Switch back to "Security" tab

**Expected Result**:
- ✅ Security tab loads quickly
- ✅ MFA status still shows "Active"
- ✅ Phone number still verified
- ✅ No data loss or reset

**Validation**:
```typescript
// Switch tabs
const profileTab = document.querySelector('[value="profile"]')
profileTab.click()

await wait(100)

const securityTab = document.querySelector('[value="security"]')
securityTab.click()

// Check state persisted
await waitFor(() => {
  const statusBadge = document.querySelector('[class*="badge"]')
  assert(statusBadge.textContent.includes('Active'))
})
```

---

### Step 8: Test MFA Login Flow

**Action**:
1. Logout from application
2. Return to login page
3. Enter email and password
4. Click "Continue"

**Expected Result**:
- ✅ Password accepted
- ✅ OTP input screen appears
- ✅ "Verification code sent to your phone!" message
- ✅ 6-digit OTP input field visible
- ✅ "Back to Login" button available

**Validation**:
```typescript
// Check redirect to OTP screen
await waitFor(() => {
  const otpInput = document.querySelector('input[maxlength="6"]')
  assert(otpInput !== null)
})

// Check message
assert(document.body.textContent.includes('Verification code sent'))
```

---

### Step 9: Complete MFA Login

**Action**:
1. Check phone for SMS (or use mock OTP: `123456`)
2. Enter 6-digit OTP code
3. Click "Verify & Sign In"

**Expected Result**:
- ✅ Loading indicator shows
- ✅ "Successfully logged in with MFA!" toast notification
- ✅ Redirects to homepage/dashboard
- ✅ User is fully authenticated

**Validation**:
```typescript
// Enter OTP
const otpInput = document.querySelector('input[maxlength="6"]')
otpInput.value = '123456'

// Submit
const submitButton = document.querySelector('button[type="submit"]')
submitButton.click()

// Check success
await waitFor(() => {
  assert(window.location.pathname === '/')
  assert(document.body.textContent.includes('logged in'))
})
```

---

## Edge Case Testing

### Test 1: Wrong OTP Code

**Action**:
1. Navigate to Security tab
2. Try to verify phone with wrong OTP: `000000`

**Expected Result**:
- ✅ Error toast: "Invalid verification code"
- ✅ OTP input still available
- ✅ Can retry with correct code

---

### Test 2: Phone Already Verified

**Action**:
1. With phone already verified
2. Try to add same phone again

**Expected Result**:
- ✅ Error message: "Phone number already verified"
- ✅ Or: Phone setup component shows verified status
- ✅ Can proceed to enable MFA

---

### Test 3: MFA Already Enabled

**Action**:
1. With MFA already enabled
2. View Security tab

**Expected Result**:
- ✅ Status badge shows "Active"
- ✅ "Enable MFA" button not visible
- ✅ Recovery codes option available
- ✅ Clear indication MFA is active

---

### Test 4: Resend Verification Code

**Action**:
1. During phone verification
2. Click "Resend Code" button

**Expected Result**:
- ✅ New SMS sent (or mock code remains same)
- ✅ Toast: "Verification code resent!"
- ✅ Previous OTP invalidated
- ✅ Can verify with new code

---

### Test 5: Mobile Viewport

**Action**:
1. Resize browser to mobile width (375px)
2. Navigate to Security tab
3. Complete phone setup

**Expected Result**:
- ✅ Layout responsive and usable
- ✅ Forms don't overflow
- ✅ Buttons accessible
- ✅ All functionality works

---

## Success Criteria

### ✅ All Steps Pass If:

1. **Navigation**: Security tab accessible from settings
2. **Phone Setup**: Phone number can be added and verified via SMS
3. **MFA Enable**: SMS MFA can be enabled after phone verification
4. **Recovery Codes**: Recovery codes can be generated, copied, and downloaded
5. **Persistence**: MFA status persists across tab switches
6. **Login Flow**: MFA-enabled accounts require OTP at login
7. **Error Handling**: Clear error messages for all failure scenarios
8. **Responsive**: Works on desktop and mobile viewports
9. **Performance**: All operations complete within reasonable time (<5s)
10. **Security**: No password or OTP leakage in console/network logs

### ❌ Fails If:

- Security tab not accessible
- Phone verification fails with valid inputs
- MFA cannot be enabled
- Recovery codes not generated
- State lost on navigation
- Login works without OTP when MFA enabled
- Errors are unclear or unhelpful
- UI breaks on mobile
- Performance is poor (>10s for operations)
- Security issues present

---

## Cleanup (Optional)

### Disable MFA for Next Test

1. In Appwrite Console
2. Navigate to Auth → Users
3. Find test user
4. Manually disable MFA
5. Or: Implement disable MFA functionality

---

## Test Automation Script

```typescript
// Pseudocode for automated test
describe('MFA Settings Integration', () => {
  it('completes full MFA setup flow', async () => {
    // Setup
    await login(testUser)
    await navigateTo('/setting')

    // Test
    await clickTab('security')
    await addPhone('+1234567890', testPassword)
    await verifyPhone('123456')
    await enableMFA()
    await generateRecoveryCodes()
    await logout()
    await loginWithMFA(testUser, '123456')

    // Verify
    expect(currentPage).toBe('/')
    expect(isAuthenticated()).toBe(true)
  })
})
```

---

## Performance Benchmarks

**Target Times**:
- Settings page load: < 1s
- Tab switch: < 100ms
- Phone verification SMS: < 30s
- MFA enable: < 1s
- Recovery codes generation: < 1s
- Settings → Security navigation: < 200ms

**Measure With**:
```javascript
// Browser console
performance.mark('start')
// ... perform action ...
performance.mark('end')
performance.measure('action', 'start', 'end')
console.table(performance.getEntriesByType('measure'))
```

---

## Troubleshooting

### Issue: Security Tab Not Visible
**Check**: Implementation complete, SettingsSection type updated
**Fix**: Complete Step T001-T002 from tasks.md

### Issue: Phone Verification Fails
**Check**: Password correct, mock number configured
**Fix**: Verify password, check Appwrite Console mock numbers

### Issue: SMS Not Received (Real Phone)
**Check**: Twilio configured, phone in E.164 format
**Fix**: Use mock numbers for testing, verify Twilio setup

### Issue: MFA Enable Fails
**Check**: Phone verified first, Appwrite phone auth enabled
**Fix**: Complete phone verification, enable in Appwrite Console

---

## Success Confirmation

**All Tests Pass** ✅

You have successfully:
1. ✅ Integrated MFA management into settings page
2. ✅ Enabled phone verification from settings
3. ✅ Enabled SMS MFA from settings
4. ✅ Generated recovery codes from settings
5. ✅ Verified complete MFA login flow
6. ✅ Maintained responsive design
7. ✅ Preserved existing settings functionality

**Ready for**: Production deployment (after Twilio configuration)

---

**Estimated Test Duration**: 15-20 minutes
**Complexity**: Medium
**Automation Potential**: High (90% automatable)
