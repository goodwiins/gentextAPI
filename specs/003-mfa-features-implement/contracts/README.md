# API Contracts

No new API contracts needed for this feature.

All MFA functionality uses existing Appwrite SDK methods:
- account.updatePhone()
- account.createPhoneToken()
- account.updatePhoneVerification()
- account.createMfaAuthenticator()
- account.listMfaFactors()
- account.createMfaChallenge()
- account.updateMfaChallenge()
- account.createMfaRecoveryCodes()

See data-model.md for API details.
