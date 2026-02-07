# Poll UI Structure

## Directory Structure

```
app/polls/
├── page.js                     # Polls List Page (GET /api/polls)
├── create/
│   └── page.js                 # Create Poll Page (POST /api/polls)
└── [id]/
    ├── page.js                 # View/Vote Poll Page (GET /api/polls/:id, POST /api/polls/:id/vote)
    └── edit/
        └── page.js             # Edit Poll Page (PUT /api/polls/:id)

components/
├── PollCard.js                 # Poll card component for grid/list display
├── PollForm.js                 # Unified create/edit form
├── PollVoting.js               # Voting interface (simple & complex)
└── PollResults.js              # Results with Chart.js visualization
```

## Component Relationships

```
PollsListPage (page.js)
├── FilterBar (status, type, search)
├── PollCard (for each poll)
│   ├── Badge (type, status, visibility)
│   ├── ImageTopCard
│   └── Link to poll detail
└── Pagination

CreatePollPage (create/page.js)
└── ProtectedRoute
    └── PollForm (mode="create")
        ├── Basic Info (title, description)
        ├── Settings (type, visibility, etc.)
        ├── Options Management (add/remove)
        │   ├── Simple: text inputs
        │   └── Complex: text + photo + link + displayText
        └── Submit/Cancel buttons

PollDetailPage ([id]/page.js)
├── Poll Header
│   ├── Title, Description, Meta
│   └── Edit/Delete buttons (if authorized)
├── PollVoting (if active)
│   ├── SimplePollOptions (radio buttons)
│   └── ComplexPollOptions (image cards)
└── PollResults (if visible)
    ├── Chart Toggle (Bar/Pie/Doughnut)
    ├── Chart Display
    ├── Detailed Results Table
    └── Export Button

EditPollPage ([id]/edit/page.js)
└── ProtectedRoute
    └── PollForm (mode="edit", poll={existingPoll})
```

## Data Flow

```
API Layer (lib/api.js)
    ↓
pollAPI methods
    ↓
Pages (app/polls/*)
    ↓
Components (components/Poll*.js)
    ↓
User Interface
```

## State Management

### Polls List Page
```javascript
- filters (status, type, search)
- page (current page number)
- polls (array of poll objects)
- loading (boolean)
- error (string)
```

### Poll Detail Page
```javascript
- poll (poll object with options and results)
- loading (boolean)
- error (string)
- showDeleteDialog (boolean)
```

### Poll Voting Component
```javascript
- selectedOptionId (number)
- isSubmitting (boolean)
- error (string)
- success (string)
- hasVoted (boolean)
- imageErrors (object) - for complex polls
```

### Poll Results Component
```javascript
- chartType (string: 'bar' | 'pie' | 'doughnut')
```

### Poll Form Component
```javascript
- formData (object with poll settings)
- options (array of option objects)
```

## API Endpoints Used

| Endpoint | Method | Purpose | Page |
|----------|--------|---------|------|
| /api/polls | GET | List all polls | Polls List |
| /api/polls | POST | Create poll | Create Poll |
| /api/polls/:id | GET | Get poll details | Poll Detail |
| /api/polls/:id | PUT | Update poll | Edit Poll |
| /api/polls/:id | DELETE | Delete poll | Poll Detail |
| /api/polls/:id/vote | POST | Submit vote | Poll Detail |
| /api/polls/:id/options | POST | Add user option | (Future) |
| /api/polls/:id/results | GET | Get results | (Future) |

## User Flows

### Creating a Poll
1. Click "Δημιουργία Δημοσκόπησης" in TopNav
2. Fill in poll details (title, description)
3. Select poll type (simple/complex)
4. Configure settings (visibility, results visibility, deadline)
5. Add options (minimum 2)
6. Submit form
7. Redirect to poll detail page

### Voting on a Poll
1. Browse polls list or navigate to poll URL
2. View poll details and options
3. Select an option
4. Click "Υποβολή Ψήφου"
5. See success message
6. View results (if permitted)

### Viewing Results
1. Navigate to poll detail page
2. Results shown if:
   - resultsVisibility = 'always', OR
   - resultsVisibility = 'after_vote' AND user has voted, OR
   - resultsVisibility = 'after_deadline' AND poll is closed, OR
   - User is creator or admin
3. Toggle between chart types
4. View detailed breakdown
5. Export chart as image (optional)

## Permission Checks

### Who Can Create Polls?
- Authenticated users only (ProtectedRoute)

### Who Can Edit Polls?
- Poll creator
- Admins

### Who Can Delete Polls?
- Poll creator
- Admins

### Who Can Vote?
- Authenticated users (always)
- Unauthenticated users (if allowUnauthenticatedVotes = true)

### Who Can View Results?
- Everyone (if resultsVisibility = 'always')
- Voters (if resultsVisibility = 'after_vote')
- Everyone (if resultsVisibility = 'after_deadline' AND poll closed)
- Creator and admins (always)

## Responsive Breakpoints

### Mobile (< 640px)
- Single column layout
- Stacked poll cards
- Mobile menu navigation
- Reduced chart size

### Tablet (640px - 1024px)
- 2 column poll grid
- Responsive charts
- Desktop navigation

### Desktop (> 1024px)
- 3 column poll grid
- Full-size charts
- Desktop navigation with user dropdown

## Greek UI Labels Reference

| English | Greek | Component |
|---------|-------|-----------|
| Polls | Δημοσκοπήσεις | TopNav, Page Title |
| Create Poll | Δημιουργία Δημοσκόπησης | Button, Page Title |
| Vote | Ψηφοφορία | Section Title |
| Results | Αποτελέσματα | Section Title |
| Active | Ενεργή | Badge |
| Closed | Κλειστή | Badge |
| Simple | Απλή | Badge |
| Complex | Σύνθετη | Badge |
| Local | Τοπική | Badge |
| Public | Δημόσια | Select Option |
| Private | Μόνο Συνδεδεμένοι | Select Option |
| Locals Only | Μόνο Τοπικοί | Select Option |
| After Vote | Μετά την Ψηφοφορία | Select Option |
| After Deadline | Μετά την Προθεσμία | Select Option |
| Always | Πάντα | Select Option |
| Submit Vote | Υποβολή Ψήφου | Button |
| Update Vote | Ενημέρωση Ψήφου | Button |
| Edit | Επεξεργασία | Button |
| Delete | Διαγραφή | Button |
| Cancel | Ακύρωση | Button |
| Vote Now | Ψηφοφορία Τώρα | Link |
| View Results | Προβολή Αποτελεσμάτων | Link |
| Bar | Ράβδοι | Chart Toggle |
| Pie | Πίτα | Chart Toggle |
| Doughnut | Ντόνατς | Chart Toggle |
| Export | Εξαγωγή | Button |
