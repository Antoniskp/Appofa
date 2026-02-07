# Poll Frontend Testing Checklist

## Pre-Testing Setup
- [ ] Backend server running (`npm start`)
- [ ] Frontend server running (`npm run frontend`)
- [ ] Database populated with test data
- [ ] At least one admin user account
- [ ] At least one regular user account

## 1. Navigation & Access

### TopNav Integration
- [ ] "Δημοσκοπήσεις" link appears in main navigation (desktop)
- [ ] "Δημοσκοπήσεις" link appears in mobile menu
- [ ] "Δημιουργία Δημοσκόπησης" appears in user dropdown (authenticated)
- [ ] Links navigate to correct pages

## 2. Polls List Page (/polls)

### Display
- [ ] Page loads without errors
- [ ] Poll cards display with correct information
- [ ] Poll type badges show correctly (Απλή/Σύνθετη)
- [ ] Status badges show correctly (Ενεργή/Κλειστή)
- [ ] Vote counts display correctly
- [ ] Creator names display correctly
- [ ] Default image shows when no banner image

### Filtering
- [ ] Status filter works (All/Active/Closed)
- [ ] Type filter works (All/Simple/Complex)
- [ ] Search filter works (searches title/description)
- [ ] Filters can be combined
- [ ] Clearing filters resets to all polls

### Pagination
- [ ] Pagination controls appear when needed
- [ ] Next/Previous buttons work
- [ ] Page numbers are clickable
- [ ] Current page is highlighted
- [ ] Pagination updates URL

### Responsive Design
- [ ] Grid layout on desktop (3 columns)
- [ ] Grid layout on tablet (2 columns)
- [ ] Grid layout on mobile (1 column)
- [ ] Cards are properly sized and readable

### Empty States
- [ ] Shows message when no polls found
- [ ] Shows "Create Poll" button for authenticated users
- [ ] Shows helpful message for filtered results with no matches

## 3. Create Poll Page (/polls/create)

### Access Control
- [ ] Redirects to login if not authenticated
- [ ] Authenticated users can access the page

### Form - Basic Information
- [ ] Title field accepts input (max 200 chars)
- [ ] Character count displays for title
- [ ] Description textarea accepts input (max 1000 chars)
- [ ] Character count displays for description
- [ ] Required field validation works

### Form - Settings
- [ ] Poll type dropdown works (Simple/Complex)
- [ ] Visibility dropdown works (Public/Private/Locals Only)
- [ ] Results visibility dropdown works
- [ ] Deadline datetime picker works
- [ ] "Allow user contributions" checkbox toggles
- [ ] "Allow unauthenticated votes" checkbox toggles

### Form - Location (Locals Only)
- [ ] Location selector appears when visibility = "Locals Only"
- [ ] Location selector populated with locations
- [ ] Can select a location
- [ ] Location selector hidden for other visibility types

### Form - Options (Simple Poll)
- [ ] At least 2 option fields shown by default
- [ ] Can add more options with "+" button
- [ ] Can remove options (keeping minimum 2)
- [ ] Option text inputs accept input
- [ ] Required validation on option text

### Form - Options (Complex Poll)
- [ ] Additional fields appear (photo URL, link URL, display text)
- [ ] All fields accept input
- [ ] Photo URL field accepts valid URLs
- [ ] Link URL field accepts valid URLs

### Form Submission
- [ ] Validation errors display for missing required fields
- [ ] Submit button disabled while submitting
- [ ] Success: Redirects to poll detail page
- [ ] Error: Shows error message and stays on form
- [ ] Cancel button returns to polls list

## 4. Poll Detail Page (/polls/:id)

### Display
- [ ] Poll title displays
- [ ] Poll description displays
- [ ] Type badge displays correctly
- [ ] Status badge displays correctly
- [ ] Visibility badge displays (if locals_only)
- [ ] Creator name displays
- [ ] Creation date displays
- [ ] Deadline displays (if set)

### Voting Section - Simple Poll
- [ ] Radio buttons display for each option
- [ ] Can select an option
- [ ] Selected option is highlighted
- [ ] Submit button enabled when option selected
- [ ] Submit button disabled when no selection

### Voting Section - Complex Poll
- [ ] Option cards display with images
- [ ] Images load correctly
- [ ] Fallback icon shows for broken images
- [ ] Display text shows below option text
- [ ] Link shows and opens in new tab
- [ ] Click on card selects the option
- [ ] Selected card is highlighted

### Vote Submission
- [ ] Vote submission works
- [ ] Success message displays
- [ ] Page refreshes to show updated results
- [ ] Can change vote
- [ ] "Already voted" message shows

### Voting - Unauthenticated
- [ ] Can vote if allowUnauthenticatedVotes = true
- [ ] Cannot vote if allowUnauthenticatedVotes = false
- [ ] Shows login prompt if voting not allowed

### Voting - Closed Polls
- [ ] Cannot vote on closed polls
- [ ] Shows "poll closed" message
- [ ] Voting section not shown

### Results Section
- [ ] Results display when allowed
- [ ] Chart type toggle works (Bar/Pie/Doughnut)
- [ ] Charts render correctly
- [ ] Chart tooltips show on hover
- [ ] Detailed results table displays
- [ ] Progress bars show correct percentages
- [ ] Vote counts are correct
- [ ] Total votes summary displays
- [ ] Authenticated/unauthenticated breakdown shows

### Results - Export
- [ ] Export button appears
- [ ] Clicking export downloads PNG image
- [ ] Image contains the chart
- [ ] Filename includes poll ID

### Results Visibility Rules
- [ ] Always: Results always visible
- [ ] After Vote: Results visible after voting
- [ ] After Deadline: Results visible after poll closes
- [ ] Creator: Can always see results
- [ ] Admin: Can always see results
- [ ] Other users: See results based on rules

### Edit/Delete Buttons
- [ ] Edit button shows for creator
- [ ] Edit button shows for admin
- [ ] Edit button doesn't show for other users
- [ ] Delete button shows for creator
- [ ] Delete button shows for admin
- [ ] Delete button doesn't show for other users

### Delete Confirmation
- [ ] Delete button opens confirmation dialog
- [ ] Confirmation shows warning message
- [ ] Cancel button closes dialog without deleting
- [ ] Confirm button deletes poll
- [ ] Redirects to polls list after deletion

### Responsive Design
- [ ] Layout works on mobile
- [ ] Layout works on tablet
- [ ] Layout works on desktop
- [ ] Charts resize appropriately
- [ ] Option cards stack on mobile

## 5. Edit Poll Page (/polls/:id/edit)

### Access Control
- [ ] Redirects to login if not authenticated
- [ ] Shows error if user is not creator/admin
- [ ] Creator can access
- [ ] Admin can access

### Form Pre-population
- [ ] Title pre-filled with existing value
- [ ] Description pre-filled
- [ ] Type pre-selected
- [ ] Visibility pre-selected
- [ ] Results visibility pre-selected
- [ ] Deadline pre-filled (if set)
- [ ] Location pre-selected (if locals_only)
- [ ] Options pre-filled with existing options
- [ ] Checkboxes reflect existing settings

### Form Editing
- [ ] Can modify title
- [ ] Can modify description
- [ ] Can modify settings
- [ ] Can add new options
- [ ] Can remove options (keeping minimum 2)
- [ ] Can modify existing option text

### Form Submission
- [ ] Submit saves changes
- [ ] Redirects to poll detail page
- [ ] Changes are reflected on detail page
- [ ] Error handling works
- [ ] Cancel returns to detail page

## 6. Error Handling

### Network Errors
- [ ] Shows error message on API failure
- [ ] Retry button appears
- [ ] Error doesn't crash the page

### Loading States
- [ ] Skeleton loaders show while loading
- [ ] Loading indicators on buttons
- [ ] Disabled state on forms while submitting

### Validation Errors
- [ ] Form validation errors display clearly
- [ ] Inline error messages
- [ ] Focus on first error field

### 404 Errors
- [ ] Shows "Poll not found" for invalid ID
- [ ] Back button to return to list

## 7. Cross-Browser Testing

### Chrome
- [ ] All features work
- [ ] Charts render correctly
- [ ] Images load properly

### Firefox
- [ ] All features work
- [ ] Charts render correctly
- [ ] Images load properly

### Safari (if available)
- [ ] All features work
- [ ] Charts render correctly
- [ ] Images load properly

### Mobile Browsers
- [ ] All features work on mobile Chrome
- [ ] All features work on mobile Safari
- [ ] Touch interactions work

## 8. Accessibility

### Keyboard Navigation
- [ ] Can tab through all interactive elements
- [ ] Can select options with keyboard
- [ ] Can submit forms with keyboard
- [ ] Focus indicators are visible

### Screen Reader
- [ ] Headings are properly structured
- [ ] Buttons have descriptive labels
- [ ] Form fields have labels
- [ ] Images have alt text

### Color Contrast
- [ ] Text is readable on backgrounds
- [ ] Status badges have sufficient contrast
- [ ] Links are distinguishable

## 9. Performance

### Page Load
- [ ] Polls list loads in < 2 seconds
- [ ] Poll detail loads in < 2 seconds
- [ ] Charts render quickly

### Interactions
- [ ] Form inputs are responsive
- [ ] Vote submission is quick
- [ ] Chart type toggle is instant

## 10. Integration

### With Existing Features
- [ ] TopNav integration doesn't break existing navigation
- [ ] Styling matches existing components
- [ ] Uses existing auth context correctly
- [ ] Uses existing API client correctly

### Data Consistency
- [ ] Vote counts update correctly
- [ ] Poll status reflects deadline
- [ ] Creator information is accurate
- [ ] Timestamps are correct

## Test Results Summary

**Date Tested:** _________________

**Tested By:** _________________

**Browser/Device:** _________________

**Issues Found:** _________________

**Status:** [ ] Pass [ ] Fail [ ] Needs Review

## Notes
_______________________________________________________
_______________________________________________________
_______________________________________________________
