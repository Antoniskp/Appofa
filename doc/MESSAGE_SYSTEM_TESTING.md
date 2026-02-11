# Testing Guide: Message/Contact Submission System

## Prerequisites
1. Start the PostgreSQL database:
   ```bash
   docker-compose up -d postgres
   ```

2. Run the migration to create the Messages table:
   ```bash
   npm run migrate:up
   ```

3. Start the backend API:
   ```bash
   npm run dev
   ```

4. Start the frontend (in a separate terminal):
   ```bash
   npm run frontend
   ```

## Test Scenarios

### 1. Test Contact Form Submission (Anonymous User)
**URL:** http://localhost:3001/contact

**Steps:**
1. Open the contact page
2. Fill in the form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Subject: "Test Contact Message"
   - Message: "This is a test contact message."
3. Click "Αποστολή Μηνύματος"
4. Verify success message appears
5. Check in admin panel that the message appears

**Expected Result:**
- Success message: "✓ Το μήνυμά σας εστάλη επιτυχώς!"
- Message saved with status "pending"
- Email and name fields populated from form

### 2. Test Contact Form Submission (Authenticated User)
**URL:** http://localhost:3001/contact

**Steps:**
1. Login as a regular user
2. Open the contact page
3. Note that Name and Email fields are NOT shown (auto-filled from user profile)
4. Fill in:
   - Subject: "Authenticated User Message"
   - Message: "This message is from a logged-in user."
5. Click "Αποστολή Μηνύματος"
6. Verify success message

**Expected Result:**
- Success message shown
- Message saved with userId populated
- Email/name taken from user profile (if available)

### 3. Test Moderator Application (Authenticated User)
**URL:** http://localhost:3001/become-moderator

**Steps:**
1. Login as a regular user
2. Navigate to "Γίνε Moderator" page
3. Read the information about moderator role
4. Fill in the application form:
   - Subject: "Moderator Application"
   - Select a Location (required): Choose a municipality
   - Message: "I would like to become a moderator for this area because..."
5. Click "Υποβολή Αίτησης"
6. Verify success message
7. Wait 3 seconds - should redirect to home page

**Expected Result:**
- Success message shown
- After 3 seconds, redirect to home page
- Message saved with type "moderator_application"
- locationId populated

### 4. Test Admin Messages View
**URL:** http://localhost:3001/admin/messages

**Prerequisites:**
- Login as admin or moderator user

**Steps:**
1. Navigate to Admin Dashboard
2. Click "Manage Messages" button
3. Verify messages list displays
4. Test filters:
   - Filter by Type: Select "Επικοινωνία"
   - Filter by Status: Select "Εκκρεμεί"
5. Verify filtered results

**Expected Result:**
- All messages displayed in list
- Filters work correctly
- Each message shows:
  - Subject and type badge
  - Sender info (name/email or username)
  - Creation date
  - Status dropdown
  - Message preview
  - Location (if applicable)

### 5. Test Message Status Update
**URL:** http://localhost:3001/admin/messages

**Steps:**
1. Open admin messages page
2. Find a message with status "pending"
3. Click the status dropdown
4. Select "read" (Αναγνωσμένο)
5. Verify toast notification appears

**Expected Result:**
- Toast message: "Η κατάσταση ενημερώθηκε"
- Status updates in the UI
- No page refresh needed

### 6. Test Form Validation

**Test Missing Required Fields:**
1. Go to contact form
2. Leave all fields empty
3. Click submit
4. Verify browser validation triggers

**Test Email Validation (Anonymous):**
1. Enter invalid email: "not-an-email"
2. Submit form
3. Verify error: "Email must be a valid email address."

**Test Character Limits:**
1. Try entering more than 200 characters in Subject field
2. Verify character counter shows: "X / 200"
3. Verify you cannot type more than limit

**Test Moderator App Without Location:**
1. Go to /become-moderator
2. Fill in all fields EXCEPT location
3. Try to submit
4. Verify error: "Location is required for moderator applications."

### 7. Test API Endpoints Directly (Optional)

**Create Message:**
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "type": "contact",
    "email": "api@test.com",
    "name": "API Tester",
    "subject": "API Test",
    "message": "Testing via API"
  }'
```

**Get All Messages (requires auth):**
```bash
curl http://localhost:3000/api/messages \
  -H "Cookie: auth_token=YOUR_AUTH_TOKEN"
```

**Update Status (requires admin auth):**
```bash
curl -X PUT http://localhost:3000/api/messages/1/status \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_AUTH_TOKEN; csrf_token=YOUR_CSRF_TOKEN" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -d '{"status": "read"}'
```

## Database Verification

After testing, verify data in database:

```sql
-- View all messages
SELECT * FROM "Messages" ORDER BY "createdAt" DESC;

-- Count by type
SELECT type, COUNT(*) FROM "Messages" GROUP BY type;

-- Count by status
SELECT status, COUNT(*) FROM "Messages" GROUP BY status;

-- View moderator applications with location details
SELECT m.id, m.subject, m.message, l.name as location_name, u.username
FROM "Messages" m
LEFT JOIN "Locations" l ON m."locationId" = l.id
LEFT JOIN "Users" u ON m."userId" = u.id
WHERE m.type = 'moderator_application';
```

## Common Issues

### Issue: Cannot submit form
- **Check:** Is the backend API running?
- **Check:** Are there any console errors in browser dev tools?
- **Check:** Is CSRF token present? (Check cookies)

### Issue: "Message not found" in admin panel
- **Check:** Did migration run successfully?
- **Check:** Are you logged in as admin/moderator?
- **Check:** Check database for the message

### Issue: Location selector not working
- **Check:** Are there locations in the database?
- **Check:** Run: `npm run seed:locations` to populate locations
- **Check:** Check network tab for API errors

## Success Criteria

✅ Users can submit contact messages (both authenticated and anonymous)
✅ Users can apply to become moderators with location selection
✅ Admins can view all messages in dedicated interface
✅ Admins can update message status
✅ Form validation works correctly
✅ Greek language used throughout
✅ Mobile responsive design works
✅ No console errors
✅ All routes accessible
