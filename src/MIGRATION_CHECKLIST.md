# Error Handling Migration Checklist

## Overview
Migrate existing components from direct `toast.error()` calls to standardized error handling.

## High-Priority Components (Critical for UX)

### 1. AddTransactionModal
- [x] Imported `useErrorHandler` hook
- [x] Replaced `toast.error('Failed to add transaction')` with `handleApiError()`
- [x] Replaced validation `toast.error()` with `handleUserError()`
- [x] Added context for error tracking

### 2. GivingGoals (charity/GivingGoals.jsx)
- [ ] Replace donation creation errors with `handleApiError()`
- [ ] Replace validation errors with `handleUserError()`

### 3. DonationLog (charity/DonationLog.jsx)
- [ ] Replace donation add errors with `handleApiError()`
- [ ] Replace currency conversion errors with `handleApiError()`

### 4. Savings Goals (goals/AddGoalModal.jsx)
- [ ] Replace goal creation errors with `handleApiError()`
- [ ] Replace validation errors with `handleUserError()`

### 5. Debt Management
- [ ] Replace debt creation errors with `handleApiError()`
- [ ] Replace debt payment errors with `handleApiError()`

## Medium-Priority Components

### 6. Receipts (components/receipts/*)
- [ ] Replace upload errors with `handleApiError()`
- [ ] Replace parsing errors with `handleApiError()`

### 7. Investments (components/investments/*)
- [ ] Replace quote fetch errors with `handleApiError()`
- [ ] Replace portfolio update errors with `handleApiError()`

### 8. Budgets (pages/Budgets.jsx)
- [ ] Replace budget creation errors with `handleApiError()`
- [ ] Replace validation errors with `handleUserError()`

### 9. Subscriptions (pages/Subscriptions.jsx)
- [ ] Replace subscription creation errors with `handleApiError()`

### 10. Settings (pages/Settings.jsx)
- [ ] Replace profile update errors with `handleApiError()`
- [ ] Replace currency change errors with `handleApiError()`

## Standard Migration Pattern

### Before:
```javascript
const mutation = useMutation({
  mutationFn: (data) => base44.entities.SomeEntity.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['someQuery']);
    toast.success('Created successfully');
  },
  onError: (err) => {
    toast.error('Failed to create');
  }
});
```

### After:
```javascript
import { useErrorHandler } from '@/hooks/useErrorHandler';

const { handleApiError } = useErrorHandler();

const mutation = useMutation({
  mutationFn: (data) => base44.entities.SomeEntity.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['someQuery']);
    toast.success('Created successfully');
  },
  onError: (err) => {
    handleApiError(err, { 
      title: 'Creation Error',
      context: 'entity-create'
    });
  }
});
```

## Validation Error Pattern

### Before:
```javascript
if (!formData.name) {
  toast.error('Please enter a name');
  return;
}
```

### After:
```javascript
const { handleUserError } = useErrorHandler();

if (!formData.name) {
  handleUserError('Please enter a name', { 
    title: 'Validation Error'
  });
  return;
}
```

## Testing Steps for Each Component

1. ✓ Mount component with form
2. ✓ Trigger API error (can mock with network tab)
3. ✓ Verify toast appears with error message
4. ✓ Verify error context logged to Sentry
5. ✓ Test validation error handling
6. ✓ Test success case (should not show error)

## Batch Migration Groups

### Batch 1: Forms (Due: Sprint 1)
- AddTransactionModal ✓
- AddGoalModal
- AddSavingsGoal
- AddDebt

### Batch 2: Modules (Due: Sprint 2)
- Receipts
- Subscriptions
- Settings
- Budgets

### Batch 3: Advanced (Due: Sprint 3)
- Investments
- NetWorth
- Expat Tools
- SideHustle

## Completion Tracking

- [x] Core infrastructure in place (errorHandler.js, useErrorHandler.js)
- [x] AddTransactionModal migrated
- [ ] All form components migrated (0/8)
- [ ] All mutation components migrated (0/15)
- [ ] Documentation updated
- [ ] Testing completed
- [ ] Sentry error tracking verified

## Questions?

1. **What if API returns custom error format?**
   - `normalizeApiError()` handles conversion, but update the handler if needed

2. **Should all errors be logged to Sentry?**
   - Yes, use `context` parameter to categorize: 'add-transaction', 'validation', etc.

3. **Can I still use custom toast messages?**
   - Yes, pass `title` parameter: `handleApiError(err, { title: 'Custom Title' })`

4. **What about retry functionality?**
   - Pass `onRetry` callback: `handleApiError(err, { onRetry: () => mutation.mutate() })