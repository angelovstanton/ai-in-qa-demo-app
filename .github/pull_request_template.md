# ?? Summary

## What does this PR do?
<!-- Briefly describe what this pull request accomplishes -->

## ?? Type of Change
<!-- Mark the type of change this PR represents -->
- [ ] ?? Bug fix (non-breaking change that fixes an issue)
- [ ] ? New feature (non-breaking change that adds functionality)
- [ ] ?? Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] ?? Documentation update
- [ ] ?? Testing scenario addition
- [ ] ?? Maintenance/refactoring
- [ ] ?? UI/UX improvement

## ?? Testing Impact
<!-- How does this change affect testing scenarios? -->
- [ ] Adds new testing scenarios
- [ ] Improves existing test coverage
- [ ] Adds new test selectors (`data-testid`)
- [ ] Affects automated test scripts
- [ ] Changes user workflows
- [ ] Modifies API endpoints
- [ ] Updates database schema

## ?? Changes Made
<!-- List the specific changes in this PR -->
- 
- 
- 

## ?? Related Issues
<!-- Link any related issues -->
Fixes #
Relates to #
Depends on #

## ?? Testing Checklist
<!-- Confirm testing has been completed -->
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if UI changes)
- [ ] Mobile responsiveness (if UI changes)
- [ ] Accessibility testing (if UI changes)
- [ ] API endpoints tested (if backend changes)
- [ ] Database migrations tested (if schema changes)

## ??? Test Selectors Added/Modified
<!-- List any new or modified data-testid attributes -->
```typescript
// New selectors added:
"cs-new-feature-button"
"cs-new-form-field"

// Modified selectors:
"cs-existing-selector" // Changed behavior
```

## ?? Screenshots
<!-- Add screenshots for UI changes -->
### Before
<!-- Screenshot of current state -->

### After
<!-- Screenshot of changes -->

## ?? API Changes
<!-- Document any API changes -->
### New Endpoints
- `GET /api/v1/new-endpoint` - Description

### Modified Endpoints
- `POST /api/v1/existing-endpoint` - What changed

### Deprecated Endpoints
- `DELETE /api/v1/old-endpoint` - Use new endpoint instead

## ?? Database Changes
<!-- Document any database schema changes -->
- [ ] New tables added
- [ ] Existing tables modified
- [ ] Migrations included
- [ ] Seed data updated
- [ ] No database changes

## ??? Feature Flags
<!-- Document any feature flag changes -->
- [ ] New feature flags added
- [ ] Existing feature flags modified
- [ ] Feature flag documentation updated
- [ ] No feature flag changes

## ?? Security Considerations
<!-- Address any security implications -->
- [ ] No sensitive data exposed
- [ ] Authentication/authorization unchanged
- [ ] Input validation added/maintained
- [ ] No security vulnerabilities introduced

## ? Accessibility
<!-- Confirm accessibility requirements -->
- [ ] ARIA labels added where needed
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast maintained
- [ ] No accessibility changes needed

## ?? Documentation
<!-- Confirm documentation is updated -->
- [ ] README updated
- [ ] API documentation updated
- [ ] Testing guide updated
- [ ] Code comments added
- [ ] No documentation changes needed

## ?? Deployment Notes
<!-- Any special deployment considerations -->
- [ ] Requires database migration
- [ ] Requires environment variable changes
- [ ] Requires dependency updates
- [ ] Ready for immediate deployment

## ? Pre-merge Checklist
<!-- Confirm all requirements are met -->
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is properly commented
- [ ] Tests added for new functionality
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Branch is up to date with main

## ?? QA Testing Instructions
<!-- Specific instructions for QA testing -->
### Test Accounts to Use
- [ ] Citizen: john@example.com
- [ ] Clerk: mary.clerk@city.gov
- [ ] Admin: admin@city.gov

### Specific Test Cases
1. **Test Case 1**: Description
   - Steps: ...
   - Expected: ...

2. **Test Case 2**: Description
   - Steps: ...
   - Expected: ...

### Feature Flags to Test
- [ ] Test with feature flag enabled
- [ ] Test with feature flag disabled

## ?? Reviewer Notes
<!-- Any specific notes for reviewers -->
- Please pay special attention to...
- Known limitations/trade-offs...
- Future improvement opportunities...

---

**For Reviewers:**
- [ ] Code quality and standards
- [ ] Testing coverage adequate
- [ ] Documentation complete
- [ ] No breaking changes (unless intentional)
- [ ] Security considerations addressed