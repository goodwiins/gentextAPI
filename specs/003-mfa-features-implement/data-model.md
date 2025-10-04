# Data Model: MFA Settings Integration

**Feature**: SMS Multi-Factor Authentication - Settings Page Integration
**Date**: 2025-01-03

## Overview

This document describes the data models and state management for integrating MFA functionality into the settings page. Most entities are managed by Appwrite; this focuses on frontend state and data flow.

## Backend Entities (Appwrite Managed)

### User Account
**Managed By**: Appwrite Authentication System

**Attributes**:
- `$id`: string (unique identifier)
- `email`: string (user email address)
- `name`: string (full name)
- `phone`: string | null (phone number in E.164 format)
- `phoneVerification`: boolean (phone verified status)
- `mfa`: boolean (MFA enabled status)
- `prefs`: Preferences object
  - `FirstName`: string
  - `LastName`: string
  - `avatar`: string (optional)
  - other custom preferences

**Relationships**:
- Has zero or one verified phone number
- Has zero or one active MFA configuration
- Has zero or many recovery codes (when MFA enabled)

**State Transitions**:
```
[No Phone] → [Phone Added] → [Phone Verified] → [MFA Enabled]
                ↓
            [Update Phone] → [Phone Verified]
```

### Phone Verification
**Managed By**: Appwrite via `createPhoneToken()`

**Attributes**:
- `userId`: string (associated user)
- `phoneNumber`: string (E.164 format)
- `secret`: string (6-digit OTP code)
- `expire`: string (ISO timestamp)

**Lifecycle**:
1. Created when `createPhoneToken()` called
2. SMS sent to phone number
3. Validated via `updatePhoneVerification()`
4. Expires after 5-10 minutes

**State Transitions**:
```
[Token Created] → [SMS Sent] → [User Enters OTP] → [Verified]
                                      ↓
                                  [Expired] (after timeout)
```

### MFA Authenticator
**Managed By**: Appwrite via `createMfaAuthenticator()`

**Attributes**:
- `type`: 'phone' | 'totp'
- `verified`: boolean
- `$createdAt`: timestamp

**Lifecycle**:
1. Created when user enables MFA
2. Requires verified phone number
3. Used for login challenges

**State Transitions**:
```
[Not Configured] → [Phone Verified] → [MFA Enabled] → [Active]
```

### MFA Challenge (Login Time)
**Managed By**: Appwrite via `createMfaChallenge()`

**Attributes**:
- `$id`: string (challenge identifier)
- `userId`: string
- `factor`: 'phone' | 'totp'
- `expire`: string (ISO timestamp)

**Lifecycle**:
1. Created during login when MFA required
2. SMS sent to user's verified phone
3. User enters OTP to complete challenge
4. Challenge marked complete or expires

### Recovery Codes
**Managed By**: Appwrite via `createMfaRecoveryCodes()`

**Attributes**:
- `recoveryCodes`: string[] (array of backup codes)
- Each code can be used once

**Lifecycle**:
1. Generated when user requests
2. Displayed once to user
3. User copies or downloads
4. Codes can be used for MFA bypass if phone unavailable
5. Each code consumed after single use

## Frontend State Management

### Settings Page State

**Location**: `frontend/src/pages/setting.tsx`

**State Structure**:
```typescript
// Existing state
const [activeSection, setActiveSection] = useState<SettingsSection>('profile')

// New security section type
type SettingsSection =
  | 'profile'
  | 'notifications'
  | 'appearance'
  | 'language'
  | 'privacy'
  | 'security'  // NEW

// Security-specific state (to be added)
const [securityPassword, setSecurityPassword] = useState<string>('')

// MFA status state (optional - MfaSettings handles internally)
const [mfaStatus, setMfaStatus] = useState({
  enabled: boolean,
  phoneVerified: boolean,
  phone: string | null
})
```

**State Management Pattern**:
- Settings page manages tab navigation
- Child components (PhoneSetup, MfaSettings) manage their own forms
- Password state passed to PhoneSetup as prop
- Success/error callbacks update parent state if needed

### PhoneSetup Component State

**Location**: `frontend/src/components/auth/phone-setup.tsx`

**Internal State**:
```typescript
const [step, setStep] = useState<'phone' | 'verify'>('phone')
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const [userId, setUserId] = useState<string | null>(null)
const [phoneNumber, setPhoneNumber] = useState<string>("")

// React Hook Form state
const phoneForm = useForm<PhoneFormValues>()
const otpForm = useForm<OtpFormValues>()
```

**State Flow**:
1. User enters phone → `phoneForm` validation
2. SMS sent → `step` changes to 'verify', `phoneNumber` stored
3. User enters OTP → `otpForm` validation
4. Verification success → `onSuccess()` callback, `error` cleared
5. Verification error → `error` set, `onError()` callback

### MfaSettings Component State

**Location**: `frontend/src/components/auth/mfa-settings.tsx`

**Internal State**:
```typescript
const [isLoading, setIsLoading] = useState(false)
const [isMfaEnabled, setIsMfaEnabled] = useState(false)
const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
const [showRecoveryCodes, setShowRecoveryCodes] = useState(false)
const [error, setError] = useState<string | null>(null)
const [mfaFactors, setMfaFactors] = useState<any>(null)
```

**State Flow**:
1. Component mounts → `checkMfaStatus()` called
2. MFA factors loaded → `mfaFactors` set, `isMfaEnabled` updated
3. User enables MFA → `createMfaAuthenticator()`, refresh status
4. User generates codes → `recoveryCodes` set, `showRecoveryCodes` true
5. Error occurs → `error` set with message

## Auth Context State

**Location**: `frontend/src/context/auth-context.tsx`

**Auth State Structure**:
```typescript
type AuthState = {
  user: Models.User<Models.Preferences> | null
  session: Models.Session | null
  isLoading: boolean
  error: string | null
}

type AuthContextType = {
  authState: AuthState
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isUserAuthenticated: () => boolean
  clearAuthError: () => void
  refreshAuth: () => Promise<void>
  // MFA methods
  loginWithMFA: (email, password, otp?, challengeId?) => Promise<{...}>
  setupPhoneMFA: (phone: string, password: string) => Promise<void>
  verifyPhone: (userId: string, otp: string) => Promise<void>
  getMfaStatus: () => Promise<any>
  enablePhoneMFA: () => Promise<void>
}
```

**State Relationships**:
- Settings page reads `authState.user` for user data
- Settings page calls `getMfaStatus()` if needed
- PhoneSetup uses `authState.user.$id` for verification
- MfaSettings displays based on `authState.user` MFA status

## Data Flow Diagrams

### Phone Verification Flow (Settings Page)

```
User Action                    Component State                 Appwrite API
-----------                    ---------------                 ------------
Click Security Tab
    ↓
Enter Password              → securityPassword set
    ↓
Enter Phone Number          → PhoneSetup: phoneForm state
    ↓
Click "Send Code"
    ↓                       → isLoading = true
    ↓                                                        → updatePhone(phone, password)
    ↓                                                        ← Phone updated
    ↓                       → userId set
    ↓                                                        → createPhoneToken(phone)
    ↓                                                        ← SMS sent
    ↓                       → step = 'verify'
    ↓                       → isLoading = false
    ↓
Enter OTP Code              → otpForm state
    ↓
Click "Verify"
    ↓                       → isLoading = true
    ↓                                                        → updatePhoneVerification(userId, otp)
    ↓                                                        ← Verified
    ↓                       → onSuccess() callback
    ↓                       → isLoading = false
    ↓
Success Message             → toast.success()
    ↓
MFA Enable Available        → MfaSettings refreshes status
```

### MFA Enrollment Flow (Settings Page)

```
User Action                    Component State                 Appwrite API
-----------                    ---------------                 ------------
Phone Verified (prerequisite)
    ↓
Click "Enable SMS MFA"
    ↓                       → isLoading = true
    ↓                                                        → createMfaAuthenticator('phone')
    ↓                                                        ← MFA enabled
    ↓                       → isMfaEnabled = true
    ↓                       → isLoading = false
    ↓
Success Message             → toast.success()
    ↓
Status Updates              → MfaSettings: checkMfaStatus()
    ↓                                                        → listMfaFactors()
    ↓                                                        ← {phone: true}
    ↓                       → mfaFactors set
    ↓                       → Badge shows "Active"
```

### Recovery Codes Generation Flow

```
User Action                    Component State                 Appwrite API
-----------                    ---------------                 ------------
Click "Generate Recovery Codes"
    ↓                       → isLoading = true
    ↓                                                        → createMfaRecoveryCodes()
    ↓                                                        ← {recoveryCodes: [...]}
    ↓                       → recoveryCodes set
    ↓                       → showRecoveryCodes = true
    ↓                       → isLoading = false
    ↓
View Codes                  → Display codes with copy/download
    ↓
Click "Copy Codes"          → navigator.clipboard.writeText()
    ↓
Success Message             → toast.success()
```

## Validation Rules

### Phone Number
- **Format**: E.164 international format
- **Pattern**: `/^\+[1-9]\d{1,14}$/`
- **Example**: `+15551234567`
- **Validation**: Zod schema in PhoneSetup component
- **Error**: "Phone must be in E.164 format (e.g., +1234567890)"

### OTP Code
- **Format**: 6-digit numeric string
- **Pattern**: `/^\d{6}$/`
- **Example**: `123456`
- **Validation**: Zod schema in PhoneSetup component
- **Error**: "OTP must be 6 digits"

### Password (for phone verification)
- **Format**: User's current account password
- **Validation**: Required by Appwrite SDK
- **Error**: Handled by Appwrite (invalid password)

## Data Persistence

### Persistent Data (Appwrite)
- User phone number
- Phone verification status
- MFA enabled status
- Recovery codes (hashed)

### Transient Data (Component State)
- Password input (cleared after use)
- OTP input (cleared after verification)
- Loading states
- Error messages
- Form validation state

### Local Storage
- None required for MFA (Appwrite manages sessions)

## Error States

### Phone Verification Errors
- Invalid phone format
- Invalid password
- Phone already in use
- SMS delivery failure
- Invalid OTP code
- Expired OTP code
- Network errors

### MFA Errors
- MFA already enabled
- Phone not verified
- Network errors
- Appwrite API errors

### Recovery Code Errors
- MFA not enabled
- Generation failure
- Network errors

**Error Handling Strategy**:
- All errors caught in try-catch blocks
- Error messages displayed via toast notifications
- Component error state set for inline display
- User can retry failed operations

## Data Security

### Sensitive Data Handling
- **Password**: Never stored, only passed to Appwrite API
- **OTP Codes**: Cleared from state after verification
- **Recovery Codes**: Displayed once, user responsible for storage
- **Phone Number**: Stored encrypted by Appwrite

### Data Transmission
- All API calls over HTTPS
- Appwrite SDK handles encryption
- No sensitive data in URLs or logs

### State Management Security
- Password not logged
- OTP not logged
- Recovery codes not logged
- Error messages sanitized

## Summary

**Key Points**:
1. Most data managed by Appwrite (no custom backend needed)
2. Frontend state minimal (forms, loading, errors)
3. Settings page orchestrates child components
4. Child components handle their own complex state
5. Clear data flow with callbacks
6. Proper validation at each step
7. Secure handling of sensitive data
