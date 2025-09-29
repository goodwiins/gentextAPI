# Tasks: Homepage SAAS

**Input**: Design documents from `/specs/001-homepage-saas/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extract: TypeScript 5.x, Next.js 15.2.4, React 18.2.0, Aceternity UI, Appwrite
2. Load design documents ✓
   → data-model.md: 3 entities (HomepageMetrics, ConversionEvents, FeatureEngagement)
   → contracts/: analytics-api.yaml, frontend-components.ts
   → research.md: Technology decisions and performance strategies
3. Generate tasks by category ✓
   → Setup: dependencies, performance monitoring, analytics collections
   → Tests: contract tests, component tests, integration tests
   → Core: components, hooks, services, analytics integration
   → Integration: Appwrite collections, API endpoints, performance monitoring
   → Polish: accessibility tests, performance validation, SEO optimization
4. Apply task rules ✓
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `frontend/src/`, `server/src/`
- Frontend components in `frontend/src/components/`
- Backend analytics in `server/src/api/`
- Tests in respective `frontend/src/__tests__/` and `server/src/tests/`

## Phase 3.1: Setup
- [x] T001 Configure Appwrite collections for homepage analytics per data-model.md
- [x] T002 Install and configure performance monitoring dependencies in frontend/package.json
- [x] T003 [P] Configure TypeScript types for analytics in frontend/src/types/analytics.ts
- [x] T004 [P] Setup Vitest accessibility testing configuration in frontend/vitest.config.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T005 [P] Contract test POST /analytics/homepage/metrics in server/src/tests/contract/test_analytics_metrics.py
- [x] T006 [P] Contract test POST /analytics/homepage/conversions in server/src/tests/contract/test_analytics_conversions.py
- [x] T007 [P] Contract test POST /analytics/homepage/engagement in server/src/tests/contract/test_analytics_engagement.py
- [x] T008 [P] Contract test GET /analytics/homepage/summary in server/src/tests/contract/test_analytics_summary.py
- [x] T009 [P] Component test HomepageHero in frontend/src/__tests__/components/HomepageHero.test.tsx
- [x] T010 [P] Component test FeatureCard in frontend/src/__tests__/components/FeatureCard.test.tsx
- [x] T011 [P] Component test ProcessStep in frontend/src/__tests__/components/ProcessStep.test.tsx
- [x] T012 [P] Component test CtaSection in frontend/src/__tests__/components/CtaSection.test.tsx
- [x] T013 [P] Hook test useHomepageAnalytics in frontend/src/__tests__/hooks/useHomepageAnalytics.test.tsx
- [x] T014 [P] Integration test anonymous user journey in frontend/src/__tests__/integration/anonymous-user-flow.test.tsx
- [x] T015 [P] Integration test authenticated user journey in frontend/src/__tests__/integration/authenticated-user-flow.test.tsx
- [x] T016 [P] Performance test Core Web Vitals in frontend/src/__tests__/performance/core-web-vitals.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T017 [P] HomepageMetrics model service in frontend/src/lib/models/homepage-metrics.ts
- [ ] T018 [P] ConversionEvents model service in frontend/src/lib/models/conversion-events.ts
- [ ] T019 [P] FeatureEngagement model service in frontend/src/lib/models/feature-engagement.ts
- [ ] T020 [P] Analytics service integration in frontend/src/lib/analytics-service.ts
- [ ] T021 [P] useHomepageAnalytics hook in frontend/src/hooks/useHomepageAnalytics.ts
- [ ] T022 [P] useIntersectionObserver hook in frontend/src/hooks/useIntersectionObserver.ts
- [ ] T023 [P] useScrollProgress hook in frontend/src/hooks/useScrollProgress.ts
- [ ] T024 [P] usePerformanceMonitor hook in frontend/src/hooks/usePerformanceMonitor.ts
- [ ] T025 [P] HomepageHero component in frontend/src/components/home/HomepageHero.tsx
- [ ] T026 [P] FeatureCard component in frontend/src/components/home/FeatureCard.tsx
- [ ] T027 [P] ProcessStep component in frontend/src/components/home/ProcessStep.tsx
- [ ] T028 [P] TestimonialCard component in frontend/src/components/home/TestimonialCard.tsx
- [ ] T029 [P] CtaSection component in frontend/src/components/home/CtaSection.tsx
- [ ] T030 [P] HomepageLayout wrapper in frontend/src/components/home/HomepageLayout.tsx
- [ ] T031 Update homepage index.tsx to use new components in frontend/src/pages/index.tsx
- [ ] T032 [P] Analytics endpoints POST /analytics/homepage/metrics in server/src/api/analytics.py
- [ ] T033 [P] Analytics endpoints POST /analytics/homepage/conversions in server/src/api/analytics.py (extend existing file)
- [ ] T034 [P] Analytics endpoints POST /analytics/homepage/engagement in server/src/api/analytics.py (extend existing file)
- [ ] T035 Analytics endpoints GET /analytics/homepage/summary in server/src/api/analytics.py (extend existing file)

## Phase 3.4: Integration
- [ ] T036 Connect analytics service to Appwrite collections in frontend/src/lib/analytics-service.ts
- [ ] T037 Integrate performance monitoring with analytics tracking in frontend/src/lib/performance.ts
- [ ] T038 Add analytics middleware to FastAPI in server/src/api/fastapi_app.py
- [ ] T039 Configure CORS for analytics endpoints in server/src/api/fastapi_app.py
- [ ] T040 Add session management for analytics tracking in frontend/src/context/analytics-context.tsx

## Phase 3.5: Polish
- [ ] T041 [P] Accessibility tests for all homepage components in frontend/src/__tests__/accessibility/homepage-a11y.test.tsx
- [ ] T042 [P] Performance validation tests (<3s LCP, <1.5s FCP) in frontend/src/__tests__/performance/load-times.test.tsx
- [ ] T043 [P] Bundle size validation tests (<500KB) in frontend/src/__tests__/performance/bundle-size.test.tsx
- [ ] T044 [P] Animation performance tests (≥60fps) in frontend/src/__tests__/performance/animation-performance.test.tsx
- [ ] T045 [P] SEO metadata optimization in frontend/src/pages/index.tsx
- [ ] T046 [P] Mobile responsiveness validation in frontend/src/__tests__/responsive/mobile-layout.test.tsx
- [ ] T047 Update API documentation in server/docs/analytics-api.md
- [ ] T048 Run quickstart validation scenarios per quickstart.md
- [ ] T049 Performance optimization based on monitoring data in frontend/src/lib/performance.ts

## Dependencies
- Setup (T001-T004) before everything
- Tests (T005-T016) before implementation (T017-T035)
- Models (T017-T019) before services (T020-T024)
- Hooks (T021-T024) before components (T025-T030)
- Components (T025-T030) before page integration (T031)
- Backend endpoints (T032-T035) before integration (T036-T040)
- Core implementation before polish (T041-T049)

## Parallel Example
```bash
# Launch T005-T008 together (contract tests):
Task: "Contract test POST /analytics/homepage/metrics in server/src/tests/contract/test_analytics_metrics.py"
Task: "Contract test POST /analytics/homepage/conversions in server/src/tests/contract/test_analytics_conversions.py"
Task: "Contract test POST /analytics/homepage/engagement in server/src/tests/contract/test_analytics_engagement.py"
Task: "Contract test GET /analytics/homepage/summary in server/src/tests/contract/test_analytics_summary.py"

# Launch T017-T019 together (model services):
Task: "HomepageMetrics model service in frontend/src/lib/models/homepage-metrics.ts"
Task: "ConversionEvents model service in frontend/src/lib/models/conversion-events.ts"
Task: "FeatureEngagement model service in frontend/src/lib/models/feature-engagement.ts"

# Launch T025-T029 together (homepage components):
Task: "HomepageHero component in frontend/src/components/home/HomepageHero.tsx"
Task: "FeatureCard component in frontend/src/components/home/FeatureCard.tsx"
Task: "ProcessStep component in frontend/src/components/home/ProcessStep.tsx"
Task: "TestimonialCard component in frontend/src/components/home/TestimonialCard.tsx"
Task: "CtaSection component in frontend/src/components/home/CtaSection.tsx"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Use existing performance monitoring system from frontend/src/lib/performance.ts
- Integrate with existing Appwrite authentication from frontend/src/lib/appwrite.ts
- Follow existing component patterns from frontend/src/components/
- Maintain bundle size budget of ≤500KB additional impact
- Ensure WCAG 2.1 AA compliance for all components
- All animations must respect prefers-reduced-motion

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - analytics-api.yaml → 4 contract tests (T005-T008) + 4 endpoint implementations (T032-T035)
   - frontend-components.ts → 5 component tests (T009-T012) + 5 component implementations (T025-T029)
   
2. **From Data Model**:
   - HomepageMetrics → model service (T017)
   - ConversionEvents → model service (T018) 
   - FeatureEngagement → model service (T019)
   
3. **From User Stories**:
   - Anonymous user journey → integration test (T014)
   - Authenticated user journey → integration test (T015)
   - Performance requirements → performance tests (T016, T042-T044)

4. **Ordering**:
   - Setup → Tests → Models → Services → Components → Integration → Polish
   - TDD approach with failing tests before implementation

## Validation Checklist
*GATE: Checked by main() before returning*

- ✅ All contracts have corresponding tests (analytics-api.yaml → T005-T008, frontend-components.ts → T009-T012)
- ✅ All entities have model tasks (HomepageMetrics → T017, ConversionEvents → T018, FeatureEngagement → T019)
- ✅ All tests come before implementation (T005-T016 before T017-T035)
- ✅ Parallel tasks truly independent (different files, marked with [P])
- ✅ Each task specifies exact file path
- ✅ No task modifies same file as another [P] task