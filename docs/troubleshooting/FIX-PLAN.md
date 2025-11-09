# Test Suite Fix Plan - Following GitHub Best Practices

**Created**: 2025-11-09  
**Status**: 🟡 In Progress  
**Methodology**: Industrial-grade Software Engineering Process  

---

## Executive Summary

This plan follows GitHub's best practices for bug fixing:
- ✅ Systematic problem identification
- ✅ Prioritized fix approach
- ✅ Comprehensive testing at each stage
- ✅ Version control with meaningful commits
- ✅ Code review ready
- ✅ Documentation updates

---

## Fix Strategy: Priority-Based Approach

### Phase 1: Critical Path - Make Tests Runnable 🔴
**Goal**: Fix blocking issues preventing test execution  
**Success Criteria**: Tests can run (even if some fail)

#### Fix 1.1: Import Path Corrections (7 files)
**Priority**: 🔴 CRITICAL  
**Estimated Time**: 15 minutes  
**Risk**: Low - Safe refactor, no logic changes

**Files to Fix**:
```
apps/creation-agent/src/__tests__/creation.service.spec.ts
apps/narrative-agent/src/__tests__/narrative.service.spec.ts
apps/logic-agent/src/__tests__/logic.service.spec.ts
apps/logic-agent/src/__tests__/logic.service.integration.spec.ts
apps/logic-agent/src/__tests__/rule-engine.service.spec.ts
apps/backend-gateway/src/auth/__tests__/auth.controller.spec.ts
apps/backend-gateway/src/auth/__tests__/auth.service.spec.ts
```

**Change Pattern**:
```typescript
// BEFORE
import { ServiceName } from './service-name'

// AFTER
import { ServiceName } from '../service-name'
```

**Verification**:
```bash
pnpm test -- --listTests  # Should list all tests
```

#### Fix 1.2: Mock Type Corrections (3+ occurrences)
**Priority**: 🔴 CRITICAL  
**Estimated Time**: 20 minutes  
**Risk**: Low - Aligning mocks with actual interfaces

**Pattern to Find**:
```typescript
schedulerMock.getProviderForRole.mockResolvedValue({ model: MOCK_CHAT_MODEL })
```

**Replacement**:
```typescript
const mockAiProvider: AiProvider = {
  name: 'test-model',
  provider: 'OpenAI',
  generate: jest.fn().mockResolvedValue('mocked AI response')
}
schedulerMock.getProviderForRole.mockResolvedValue(mockAiProvider)
```

**Verification**:
```bash
pnpm type-check
```

---

### Phase 2: Code Quality - Clean Up Technical Debt 🟡
**Goal**: Improve code maintainability  
**Success Criteria**: Linter passes, complexity reduced

#### Fix 2.1: Error Handling Utility (5 occurrences)
**Priority**: 🟡 MEDIUM  
**Estimated Time**: 30 minutes  
**Risk**: Low - Extracting common pattern

**Create Utility Function**:
```typescript
// packages/common-backend/src/utils/error-utils.ts
export function getErrorMessage(error: unknown, defaultMessage = 'An unknown error occurred'): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return defaultMessage
}
```

**Replace Redundant Code**:
```typescript
// BEFORE
error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) : 'Unknown error'

// AFTER
getErrorMessage(error, 'Unknown error')
```

**Verification**:
```bash
pnpm lint
```

#### Fix 2.2: Reduce Function Complexity (2 functions)
**Priority**: 🟡 MEDIUM  
**Estimated Time**: 45 minutes  
**Risk**: Medium - Logic refactoring

**Function 1**: `createWorld()` - Complexity 18 → Target 12
**Function 2**: `createNewWorld()` - Complexity 16 → Target 12

**Refactoring Strategy**:
1. Extract validation logic into separate method
2. Extract error notification into separate method
3. Extract response building into separate method
4. Use early returns to reduce nesting

**Verification**:
```bash
pnpm lint
pnpm test creation-agent
```

---

### Phase 3: Verification & Testing 🟢
**Goal**: Ensure all fixes work correctly  
**Success Criteria**: All checks pass

#### Step 3.1: Unit Tests
```bash
pnpm test:unit
```
**Expected**: All tests pass or failures are documented

#### Step 3.2: Type Checking
```bash
pnpm type-check
```
**Expected**: No TypeScript errors

#### Step 3.3: Linting
```bash
pnpm lint
```
**Expected**: No linter errors

#### Step 3.4: Full Test Suite
```bash
pnpm test:all
```
**Expected**: Test results match or exceed baseline

---

## Implementation Timeline

```
┌─────────────────────────────────────────────────────────┐
│ Phase 1: Critical (BLOCKING)                            │
│ ├─ Fix 1.1: Import Paths          [15 min]   🔴        │
│ └─ Fix 1.2: Mock Types            [20 min]   🔴        │
│                                                         │
│ Phase 2: Quality (IMPORTANT)                            │
│ ├─ Fix 2.1: Error Handling        [30 min]   🟡        │
│ └─ Fix 2.2: Reduce Complexity     [45 min]   🟡        │
│                                                         │
│ Phase 3: Verification (ESSENTIAL)                       │
│ ├─ Unit Tests                     [10 min]   🟢        │
│ ├─ Type Checking                  [5 min]    🟢        │
│ ├─ Linting                        [5 min]    🟢        │
│ └─ Full Test Suite                [15 min]   🟢        │
│                                                         │
│ Total Estimated Time: ~2.5 hours                        │
└─────────────────────────────────────────────────────────┘
```

---

## Git Commit Strategy

Following [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Phase 1
git commit -m "fix(test): correct import paths in test files

- Update 7 test files to use correct relative paths (../ instead of ./)
- Fixes module resolution errors preventing test execution
- No logic changes, safe refactor

Refs: #[issue-number]"

git commit -m "fix(test): align AiProvider mocks with actual interface

- Update mock objects to match AiProvider interface structure
- Remove non-existent 'model' property
- Add correct 'name', 'provider', and 'generate' properties

Refs: #[issue-number]"

# Phase 2
git commit -m "refactor(error): extract error message utility function

- Create getErrorMessage() utility in common-backend
- Replace 5 instances of redundant type checking
- Improves code readability and maintainability

Refs: #[issue-number]"

git commit -m "refactor(complexity): reduce function complexity in creation-agent

- Extract validation logic from createWorld()
- Extract error notification logic
- Reduce complexity from 18 to 12
- All tests still passing

Refs: #[issue-number]"
```

---

## Rollback Plan

If any phase fails:

### Rollback Phase 3 (Verification Issues)
```bash
# No code changes in Phase 3, just testing
# Proceed to fix any discovered issues
```

### Rollback Phase 2 (Quality Issues)
```bash
git revert HEAD~2..HEAD  # Revert last 2 commits (Phase 2)
# Phase 1 fixes remain, tests can run
```

### Rollback Phase 1 (Critical Issues)
```bash
git revert HEAD~4..HEAD  # Revert all changes
# Back to original state, document learnings
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Import path fix breaks other imports | Low | Low | Run full test suite after |
| Mock changes break test logic | Medium | Medium | Review each test case carefully |
| Error utility has edge cases | Low | Medium | Add comprehensive unit tests |
| Complexity refactor introduces bugs | Medium | High | Keep original tests passing |

---

## Success Metrics

### Before Fix
- ❌ Test Execution: 0% (7/7 fail to run)
- ❌ Type Errors: 5+
- ❌ Linter Errors: 4+
- ❌ Cyclomatic Complexity: 18 (max 15)

### After Fix (Target)
- ✅ Test Execution: 100% (all can run)
- ✅ Type Errors: 0
- ✅ Linter Errors: 0
- ✅ Cyclomatic Complexity: ≤15

---

## Phase 1 Implementation: START NOW

Let's begin with the critical path fixes...

