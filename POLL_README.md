# Poll/Voting System - Frontend Quick Start

## 🚀 Getting Started

### 1. Start the Application
```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Start frontend
npm run frontend
```

### 2. Navigate to Polls
Open your browser to: http://localhost:3001/polls

### 3. Create Your First Poll (Login Required)
1. Click "Δημιουργία Ψηφοφορίας" button
2. Fill in poll details
3. Add at least 2 options
4. Submit

### 4. Vote on a Poll
1. Click any poll card
2. Select your choice(s)
3. Click "Υποβολή Ψήφου"
4. View results immediately

## 📋 Features Overview

### Poll Types
- **Simple**: Text-only options
- **Complex**: Options with images and links

### Question Types
- **Single-choice**: Select one option
- **Ranked-choice**: Order preferences
- **Free-text**: Open response

### Views
- **Grid View**: Compact card layout
- **List View**: Detailed card layout

### Filters
- Status (Open/Closed)
- My Polls (authenticated users)

## 🎨 UI Components

### Pages
```
/polls              → Poll listing
/polls/create       → Create new poll
/polls/[id]         → View/vote on poll
```

### Components
```
PollCard           → Poll display card
PollForm           → Poll creation/edit form
VoteInterface      → Interactive voting UI
PollResults        → Results with charts
PollStats          → Statistics widget
```

## 🔑 Key Features

### For All Users
- ✅ View all polls
- ✅ Filter by status
- ✅ Vote on polls (anonymous or authenticated)
- ✅ View results after voting
- ✅ See real-time vote counts

### For Authenticated Users
- ✅ Create polls
- ✅ Edit own polls
- ✅ Delete own polls
- ✅ Filter "My Polls"
- ✅ Vote tracking

### For Admins
- ✅ Edit any poll
- ✅ Delete any poll
- ✅ View all statistics

## 🎯 Example Use Cases

### 1. Quick Opinion Poll
```
Title: "Ποιο είναι το αγαπημένο σας χρώμα;"
Type: Simple, Single-choice
Options: Κόκκινο, Μπλε, Πράσινο
Allow unauthenticated: Yes
```

### 2. Priority Ranking
```
Title: "Κατατάξτε τις προτεραιότητές σας"
Type: Simple, Ranked-choice
Options: Υγεία, Εκπαίδευση, Περιβάλλον
Allow unauthenticated: No
```

### 3. Feedback Collection
```
Title: "Τι θα θέλατε να βελτιώσουμε;"
Type: Simple, Free-text
Allow unauthenticated: Yes
```

### 4. Complex Decision
```
Title: "Ποιο project να υλοποιήσουμε;"
Type: Complex, Single-choice
Options: (with images and links to proposals)
Allow unauthenticated: No
```

## 📊 Results Visualization

After voting, you'll see:
- Total vote count
- Option breakdown with percentages
- Horizontal bar chart
- Pie chart
- Progress bars

For ranked-choice polls:
- Rank distribution table
- First-choice preferences
- Full ranking breakdown

## 🔐 Security Features

### Vote Protection
- Authenticated users: Tracked by backend
- Anonymous users: Session ID in localStorage
- Duplicate prevention: Both methods

### Permissions
- Only creator/admin can edit/delete
- Protected routes for poll creation
- CSRF token protection on all API calls

## 💡 Tips

### Creating Effective Polls
1. **Clear Title**: Be specific about what you're asking
2. **Sufficient Options**: Provide meaningful choices
3. **Option Order**: Consider randomizing to avoid bias
4. **Description**: Add context if needed
5. **Allow Anonymous**: Enable for broader participation

### Best Practices
- Test with both logged-in and anonymous users
- Check results on different devices
- Use complex polls for detailed options
- Use ranked-choice for priority questions
- Use free-text for open feedback

## 🐛 Troubleshooting

### Poll Not Appearing
- Check poll status (must be "open")
- Verify backend is running
- Check browser console for errors

### Cannot Vote
- Check if poll is open
- Verify you haven't voted already
- Clear localStorage if testing
- Check if anonymous voting is allowed

### Results Not Showing
- Ensure poll has votes
- Check if you've voted (required to see results)
- Refresh the page
- Check browser console

### Charts Not Displaying
- Verify Chart.js loaded (check network tab)
- Ensure results data exists
- Check for JavaScript errors

## 📱 Mobile Experience

### Optimized For
- Touch interactions
- Small screens (320px+)
- Portrait and landscape
- Swipe gestures (where applicable)

### Mobile Features
- Collapsible navigation
- Stacked layouts
- Larger touch targets
- Readable font sizes

## 🌐 Browser Support

### Tested On
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Requirements
- JavaScript enabled
- localStorage available
- Modern CSS support (Grid, Flexbox)

## 📖 Learn More

### Documentation
- `POLL_IMPLEMENTATION_SUMMARY.md` - Complete overview
- `POLL_FRONTEND_IMPLEMENTATION.md` - Technical details
- `POLL_TESTING_GUIDE.md` - Testing instructions
- `POLL_IMPLEMENTATION.md` - Backend API docs

### Code Examples
All components are in:
- `components/Poll*.js` - Poll components
- `app/polls/**/*.js` - Poll pages
- `lib/api.js` - API methods

## 🚀 Quick Commands

```bash
# Build frontend
npm run frontend:build

# Start frontend dev server
npm run frontend

# View all npm scripts
npm run

# Check git status
git status

# View recent changes
git diff
```

## 🎉 You're Ready!

The poll system is now fully functional. Start by:
1. Creating a test poll
2. Voting on it (as different users)
3. Viewing the results
4. Exploring the different poll types

Enjoy using the poll/voting system! 🗳️
