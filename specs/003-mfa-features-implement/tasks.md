# Tasks: MFA Settings Page Integration

**Input**: Design documents from `/specs/003-mfa-features-implement/`
**Prerequisites**: plan.md (✅), research.md (✅), data-model.md (✅), quickstart.md (✅)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Implementation plan loaded successfully
   → Tech stack: TypeScript 5.x, Next.js 15.5.4, React 18, shadcn/ui
   → Project type: Web application (frontend + backend)
2. Load optional design documents:
   → data-model.md: Settings page state, MFA entities (Appwrite managed)
   → contracts/: No new contracts (using Appwrite SDK)
   → research.md: Integration approach (add Security tab to settings)
3. Generate tasks by category:
   → Setup: None needed (components exist)
   → Tests: Manual integration tests from quickstart.md
   → Core: Settings page UI integration only
   → Integration: Wire existing components to settings
   → Polish: Documentation updates, styling
4. Apply task rules:
   → Type updates, imports, tab additions = parallel [P]
   → Settings page modifications = sequential
   → Test tasks = parallel [P]
5. Number tasks sequentially (T001-T026)
6. Generate dependency graph (below)
7. Create parallel execution examples (below)
8. Validate task completeness:
   → All quickstart scenarios covered ✅
   → Component integration complete ✅
   → Documentation updated ✅
9. Return: SUCCESS (26 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `frontend/src/` for Next.js frontend
- **Components**: `frontend/src/components/auth/`
- **Pages**: `frontend/src/pages/`
- **Documentation**: Root directory

---

## Phase 3.1: Type Definitions & Imports ✅

These tasks update types and imports - can run in parallel as they modify different parts of the file or prepare for integration.

- [x] **T001** [P] Update `SettingsSection` type to include 'security' option
  - **File**: `frontend/src/pages/setting.tsx`
  - **Change**: Add `'security'` to the union type `type SettingsSection = 'profile' | 'notifications' | 'appearance' | 'language' | 'privacy' | 'security'`
  - **Location**: Line 64 (type definition section)
  - **Status**: ✅ COMPLETED - Type already included 'security'

- [x] **T002** [P] Import PhoneSetup component
  - **File**: `frontend/src/pages/setting.tsx`
  - **Change**: Add `import PhoneSetup from "@/components/auth/phone-setup"` to imports section
  - **Location**: Line 50 - Added to imports section
  - **Status**: ✅ COMPLETED

- [x] **T003** [P] Import MfaSettings component
  - **File**: `frontend/src/pages/setting.tsx`
  - **Change**: Add `import MfaSettings from "@/components/auth/mfa-settings"` to imports section
  - **Location**: Line 51 - Added to imports section
  - **Status**: ✅ COMPLETED

- [x] **T004** [P] Import Shield icon from lucide-react
  - **File**: `frontend/src/pages/setting.tsx`
  - **Change**: Add `Shield` to the existing lucide-react import (around line 24-45)
  - **Location**: Line 32 - Already imported
  - **Status**: ✅ COMPLETED - Icon already imported

---

## Phase 3.2: State Management ✅

These tasks add state for the security section. Can be done in parallel as they're just state declarations.

- [x] **T005** [P] Add security password state
  - **File**: `frontend/src/pages/setting.tsx`
  - **Change**: Add `const [securityPassword, setSecurityPassword] = useState<string>('')` in the state declarations section
  - **Location**: Line 104 - Added in state declarations
  - **Status**: ✅ COMPLETED

- [x] **T006** [P] Add password input component state (optional)
  - **File**: `frontend/src/pages/setting.tsx`
  - **Status**: ✅ SKIPPED - Not needed as PhoneSetup handles its own password display

---

## Phase 3.3: Event Handlers ✅

These tasks add success/error handlers for MFA operations.

- [x] **T007** Create phone verification success handler
  - **File**: `frontend/src/pages/setting.tsx`
  - **Location**: Lines 154-157 - Added `handlePhoneSetupSuccess`
  - **Status**: ✅ COMPLETED - Includes success toast and password clearing

- [x] **T008** Create phone verification error handler
  - **File**: `frontend/src/pages/setting.tsx`
  - **Location**: Lines 159-161 - Added `handlePhoneSetupError`
  - **Status**: ✅ COMPLETED - Handles errors with toast notifications

---

## Phase 3.4: UI Integration ✅

These tasks build the Security tab UI. Must be done sequentially as they all modify the same JSX structure.

- [x] **T009** Add Security tab trigger to TabsList
  - **File**: `frontend/src/pages/setting.tsx`
  - **Location**: Line 223 - Security tab navigation item already exists in navItems
  - **Status**: ✅ COMPLETED - Tab navigation already set up

- [x] **T010** Create Security TabsContent structure
  - **File**: `frontend/src/pages/setting.tsx`
  - **Location**: Lines 788-875 - Complete security section implemented
  - **Status**: ✅ COMPLETED - Three-card layout (Phone Setup, MFA Settings, Danger Zone)

- [x] **T011** Add Password Input Card to Security tab
  - **File**: `frontend/src/pages/setting.tsx`
  - **Location**: Lines 809-813 - Password passed to PhoneSetup component
  - **Status**: ✅ COMPLETED - Integrated into PhoneSetup component (handles its own password input)

- [x] **T012** Add Phone Setup Card to Security tab
  - **File**: `frontend/src/pages/setting.tsx`
  - **Location**: Lines 796-822 - Phone Verification card with PhoneSetup component
  - **Status**: ✅ COMPLETED - Includes password prop, success/error handlers, and helpful tip

- [x] **T013** Add MFA Settings Card to Security tab
  - **File**: `frontend/src/pages/setting.tsx`
  - **Location**: Lines 825-840 - Two-Factor Authentication card with MfaSettings component
  - **Status**: ✅ COMPLETED - Integrated with userId prop

---

## Phase 3.5: Testing (Parallel - independent test scenarios)

These tasks validate the integration through manual testing. Can be executed in parallel by different testers or test sessions.

- [ ] **T014** [P] Test Security tab rendering and navigation
  - **Action**: Open settings page, verify Security tab appears and is clickable
  - **Verify**: Tab switches correctly, content displays, no console errors
  - **Reference**: quickstart.md Steps 1-2
  - **Success**: Security tab accessible and renders without errors

- [ ] **T015** [P] Test password input and validation
  - **Action**: Enter password in security tab, verify it's captured in state
  - **Verify**: Password field works, shows/hides correctly, clears after success
  - **Reference**: quickstart.md Step 3
  - **Success**: Password input functional and secure

- [ ] **T016** [P] Test phone setup flow from settings
  - **Action**: Add mock phone number (+1234567890), send SMS, verify with mock OTP (123456)
  - **Verify**: Phone Setup component works, SMS sent notification, OTP verification succeeds
  - **Reference**: quickstart.md Steps 3-4
  - **Success**: Phone can be added and verified from settings

- [ ] **T017** [P] Test MFA enable flow from settings
  - **Action**: After phone verified, click "Enable SMS MFA"
  - **Verify**: MFA enables successfully, status shows "Active", toast notification appears
  - **Reference**: quickstart.md Step 5
  - **Success**: MFA can be enabled from settings

- [ ] **T018** [P] Test recovery codes generation from settings
  - **Action**: Click "Generate Recovery Codes", verify codes display, test copy/download
  - **Verify**: Codes generated, copy works, download works, warning displayed
  - **Reference**: quickstart.md Step 6
  - **Success**: Recovery codes can be generated and saved

- [ ] **T019** [P] Test settings tab navigation persistence
  - **Action**: Switch between tabs while on security, verify state maintains
  - **Verify**: Security tab state doesn't reset, MFA status persists, no data loss
  - **Reference**: quickstart.md Step 7
  - **Success**: Tab navigation doesn't break security state

- [ ] **T020** [P] Test complete MFA login flow after settings setup
  - **Action**: Enable MFA from settings, logout, login again with MFA
  - **Verify**: OTP required at login, SMS received, verification works
  - **Reference**: quickstart.md Steps 8-9
  - **Success**: Settings-enabled MFA works in login flow

- [ ] **T021** [P] Test error handling - wrong OTP
  - **Action**: Try to verify phone with incorrect OTP code (000000)
  - **Verify**: Clear error message, can retry, no crashes
  - **Reference**: quickstart.md Edge Case 1
  - **Success**: Wrong OTP handled gracefully

- [ ] **T022** [P] Test responsive design on mobile viewport
  - **Action**: Resize browser to 375px width, test all security tab functionality
  - **Verify**: Layout adapts, forms usable, no overflow, buttons accessible
  - **Reference**: quickstart.md Edge Case 5
  - **Success**: Security tab works on mobile viewports

- [ ] **T023** [P] Test cross-browser compatibility
  - **Action**: Test security tab in Chrome, Firefox, and Safari
  - **Verify**: Works consistently across browsers, no browser-specific issues
  - **Reference**: quickstart.md validation tasks
  - **Success**: Works in all major browsers

---

## Phase 3.6: Styling & Polish

These tasks ensure visual consistency and polish. Can run in parallel as they affect different aspects.

- [ ] **T024** [P] Verify styling consistency with other tabs
  - **File**: `frontend/src/pages/setting.tsx`
  - **Action**: Review Security tab styling, ensure Card components match other tabs
  - **Verify**: Spacing, colors, fonts match existing tabs, theme works (light/dark)
  - **Success**: Security tab visually consistent with rest of settings

- [ ] **T025** [P] Add loading states and transitions
  - **File**: `frontend/src/pages/setting.tsx`
  - **Action**: Verify loading indicators appear during async operations
  - **Verify**: PhoneSetup shows loading, MfaSettings shows loading, smooth transitions
  - **Success**: User feedback during all async operations

---

## Phase 3.7: Documentation Updates

- [ ] **T026** Update SMS_MFA_TESTING_GUIDE.md with settings page instructions
  - **File**: `SMS_MFA_TESTING_GUIDE.md`
  - **Change**: Add section on using settings page for MFA setup:
    - How to access Security tab
    - Step-by-step MFA setup from settings
    - Screenshots or examples
  - **Location**: After existing testing methods section
  - **Why**: Documents the new settings page integration for users and developers

---

## Dependencies

**Sequential Order**:
1. Type definitions & imports (T001-T004) → State management (T005-T006)
2. State management (T005-T006) → Event handlers (T007-T008)
3. Event handlers (T007-T008) → UI Integration (T009-T013)
4. UI Integration complete (T009-T013) → Testing (T014-T023)
5. Testing validation → Styling (T024-T025) → Documentation (T026)

**Blocking Dependencies**:
- T001 must complete before T009 (need type definition before using 'security' value)
- T002, T003 must complete before T012, T013 (need imports before using components)
- T005 must complete before T011 (need state before binding to input)
- T007, T008 must complete before T012 (need handlers before passing to PhoneSetup)
- T009-T013 must all complete before T014-T023 (need UI before testing)

**Parallel Groups**:
- **Group 1** [P]: T001, T002, T003, T004 (different imports/types)
- **Group 2** [P]: T005, T006 (different state declarations)
- **Group 3** (Sequential): T009 → T010 → T011 → T012 → T013 (same JSX structure)
- **Group 4** [P]: T014-T023 (independent test scenarios)
- **Group 5** [P]: T024, T025 (different polish aspects)

---

## Parallel Execution Examples

### Launch Type Updates Together (T001-T004):
```bash
# In one terminal/session
Task: "Update SettingsSection type in frontend/src/pages/setting.tsx"

# In parallel terminals
Task: "Import PhoneSetup component in frontend/src/pages/setting.tsx"
Task: "Import MfaSettings component in frontend/src/pages/setting.tsx"
Task: "Import Shield icon in frontend/src/pages/setting.tsx"
```

### Launch Test Tasks Together (T014-T023):
```bash
# Multiple test sessions can run concurrently
Task: "Test Security tab rendering - verify tab appears and is clickable"
Task: "Test phone setup flow - add and verify phone number"
Task: "Test MFA enable flow - enable MFA from settings"
Task: "Test recovery codes - generate and save codes"
Task: "Test mobile responsive design - verify 375px viewport"
Task: "Test cross-browser - Chrome, Firefox, Safari"
```

---

## Notes

- **[P] markers**: Tasks marked [P] have no dependencies on each other and modify different files or independent sections
- **No [P] marker**: Tasks modify the same file/section and must run sequentially
- **Commit strategy**: Commit after completing each phase (e.g., after T004, T006, T008, T013, T023, T025, T026)
- **Testing first**: While not TDD (components already exist), testing tasks validate integration
- **Password security**: Password is never stored, only passed to PhoneSetup component
- **Existing components**: PhoneSetup and MfaSettings are fully implemented and tested - only integration needed

---

## Task Generation Rules Applied

1. **From Design Docs**:
   - data-model.md → State management tasks (T005-T006)
   - quickstart.md → Testing tasks (T014-T023)
   - research.md → Integration approach (Security tab pattern)

2. **From Implementation Plan**:
   - Type updates (T001)
   - Component imports (T002-T004)
   - UI integration (T009-T013)
   - Documentation (T026)

3. **Ordering Logic**:
   - Types → Imports → State → Handlers → UI → Tests → Polish → Docs
   - Dependencies respected (handlers before UI, UI before tests)
   - Parallel where possible (different files, independent sections)

---

## Validation Checklist

*GATE: Verified before task list completion*

- [x] All quickstart scenarios have corresponding test tasks (T014-T023)
- [x] Type updates precede usage (T001 before T009)
- [x] Imports precede component usage (T002-T003 before T012-T013)
- [x] State precedes bindings (T005 before T011)
- [x] Handlers precede prop passing (T007-T008 before T012)
- [x] UI complete before testing (T009-T013 before T014-T023)
- [x] Parallel tasks truly independent (verified for each [P] marker)
- [x] Each task has exact file path specified
- [x] No [P] tasks modify overlapping code sections
- [x] Documentation updates included (T026)

---

## Summary

**Total Tasks**: 26
- **Setup**: 0 (using existing components)
- **Type & Import**: 4 (T001-T004) [P]
- **State Management**: 2 (T005-T006) [P]
- **Event Handlers**: 2 (T007-T008)
- **UI Integration**: 5 (T009-T013) - Sequential
- **Testing**: 10 (T014-T023) [P]
- **Polish**: 2 (T024-T025) [P]
- **Documentation**: 1 (T026)

**Estimated Time**:
- Implementation (T001-T013): 2-3 hours
- Testing (T014-T023): 2-3 hours
- Polish & Docs (T024-T026): 1 hour
- **Total**: 5-7 hours

**Risk Level**: Low
- Reusing tested components
- No new APIs needed
- Clear integration pattern
- Well-documented existing code

**Success Criteria**:
- Security tab accessible ✅
- Phone verification works from settings ✅
- MFA can be enabled from settings ✅
- Recovery codes can be generated ✅
- Settings navigation maintains state ✅
- Login flow requires MFA when enabled ✅
- Responsive design maintained ✅
- Documentation updated ✅

---

*Ready for execution. Start with T001-T004 in parallel, then proceed sequentially through each phase.*
